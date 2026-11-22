import test from 'node:test'
import assert from 'node:assert/strict'
import { handlePublicInput, type PublicInputBindings } from '../api/_lib/public-input.ts'
import worker from '../cloudflare/worker.ts'

const env: PublicInputBindings = {
  SUPABASE_URL: 'https://supabase.example', SUPABASE_SERVICE_ROLE_KEY: 'synthetic-server-only-key',
  TURNSTILE_SECRET_KEY: 'synthetic-bot-secret', PUBLIC_INPUT_SECRET: 'synthetic-signing-secret-at-least-32-characters', PUBLIC_INPUT_ORIGIN: 'https://portfolio.example',
  PUBLIC_INPUT_LIMITER: { async limit() { return { success: true } } },
}
const ip = '192.0.2.10'
const message = { name: 'Fixture visitor', email: 'visitor@example.invalid', body: 'Synthetic contact message', botToken: 'single-use-fixture' }
const request = (path: string, body: unknown, headers: Record<string, string> = {}) => new Request(`https://portfolio.example/api/${path}`, {
  method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://portfolio.example', ...headers }, body: JSON.stringify(body),
})
const verification = (action = 'contact') => ({ success: true, hostname: 'portfolio.example', action })

test('public input fails closed before upstream calls on bad configuration, source, origin, or shape', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => { throw new Error('Unexpected upstream request') })
  assert.equal((await handlePublicInput(request('contact', message), {}, ip)).status, 503)
  assert.equal((await handlePublicInput(request('contact', message), env, null)).status, 503)
  assert.equal((await handlePublicInput(request('contact', message, { Origin: 'https://attacker.example' }), env, ip)).status, 403)
  assert.equal((await handlePublicInput(request('contact', message, { 'Sec-Fetch-Site': 'cross-site' }), env, ip)).status, 403)
  assert.equal((await handlePublicInput(request('contact', message, { 'Content-Type': 'text/plain' }), env, ip)).status, 415)
  for (const body of [{ ...message, created_at: '2099-01-01' }, { ...message, body: 'short' }, { ...message, email: 'invalid' }, { ...message, botToken: '' }, { ...message, name: ' '.repeat(10) }]) {
    assert.equal((await handlePublicInput(request('contact', body), env, ip)).status, 400)
  }
  assert.equal((await handlePublicInput(request('contact', { ...message, body: 'x'.repeat(25_000) }), env, ip)).status, 413)
})

test('rejected, replayed, wrong-host and wrong-action bot tokens cannot insert contact rows', async (t) => {
  let result: unknown
  let writes = 0
  t.mock.method(globalThis, 'fetch', async (input: string | URL | Request) => {
    const url = String(input)
    if (url.endsWith('/rpc/consume_public_input')) return Response.json(true)
    if (url.includes('/siteverify')) return Response.json(result)
    writes++
    throw new Error('Unexpected insert')
  })
  for (const candidate of [{ success: false, 'error-codes': ['timeout-or-duplicate'] }, { ...verification(), hostname: 'attacker.example' }, verification('analytics'), { ...verification(), success: 'true' }]) {
    result = candidate
    assert.equal((await handlePublicInput(request('contact', message), env, ip)).status, 403)
  }
  assert.equal(writes, 0)
})

