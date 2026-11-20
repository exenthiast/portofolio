/** Vercel adapter retained while Cloudflare becomes the primary host. */
import { publishContent } from './_lib/publish.ts'
import { json, readEnv } from './_lib/auth.ts'

export async function POST(request: Request): Promise<Response> {
  const env = readEnv()
  const hook = process.env.VERCEL_DEPLOY_HOOK_URL
  if (!env || !hook) return json({ error: 'server is not configured (SUPABASE_* / VERCEL_DEPLOY_HOOK_URL)' }, 500)
  return publishContent(request, env, hook)
}
