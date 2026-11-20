import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import worker, { type WorkerEnv } from '../cloudflare/worker.ts'

const request = (path: string, method = 'GET', token?: string) => new Request(`https://portfolio.example${path}`, {
  method, headers: token ? { Authorization: `Bearer ${token}` } : {},
})

function environment(): WorkerEnv {
  return {
    SUPABASE_URL: 'https://supabase.example', SUPABASE_ANON_KEY: 'public-key',
    CLOUDFLARE_DEPLOY_HOOK_URL: 'https://hook.example/build',
    ASSETS: { async fetch(req) {
      const path = new URL(req.url).pathname
      return ['/index.html', '/admin.html', '/assets/app.js'].includes(path)
        ? new Response(path, { headers: { 'Content-Type': path.endsWith('.js') ? 'text/javascript' : 'text/html' } })
        : new Response('missing', { status: 404 })
    } },
  }
}

test('Cloudflare routes admin deep links, public routes and missing assets separately', async () => {
  for (const path of ['/admin', '/admin/', '/admin/profile', '/admin/projects/example']) {
    const res = await worker.fetch(request(path), environment())
    assert.equal(await res.text(), '/admin.html')
    assert.equal(res.headers.get('X-Robots-Tag'), 'noindex, nofollow')
    assert.equal(res.headers.get('Cache-Control'), 'no-store')
  }
  for (const path of ['/', '/index.html', '/unknown-page']) {
    const res = await worker.fetch(request(path), environment())
    assert.equal(await res.text(), '/index.html')
    assert.equal(res.headers.get('X-Content-Type-Options'), 'nosniff')
  }
  assert.equal((await worker.fetch(request('/missing.webp'), environment())).status, 404)
  assert.equal(await (await worker.fetch(request('/assets/app.js'), environment())).text(), '/assets/app.js')
  assert.equal((await worker.fetch(request('/api/unknown'), environment())).status, 404)
  const res = await worker.fetch(request('/api/publish'), environment())
  assert.equal(res.status, 405)
  assert.equal(res.headers.get('Allow'), 'POST')
})

test('Cloudflare APIs retain server authentication and admin allowlist enforcement', async (t) => {
  t.mock.method(globalThis, 'fetch', async (input: string | URL | Request) => {
    const url = String(input)
    return url.includes('/auth/v1/user') ? Response.json({ email: 'outsider@example.com' }) : Response.json(false)
  })
  for (const [path, method] of [['/api/publish', 'POST'], ['/api/deploy-status', 'GET']]) {
    assert.equal((await worker.fetch(request(path, method), environment())).status, 401)
    assert.equal((await worker.fetch(request(path, method, 'outsider'), environment())).status, 403)
  }
})

test('Cloudflare publish validates and logs the existing snapshot without exposing its deploy hook', async (t) => {
  const content = JSON.parse(readFileSync(new URL('../src/data/generated/content.json', import.meta.url), 'utf8'))
  const writes: string[] = []
  t.mock.method(globalThis, 'fetch', async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input)
    if (url.includes('/auth/v1/user')) return Response.json({ email: 'owner@example.com' })
    if (url.endsWith('/rpc/is_admin')) return Response.json(true)
    if (url.includes('/rest/v1/profile?')) return Response.json([{ data: content.profile }])
    for (const table of ['projects', 'badges', 'experiences']) {
      if (url.includes(`/rest/v1/${table}?`)) {
        assert.ok(url.includes('status=eq.published'))
        return Response.json(content[table].map((data: unknown) => ({ data })))
      }
    }
    if (init?.method === 'POST') writes.push(url)
    if (url === 'https://hook.example/build') return Response.json({ success: true })
    if (url.endsWith('/publish_log')) {
      const entry = JSON.parse(String(init?.body))
      assert.equal(entry.status, 'queued')
      assert.deepEqual(entry.snapshot, content)
      return Response.json([{ id: 9 }])
    }
    throw new Error('Unexpected request')
  })
  const res = await worker.fetch(request('/api/publish', 'POST', 'owner'), environment())
  assert.equal(res.status, 200)
  const body = await res.text()
  assert.equal(JSON.parse(body).publishId, 9)
  assert.ok(!body.includes('hook.example'))
  assert.deepEqual(writes, ['https://hook.example/build', 'https://supabase.example/rest/v1/publish_log'])
  const status = await worker.fetch(request('/api/deploy-status', 'GET', 'owner'), environment())
  assert.deepEqual(await status.json(), { state: 'unknown' })
})

test('Cloudflare keeps deployment disabled without a hook and reports asset failures', async (t) => {
  t.mock.method(globalThis, 'fetch', async (input: string | URL | Request) => String(input).includes('/auth/v1/user')
    ? Response.json({ email: 'owner@example.com' }) : Response.json(true))
  const env = environment()
  delete env.CLOUDFLARE_DEPLOY_HOOK_URL
  assert.equal((await worker.fetch(request('/api/publish', 'POST', 'owner'), env)).status, 500)
  env.ASSETS.fetch = async () => { throw new Error('Private internal detail') }
  const res = await worker.fetch(request('/'), env)
  assert.equal(res.status, 502)
  assert.ok(!(await res.text()).includes('Private internal detail'))
})