test('valid contact writes only selected fields using server credentials and keyed source limits', async (t) => {
  const sources: string[] = []
  let inserts = 0
  t.mock.method(globalThis, 'fetch', async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input)
    if (url.endsWith('/rpc/consume_public_input')) {
      const body = JSON.parse(String(init?.body))
      assert.equal(body.p_scope, 'contact')
      assert.match(body.p_source, /^[a-f0-9]{64}$/)
      assert.ok(!String(init?.body).includes(ip))
      sources.push(body.p_source)
      return Response.json(sources.length < 3)
    }
    if (url.includes('/siteverify')) return Response.json(verification())
    assert.ok(url.endsWith('/messages'))
    assert.equal(new Headers(init?.headers).get('apikey'), env.SUPABASE_SERVICE_ROLE_KEY)
    assert.deepEqual(Object.keys(JSON.parse(String(init?.body))).sort(), ['body','email','name'])
    inserts++
    return new Response(null, { status: 201 })
  })
  for (const email of ['one@example.invalid','two@example.invalid']) {
    const res = await handlePublicInput(request('contact', { ...message, email }), env, ip)
    assert.equal(res.status, 200)
    assert.deepEqual(await res.json(), { ok: true })
  }
  const blocked = await handlePublicInput(request('contact', { ...message, email: 'three@example.invalid' }), env, ip)
  assert.equal(blocked.status, 429)
  assert.equal(blocked.headers.get('Retry-After'), '600')
  assert.equal(new Set(sources).size, 1, 'Rotating email must not rotate source quota')
  assert.equal(inserts, 2)
})

test('analytics needs a valid short-lived proof bound to the verified source', async (t) => {
  let inserts = 0
  const now = Date.now()
  t.mock.method(globalThis, 'fetch', async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input)
    if (url.endsWith('/rpc/consume_public_input')) return Response.json(true)
    if (url.includes('/siteverify')) return Response.json(verification('analytics'))
    assert.ok(url.endsWith('/events'))
    assert.deepEqual(JSON.parse(String(init?.body)), { name: 'page_view', label: null, path: '/' })
    inserts++
    return new Response(null, { status: 201 })
  })
  const challenge = await handlePublicInput(request('analytics-session', { botToken: 'analytics-fixture' }), env, ip)
  assert.equal(challenge.status, 200)
  const { proof } = await challenge.json() as { proof: string }
  const event = { name: 'page_view', path: '/', proof }
  assert.equal((await handlePublicInput(request('events', event), env, ip)).status, 200)
  assert.equal((await handlePublicInput(request('events', event), env, '192.0.2.11')).status, 401)
  assert.equal((await handlePublicInput(request('events', { ...event, proof: `${proof.slice(0, 11)}${'0'.repeat(64)}` }), env, ip)).status, 401)
  for (const payload of [{ ...event, created_at: '2099-01-01' }, { ...event, name: 'invalid' }, { ...event, label: 'x'.repeat(121) }, { ...event, path: '/'.repeat(201) }]) {
    assert.equal((await handlePublicInput(request('events', payload), env, ip)).status, 400)
  }
  t.mock.method(Date, 'now', () => now + 601_000)
  assert.equal((await handlePublicInput(request('events', event), env, ip)).status, 401)
  assert.equal(inserts, 1)
})

test('upstream failures never expose secrets or silently accept a lost message', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => { throw new Error('synthetic private backend details') })
  const res = await handlePublicInput(request('contact', message), env, ip)
  assert.equal(res.status, 503)
  const body = await res.text()
  assert.ok(!body.includes('private backend') && !body.includes('synthetic-server-only-key'))
})

test('edge throttle rejects traffic without spending database or bot-verification requests', async (t) => {
  let calls = 0
  t.mock.method(globalThis, 'fetch', async () => { calls++; throw new Error('Unexpected upstream call') })
  const blocked = { ...env, PUBLIC_INPUT_LIMITER: { async limit() { return { success: false } } } }
  assert.equal((await handlePublicInput(request('contact', message), blocked, ip)).status, 429)
  assert.equal(calls, 0)
})

test('Worker wires protected endpoints and trusts only the Cloudflare client source', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => { throw new Error('Must reject before upstream') })
  const bindings = { ...env, ASSETS: { async fetch() { return new Response('fixture') } } }
  assert.equal((await worker.fetch(request('contact', message, { 'X-Forwarded-For': ip }), bindings)).status, 503)
  assert.equal((await worker.fetch(request('contact', message, { 'CF-Connecting-IP': ip, Origin: 'https://attacker.example' }), bindings)).status, 403)
  const res = await worker.fetch(new Request('https://portfolio.example/api/events'), bindings)
  assert.equal(res.status, 405)
  assert.equal(res.headers.get('Allow'), 'POST')
})
