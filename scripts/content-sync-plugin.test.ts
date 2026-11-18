import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, mkdir, writeFile, stat } from 'node:fs/promises'
import { createServer as createHttpServer } from 'node:http'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { createServer } from 'vite'
import { contentSchema } from '../src/schemas/content.ts'
import { contentSyncPlugin } from './content-sync-plugin.ts'

test('local content sync preserves published-only content and the last valid snapshot', async (t) => {
  const content = contentSchema.parse(JSON.parse(await readFile(new URL('../src/data/generated/content.json', import.meta.url), 'utf8')))
  let fail = false
  let pulls = 0
  const upstream = createHttpServer((req, res) => {
    pulls++
    res.setHeader('Content-Type', 'application/json')
    if (fail) {
      res.statusCode = 503
      return res.end(JSON.stringify({ error: 'Temporary outage' }))
    }
    const url = new URL(req.url ?? '/', 'http://localhost')
    const table = url.pathname.split('/').pop()
    assert.equal(req.headers.apikey, 'test-anon-key')
    assert.equal(req.headers.authorization, 'Bearer test-anon-key')
    if (table === 'profile') return res.end(JSON.stringify([{ data: content.profile }]))
    assert.equal(url.searchParams.get('status'), 'eq.published')
    assert.equal(url.searchParams.get('order'), 'sort_order.asc,created_at.asc')
    const rows = table === 'projects' ? content.projects : table === 'badges' ? content.badges : content.experiences
    res.end(JSON.stringify(rows.map((data) => ({ data }))))
  })
  await new Promise<void>((resolve) => upstream.listen(0, '127.0.0.1', resolve))
  const upstreamAddress = upstream.address()
  assert.ok(upstreamAddress && typeof upstreamAddress !== 'string')
  const root = await mkdtemp(path.join(tmpdir(), 'portfolio-content-sync-'))
  const snapshotPath = path.join(root, 'src/data/generated/content.json')
  await mkdir(path.dirname(snapshotPath), { recursive: true })
  await writeFile(snapshotPath, `${JSON.stringify(content, null, 2)}\n`)
  await writeFile(path.join(root, '.env'), `SUPABASE_URL=http://127.0.0.1:${upstreamAddress.port}\nSUPABASE_ANON_KEY=test-anon-key\n`)
  const server = await createServer({
    root, configFile: false, envDir: root, plugins: [contentSyncPlugin()],
    server: { host: '127.0.0.1', port: 0 },
    customLogger: { info() {}, warn() {}, warnOnce() {}, error() {}, clearScreen() {}, hasErrorLogged: () => false, hasWarned: false },
  })
  try {
    await server.listen()
    const address = server.httpServer?.address()
    assert.ok(address && typeof address !== 'string')
    const origin = `http://127.0.0.1:${address.port}`
    const request = (headers: Record<string, string> = { Origin: origin, 'X-Portfolio-Sync': '1' }, method = 'POST') =>
      fetch(`${origin}/__dev/content-sync`, { method, headers })

    await t.test('rejects GET and foreign origins without pulling data', async () => {
      assert.equal((await request({}, 'GET')).status, 405)
      assert.equal((await request({ Origin: 'https://example.com', 'X-Portfolio-Sync': '1' })).status, 403)
      assert.equal((await request({ Origin: origin })).status, 403)
      assert.equal(pulls, 0)
    })
    await t.test('updates the snapshot from published Supabase rows', async () => {
      content.badges[0].title = 'Automatic preview regression test'
      assert.equal((await request()).status, 200)
      const snapshot = JSON.parse(await readFile(snapshotPath, 'utf8'))
      assert.equal(snapshot.badges[0].title, content.badges[0].title)
      assert.deepEqual(snapshot, content)
    })
    await t.test('unchanged published data does not rewrite the snapshot', async () => {
      const before = await stat(snapshotPath)
      assert.equal((await request()).status, 200)
      assert.equal((await stat(snapshotPath)).mtimeMs, before.mtimeMs)
    })
    await t.test('experience logo metadata survives published-content validation and sync', async () => {
      const logo = { src: '/organization-logo.webp', alt: 'Organization logo', width: 240, height: 120 }
      content.experiences[0].logo = logo
      assert.equal((await request()).status, 200)
      const snapshot = JSON.parse(await readFile(snapshotPath, 'utf8'))
      assert.deepEqual(snapshot.experiences[0].logo, logo)
      delete content.experiences[0].logo
      assert.equal((await request()).status, 200)
      assert.equal('logo' in JSON.parse(await readFile(snapshotPath, 'utf8')).experiences[0], false)
    })
    await t.test('failed pulls keep the last valid data and allow retry', async () => {
      const before = await readFile(snapshotPath, 'utf8')
      fail = true
      assert.equal((await request()).status, 500)
      assert.equal(await readFile(snapshotPath, 'utf8'), before)
      fail = false
      content.badges[0].title = 'Recovered preview'
      assert.equal((await request()).status, 200)
      assert.equal(JSON.parse(await readFile(snapshotPath, 'utf8')).badges[0].title, 'Recovered preview')
    })
    await t.test('invalid content cannot replace the last valid snapshot', async () => {
      const before = await readFile(snapshotPath, 'utf8')
      const validTitle = content.badges[0].title
      content.badges[0].title = ''
      assert.equal((await request()).status, 500)
      assert.equal(await readFile(snapshotPath, 'utf8'), before)
      content.badges[0].title = validTitle
    })
  } finally {
    await server.close()
    await new Promise<void>((resolve, reject) => upstream.close((error) => error ? reject(error) : resolve()))
    await rm(root, { recursive: true, force: true })
  }
})
