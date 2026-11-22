import { contactInputSchema, analyticsSessionSchema, eventInputSchema } from '../../src/schemas/public-input.ts'
import { json } from './auth.ts'
import type { webcrypto } from 'node:crypto'

export interface PublicInputBindings {
  SUPABASE_URL?: string
  SUPABASE_SERVICE_ROLE_KEY?: string
  TURNSTILE_SECRET_KEY?: string
  PUBLIC_INPUT_SECRET?: string
  PUBLIC_INPUT_ORIGIN?: string
  PUBLIC_INPUT_LIMITER?: { limit(options: { key: string }): Promise<{ success: boolean }> }
}

const routes = new Set(['/api/contact', '/api/events', '/api/analytics-session'])
export const isPublicInputRoute = (path: string): boolean => routes.has(path)
const MAX_BODY = 24_576
const PROOF_SECONDS = 600

class InputError extends Error {
  readonly status: number
  constructor(message: string, status: number) { super(message); this.status = status }
}

async function readBody(request: Request): Promise<unknown> {
  if (request.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() !== 'application/json') throw new InputError('JSON required', 415)
  if (Number(request.headers.get('content-length')) > MAX_BODY) throw new InputError('request too large', 413)
  if (!request.body) throw new InputError('body required', 400)
  const reader = request.body.getReader()
  const parts: Uint8Array[] = []
  let size = 0
  try {
    while (true) {
      const part = await reader.read()
      if (part.done) break
      size += part.value.byteLength
      if (size > MAX_BODY) { await reader.cancel(); throw new InputError('request too large', 413) }
      parts.push(part.value)
    }
  } finally { reader.releaseLock() }
  const bytes = new Uint8Array(size)
  let offset = 0
  for (const part of parts) { bytes.set(part, offset); offset += part.byteLength }
  try { return JSON.parse(new TextDecoder().decode(bytes)) as unknown }
  catch { throw new InputError('invalid JSON', 400) }
}

async function hmacKey(secret: string): Promise<webcrypto.CryptoKey> {
  return crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify'])
}

async function sign(key: webcrypto.CryptoKey, value: string): Promise<string> {
  const bytes = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value)))
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

async function validProof(proof: string, source: string, key: webcrypto.CryptoKey): Promise<boolean> {
  const [expiry, signature] = proof.split('.')
  const now = Math.floor(Date.now() / 1000)
  const expires = Number(expiry)
  if (!signature || expires <= now || expires > now + PROOF_SECONDS) return false
  const bytes = Uint8Array.from(signature.match(/../g) ?? [], (pair) => Number.parseInt(pair, 16))
  return crypto.subtle.verify('HMAC', key, bytes, new TextEncoder().encode(`analytics:${source}:${expiry}`))
}

export async function handlePublicInput(request: Request, env: PublicInputBindings, clientIp: string | null): Promise<Response> {
  if (request.method !== 'POST') {
    const response = json({ error: 'method not allowed' }, 405)
    response.headers.set('Allow', 'POST')
    return response
  }
  const { SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: serviceKey, TURNSTILE_SECRET_KEY: botKey, PUBLIC_INPUT_SECRET: secret, PUBLIC_INPUT_ORIGIN: configuredOrigin } = env
  if (!url || !serviceKey || !botKey || !secret || secret.length < 32 || !configuredOrigin || !env.PUBLIC_INPUT_LIMITER) return json({ error: 'public input is not configured' }, 503)
  try {
    const origin = new URL(configuredOrigin).origin
    if (request.headers.get('origin') !== origin || request.headers.get('sec-fetch-site') === 'cross-site') throw new InputError('origin rejected', 403)
    // The Worker supplies Cloudflare's trusted edge header, never X-Forwarded-For.
    if (!clientIp || clientIp.length > 64 || !/^[a-f0-9:.]+$/i.test(clientIp)) throw new InputError('client source unavailable', 503)
    const body = await readBody(request)
    const path = new URL(request.url).pathname
    const parsed = path === '/api/contact' ? contactInputSchema.safeParse(body) : path === '/api/events' ? eventInputSchema.safeParse(body) : analyticsSessionSchema.safeParse(body)
    if (!parsed.success) throw new InputError('invalid input', 400)
    const key = await hmacKey(secret)
    // Daily, keyed hashes support abuse limits; no raw IP reaches the database.
    const source = await sign(key, `rate:${new Date().toISOString().slice(0, 10)}:${clientIp.toLowerCase()}`)
    // A cheap edge gate protects upstream services; SQL counters enforce the
    // strict per-source quotas across Cloudflare locations and Worker instances.
    if (!(await env.PUBLIC_INPUT_LIMITER.limit({ key: source })).success) throw new InputError('too many requests', 429)
    const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' }
    const post = async (target: string, payload: unknown) => fetch(`${url}/rest/v1/${target}`, {
      method: 'POST', headers, body: JSON.stringify(payload), signal: AbortSignal.timeout(5000),
    })
    const limit = async (scope: 'contact' | 'events' | 'challenge') => {
      const response = await post('rpc/consume_public_input', { p_scope: scope, p_source: source })
      if (!response.ok) throw new InputError('input temporarily unavailable', 503)
      const allowed: unknown = await response.json()
      if (allowed === false) throw new InputError('too many requests', 429)
      if (allowed !== true) throw new InputError('input temporarily unavailable', 503)
    }
    const verifyBot = async (token: string, action: 'contact' | 'analytics') => {
      const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST', body: new URLSearchParams({ secret: botKey, response: token }), signal: AbortSignal.timeout(5000),
      })
      if (!response.ok) throw new InputError('verification temporarily unavailable', 503)
      const result: unknown = await response.json()
      if (!result || typeof result !== 'object' || !('success' in result) || result.success !== true
        || !('hostname' in result) || result.hostname !== new URL(origin).hostname
        || !('action' in result) || result.action !== action) throw new InputError('verification rejected', 403)
    }

    if (path === '/api/analytics-session') {
      const input = analyticsSessionSchema.parse(parsed.data)
      await limit('challenge')
      await verifyBot(input.botToken, 'analytics')
      const expires = Math.floor(Date.now() / 1000) + PROOF_SECONDS
      return json({ proof: `${expires}.${await sign(key, `analytics:${source}:${expires}`)}`, expires })
    }
    if (path === '/api/contact') {
      const input = contactInputSchema.parse(parsed.data)
      if (input.website) return json({ ok: true }) // Supplementary honeypot; never writes.
      await limit('contact')
      await verifyBot(input.botToken, 'contact')
      const response = await post('messages', { name: input.name, email: input.email, body: input.body })
      if (!response.ok) throw new InputError('message temporarily unavailable', 503)
    } else if (path === '/api/events') {
      const input = eventInputSchema.parse(parsed.data)
      if (!await validProof(input.proof, source, key)) throw new InputError('verification expired or invalid', 401)
      await limit('events')
      const response = await post('events', { name: input.name, label: input.label ?? null, path: input.path })
      if (!response.ok) throw new InputError('analytics temporarily unavailable', 503)
    } else return json({ error: 'not found' }, 404)
    return json({ ok: true })
  } catch (error) {
    const response = json({ error: error instanceof InputError ? error.message : 'input temporarily unavailable' }, error instanceof InputError ? error.status : 503)
    if (response.status === 429) response.headers.set('Retry-After', '600')
    return response
  }
}
