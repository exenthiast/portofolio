import { json, requireAdmin, type ServerEnv } from '../api/_lib/auth.ts'
import { publishContent } from '../api/_lib/publish.ts'

export interface WorkerEnv {
  ASSETS: { fetch(request: Request): Promise<Response> }
  SUPABASE_URL?: string
  SUPABASE_ANON_KEY?: string
  CLOUDFLARE_DEPLOY_HOOK_URL?: string
}

function serverEnv(env: WorkerEnv): ServerEnv | null {
  return env.SUPABASE_URL && env.SUPABASE_ANON_KEY
    ? { supabaseUrl: env.SUPABASE_URL, supabaseAnonKey: env.SUPABASE_ANON_KEY }
    : null
}

function secure(response: Response, admin: boolean): Response {
  const result = new Response(response.body, response)
  result.headers.set('X-Content-Type-Options', 'nosniff')
  result.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  result.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  result.headers.set('X-Frame-Options', 'SAMEORIGIN')
  result.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  if (admin) {
    result.headers.set('X-Robots-Tag', 'noindex, nofollow')
    result.headers.set('Cache-Control', 'no-store')
  }
  return result
}

async function handle(request: Request, env: WorkerEnv): Promise<Response> {
  const url = new URL(request.url)
  if (url.pathname === '/api' || url.pathname.startsWith('/api/')) {
    const method = url.pathname === '/api/publish' ? 'POST' : url.pathname === '/api/deploy-status' ? 'GET' : null
    if (!method) return json({ error: 'not found' }, 404)
    if (request.method !== method) {
      const response = json({ error: 'method not allowed' }, 405)
      response.headers.set('Allow', method)
      return response
    }
    const config = serverEnv(env)
    if (!config) return json({ error: 'server is not configured (SUPABASE_URL / SUPABASE_ANON_KEY)' }, 500)
    if (url.pathname === '/api/publish') {
      if (!env.CLOUDFLARE_DEPLOY_HOOK_URL) {
        const session = await requireAdmin(request, config)
        if (session instanceof Response) return session
        return json({ error: 'CLOUDFLARE_DEPLOY_HOOK_URL is not configured' }, 500)
      }
      return publishContent(request, config, env.CLOUDFLARE_DEPLOY_HOOK_URL)
    }
    const session = await requireAdmin(request, config)
    if (session instanceof Response) return session
    // Build status is checked in the Cloudflare dashboard until status integration is configured.
    return json({ state: 'unknown' })
  }

  if (!['GET', 'HEAD'].includes(request.method)) return json({ error: 'method not allowed' }, 405)
  if (url.pathname === '/admin' || url.pathname.startsWith('/admin/')) {
    url.pathname = '/admin.html'
    return env.ASSETS.fetch(new Request(url, request))
  }
  const response = await env.ASSETS.fetch(request)
  if (response.status !== 404 || /\.[^/]+$/.test(url.pathname)) return response
  url.pathname = '/index.html'
  return env.ASSETS.fetch(new Request(url, request))
}

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    const path = new URL(request.url).pathname
    const admin = path === '/admin' || path.startsWith('/admin/') || path === '/admin.html'
    try {
      return secure(await handle(request, env), admin)
    } catch {
      return secure(json({ error: 'request failed; check Worker logs' }, 502), admin)
    }
  },
}
