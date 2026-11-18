/**
 * prebuild: pull published content from Supabase → src/data/generated/content.json.
 *
 * - With SUPABASE_URL + SUPABASE_ANON_KEY (or the VITE_ variants): fetch, validate, write.
 * - Without them (local dev, forks, CI): keep the committed snapshot, but still validate it.
 * Either way an invalid snapshot fails the build instead of shipping broken content.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { contentSchema } from '../src/schemas/content.ts'
import { fetchPublishedContent } from './content-source.ts'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const target = path.join(root, 'src/data/generated/content.json')

const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
const anonKey = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY

async function main(): Promise<void> {
  if (!url || !anonKey) {
    contentSchema.parse(JSON.parse(readFileSync(target, 'utf8')))
    console.log('[pull-content] Supabase not configured → using committed snapshot (validated ✓)')
    return
  }
  const content = await fetchPublishedContent({ url, anonKey })
  writeFileSync(target, `${JSON.stringify(content, null, 2)}\n`)
  console.log(
    `[pull-content] ✓ ${content.projects.length} projects, ${content.badges.length} badges, ${content.experiences.length} experiences`,
  )
}

main().catch((error: unknown) => {
  console.error('[pull-content] ✗', error instanceof Error ? error.message : error)
  process.exit(1)
})
