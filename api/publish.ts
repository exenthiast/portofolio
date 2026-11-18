/**
 * POST /api/publish — admin-only.
 * 1. verify session + allowlist, 2. snapshot published content (validated),
 * 3. trigger the Vercel Deploy Hook, 4. record the snapshot in publish_log.
 * The deploy hook URL only exists in server env — never in the client bundle.
 */
import { fetchPublishedContent } from '../scripts/content-source.ts'
import { json, readEnv, requireAdmin } from './_lib/auth.ts'

export async function POST(request: Request): Promise<Response> {
  const env = readEnv()
  const hook = process.env.VERCEL_DEPLOY_HOOK_URL
  if (!env || !hook) return json({ error: 'server is not configured (SUPABASE_* / VERCEL_DEPLOY_HOOK_URL)' }, 500)

  const session = await requireAdmin(request, env)
  if (session instanceof Response) return session

  let snapshot
  try {
    snapshot = await fetchPublishedContent({
      url: env.supabaseUrl,
      anonKey: env.supabaseAnonKey,
      accessToken: session.accessToken,
    })
  } catch (error) {
    // Validation failed: refuse to deploy content the build would reject anyway.
    return json({ error: 'content is invalid', detail: error instanceof Error ? error.message : String(error) }, 422)
  }

  const hookRes = await fetch(hook, { method: 'POST' })
  const ok = hookRes.ok

  const logRes = await fetch(`${env.supabaseUrl}/rest/v1/publish_log`, {
    method: 'POST',
    headers: {
      apikey: env.supabaseAnonKey,
      Authorization: `Bearer ${session.accessToken}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      status: ok ? 'queued' : 'error',
      message: ok ? null : `deploy hook HTTP ${hookRes.status}`,
      snapshot,
    }),
  })
  const [entry] = logRes.ok ? ((await logRes.json()) as { id: number }[]) : []

  return ok
    ? json({ ok: true, publishId: entry?.id ?? null, actor: session.email })
    : json({ error: `deploy hook failed (HTTP ${hookRes.status})` }, 502)
}
