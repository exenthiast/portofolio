/** Anonymous event counters; no cookies or identifiers in analytics rows. */
import { getBotToken, isPublicInputConfigured } from './bot-check'
import type { AnalyticsEvent } from '../types/public-input'
export type { AnalyticsEvent } from '../types/public-input'

let session: Promise<{ proof: string; expires: number }> | null = null
let expiresAt = 0

async function analyticsSession(): Promise<{ proof: string; expires: number }> {
  if (session && Date.now() < expiresAt - 5000) return session
  if (session && expiresAt === 0) return session
  expiresAt = 0
  session = (async () => {
    const botToken = await getBotToken('analytics')
    const res = await fetch('/api/analytics-session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ botToken }) })
    if (!res.ok) throw new Error('Analytics verification unavailable')
    const data: unknown = await res.json()
    if (!data || typeof data !== 'object' || !('proof' in data) || typeof data.proof !== 'string'
      || !('expires' in data) || typeof data.expires !== 'number') throw new Error('Invalid analytics verification')
    expiresAt = data.expires * 1000
    return { proof: data.proof, expires: data.expires }
  })().catch((error: unknown) => { session = null; expiresAt = 0; throw error })
  return session
}

export function track(name: AnalyticsEvent, label?: string): void {
  if (!isPublicInputConfigured || import.meta.env.DEV) return
  void (async () => {
    const { proof } = await analyticsSession()
    const res = await fetch('/api/events', {
      method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, label: label?.slice(0, 120) ?? null, path: window.location.pathname.slice(0, 200), proof }),
    })
    if (res.status === 401) { session = null; expiresAt = 0 }
  })().catch(() => { /* Analytics failure never blocks the portfolio. */ })
}
