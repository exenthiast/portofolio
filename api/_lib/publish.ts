import { fetchPublishedContent } from '../../scripts/content-source.ts'
import { json, requireAdmin, type ServerEnv } from './auth.ts'

/** Shared publish operation; hosting adapters supply their own server configuration. */
export async function publishContent(request: Request, env: ServerEnv, hook: string): Promise<Response> {
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
