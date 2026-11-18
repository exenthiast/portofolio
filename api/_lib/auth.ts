/**
 * Server-side helpers for Vercel Functions (files under api/_lib are not routes).
 * Every admin endpoint re-verifies the Supabase session AND the DB allowlist —
 * the client-side guard in the dashboard is only UX.
 */
export interface ServerEnv {
  supabaseUrl: string
  supabaseAnonKey: string
}

export function readEnv(): ServerEnv | null {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY
  return supabaseUrl && supabaseAnonKey ? { supabaseUrl, supabaseAnonKey } : null
}

export const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })

export interface AdminSession {
  email: string
  accessToken: string
}

/** Returns the admin session, or a ready-to-send error Response. */
export async function requireAdmin(request: Request, env: ServerEnv): Promise<AdminSession | Response> {
  const header = request.headers.get('authorization') ?? ''
  const accessToken = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!accessToken) return json({ error: 'missing bearer token' }, 401)

  const userRes = await fetch(`${env.supabaseUrl}/auth/v1/user`, {
    headers: { apikey: env.supabaseAnonKey, Authorization: `Bearer ${accessToken}` },
  })
  if (!userRes.ok) return json({ error: 'invalid session' }, 401)
  const user = (await userRes.json()) as { email?: string }

  // is_admin() reads the email from the verified JWT inside Postgres.
  const adminRes = await fetch(`${env.supabaseUrl}/rest/v1/rpc/is_admin`, {
    method: 'POST',
    headers: {
      apikey: env.supabaseAnonKey,
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: '{}',
  })
  if (!adminRes.ok || (await adminRes.json()) !== true) return json({ error: 'not in the sudoers file' }, 403)

  return { email: user.email ?? 'unknown', accessToken }
}
