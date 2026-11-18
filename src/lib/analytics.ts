/**
 * Privacy-friendly event tracking (no cookies, no user identifiers).
 * Writes straight to the Supabase `events` table through PostgREST with the anon key,
 * so the public bundle does not ship the Supabase SDK. No-op when env is missing.
 */
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export type AnalyticsEvent =
  | 'page_view'
  | 'cv_open'
  | 'cv_download'
  | 'project_open'
  | 'badge_open'
  | 'terminal_command'
  | 'contact_copy_email'

export const isBackendConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)

export async function restInsert(table: string, row: Record<string, unknown>): Promise<boolean> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return false
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: 'POST',
      keepalive: true,
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(row),
    })
    return res.ok
  } catch {
    return false
  }
}

export function track(name: AnalyticsEvent, label?: string): void {
  if (!isBackendConfigured || import.meta.env.DEV) return
  void restInsert('events', { name, label: label?.slice(0, 120) ?? null, path: window.location.pathname })
}
