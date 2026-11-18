import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { loadEnv, type Plugin } from 'vite'
import { fetchPublishedContent } from './content-source.ts'

/** Refresh the public snapshot after admin saves, only on the Vite dev server. */
export function contentSyncPlugin(): Plugin {
  let snapshotPath: string
  return {
    name: 'content-sync',
    apply: 'serve',
    configureServer(server) {
      const env = loadEnv(server.config.mode, server.config.envDir, '')
      const url = env.SUPABASE_URL ?? env.VITE_SUPABASE_URL
      const anonKey = env.SUPABASE_ANON_KEY ?? env.VITE_SUPABASE_ANON_KEY
      const target = path.join(server.config.root, 'src/data/generated/content.json')
      snapshotPath = target

      // Serialize pulls so an earlier request cannot overwrite a later save.
      let pending = Promise.resolve()
      const sync = () => {
        const next = pending.then(async () => {
          if (!url || !anonKey) throw new Error('Supabase is not configured')
          const content = await fetchPublishedContent({ url, anonKey })
          const snapshot = `${JSON.stringify(content, null, 2)}\n`
          if (snapshot !== await readFile(target, 'utf8')) await writeFile(target, snapshot)
        })
        pending = next.catch(() => {})
        return next
      }

      server.middlewares.use((req, res, next) => {
        if (req.url?.split('?')[0] !== '/__dev/content-sync') return next()
        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Cache-Control', 'no-store')
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.setHeader('Allow', 'POST')
          return res.end(JSON.stringify({ error: 'Method not allowed' }))
        }
        const origin = `${server.config.server.https ? 'https' : 'http'}://${req.headers.host}`
        if (req.headers.origin !== origin || req.headers['x-portfolio-sync'] !== '1') {
          res.statusCode = 403
          return res.end(JSON.stringify({ error: 'Same-origin admin request required' }))
        }
        void sync().then(
          () => res.end(JSON.stringify({ ok: true })),
          (error: unknown) => {
            server.config.logger.error(`[content-sync] ${error instanceof Error ? error.message : String(error)}`)
            res.statusCode = 500
            res.end(JSON.stringify({ error: 'Local preview sync failed; check the Vite terminal' }))
          },
        )
      })
    },
    handleHotUpdate(context) {
      if (context.file !== snapshotPath) return
      // The admin also imports the bundled snapshot. Avoid a global full reload
      // interrupting its save/navigation; only public portfolio tabs reload.
      for (const module of context.modules) context.server.moduleGraph.invalidateModule(module)
      context.server.ws.send({ type: 'custom', event: 'portfolio:content-updated' })
      return []
    },
  }
}
