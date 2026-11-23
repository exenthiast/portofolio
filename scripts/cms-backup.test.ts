import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { checkRelations, createBackup, objectFile, readSql, verifyBackup } from './cms-backup.ts'
import { postgresBin, restoreDrill } from './cms-restore-drill.ts'

const root = fileURLToPath(new URL('../', import.meta.url))
const literal = (value: string) => `'${value.replace(/'/g, "''")}'`

test('backup refuses unpaused writers and missing database configuration', async () => {
  await assert.rejects(createBackup('/unused', {}), /PGHOST/)
  await assert.rejects(createBackup('/unused', { PGHOST: 'unused' }), /Pause all writers/)
  await assert.rejects(createBackup('/unused', { PGHOST: 'unused', BACKUP_WRITES_PAUSED: 'yes', BACKUP_SOURCE_URL: 'https://user:secret@example.test' }), /HTTPS origin/)
})

test('CMS dump and separate media restore preserve content relations in a new local cluster', async (t) => {
  const bin = postgresBin()
  const scratch = mkdtempSync(path.join(tmpdir(), 'portfolio-backup-test-'))
  const env = { PATH: '/usr/bin:/bin', LANG: 'C', PG_BIN: bin, PGHOST: scratch, PGUSER: 'postgres', PGDATABASE: 'postgres', BACKUP_WRITES_PAUSED: 'yes' }
  const run = (name: string, args: string[]) => execFileSync(path.join(bin, name), args, { env, encoding: 'utf8', timeout: 30_000, stdio: ['ignore', 'pipe', 'pipe'] })
  const sql = (query: string) => run('psql', ['-X', '-qAt', '-v', 'ON_ERROR_STOP=1', '-c', query])
  const file = (name: string) => run('psql', ['-X', '-q', '-v', 'ON_ERROR_STOP=1', '-f', name])
  const assets = new Map([
    ['media/2026/profile.webp', { mime: 'image/webp', bytes: Buffer.from('synthetic-webp') }],
    ['media/2026/certificate.pdf', { mime: 'application/pdf', bytes: Buffer.from('%PDF-1.4 synthetic certificate') }],
    ['media/2026/cv.pdf', { mime: 'application/pdf', bytes: Buffer.from('%PDF-1.4 synthetic CV') }],
    ['media/2026/logo.svg', { mime: 'image/svg+xml', bytes: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>') }],
    ['media/2026/unlinked % résumé.webp', { mime: 'image/webp', bytes: Buffer.from('unlinked file is still backed up') }],
    ['private/private.pdf', { mime: 'application/pdf', bytes: Buffer.from('private synthetic file') }],
  ])
  let downloadFailure = false
  let mutateDuringDownload = false
  const server = createServer((request, response) => {
    if (downloadFailure) { response.writeHead(503).end(); return }
    const isPrivate = request.url?.startsWith('/storage/v1/object/authenticated/')
    if (isPrivate && request.headers.authorization !== 'Bearer synthetic-key') { response.writeHead(401).end(); return }
    const key = request.url?.replace(/^\/storage\/v1\/object\/(public|authenticated)\//, '').split('/').map(decodeURIComponent).join('/') ?? ''
    const asset = assets.get(key)
    if (!asset) { response.writeHead(404).end(); return }
    if (mutateDuringDownload) {
      mutateDuringDownload = false
      sql("update public.projects set data = data || '{\"changedDuringBackup\":true}'::jsonb where id = 'draft-project'")
    }
    response.setHeader('Content-Type', asset.mime)
    response.end(asset.bytes)
  })
  let started = false
  try {
    run('initdb', ['-D', path.join(scratch, 'data'), '-U', 'postgres', '--auth=trust', '--no-locale', '-E', 'UTF8'])
    run('pg_ctl', ['-D', path.join(scratch, 'data'), '-l', path.join(scratch, 'postgres.log'), '-o', `-F -k ${scratch} -c listen_addresses='' -c unix_socket_permissions=0700 -c shared_buffers=16MB`, '-w', 'start'])
    started = true
    file(path.join(root, 'supabase/tests/bootstrap.sql'))
    for (const name of readdirSync(path.join(root, 'supabase/migrations')).sort()) file(path.join(root, 'supabase/migrations', name))
    await t.test('inventory transactions remain read-only without startup PGOPTIONS', () => {
      assert.equal(sql('show default_transaction_read_only').trim(), 'off')
      assert.equal(readSql("select current_setting('transaction_read_only')", env).trim(), 'on')
      assert.throws(() => readSql("insert into public.admins(email) values ('readonly@example.test')", env), /psql failed/)
      assert.equal(sql("select count(*) from public.admins where email = 'readonly@example.test'").trim(), '0')
    })
    sql('alter table storage.objects add column metadata jsonb')
    sql("insert into storage.buckets(id,name,public) values ('private','private',false)")
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    const address = server.address()
    assert.ok(address && typeof address !== 'string')
    const source = `http://127.0.0.1:${address.port}`
    const access = { ...env, BACKUP_SOURCE_URL: source, BACKUP_STORAGE_KEY: 'synthetic-key' }
    for (const [key, asset] of assets) {
      const [bucket, ...parts] = key.split('/')
      const name = parts.join('/')
      sql(`insert into storage.objects(bucket_id,name,metadata) values (${literal(bucket!)},${literal(name)},${literal(JSON.stringify({ size: asset.bytes.length, mimetype: asset.mime }))}::jsonb)`)
      if (bucket === 'media') {
        const url = `${source}/storage/v1/object/public/${key.split('/').map(encodeURIComponent).join('/')}`
        sql(`insert into public.media(path,url,alt,width,height,mime,size_bytes) values (${literal(name)},${literal(url)},'Synthetic',1,1,${literal(asset.mime)},${asset.bytes.length})`)
      }
    }
    const content = { cvUrl: `${source}/storage/v1/object/public/media/2026/cv.pdf`, navbarLogo: { src: `${source}/storage/v1/object/public/media/2026/logo.svg` } }
    sql(`insert into public.profile(id,data) values (1,${literal(JSON.stringify(content))}::jsonb)`)
    sql(`insert into public.projects(id,status,data) values ('draft-project','draft','{"title":"Unpublished work"}'),('published-project','published','{"title":"Published work"}')`)
    sql(`insert into public.badges(id,status,data) values ('certificate','published',${literal(JSON.stringify({ pdfUrl: `${source}/storage/v1/object/public/media/2026/certificate.pdf` }))}::jsonb)`)
    sql("insert into public.admins(email) values ('owner@example.test'); insert into public.messages(name,email,body) values ('Test','sender@example.test','Synthetic message retained'); insert into public.events(name) values ('cv_open')")
    sql("insert into public.publish_log(snapshot) values ('{\"version\":\"synthetic\"}')")
    const before = sql('select count(*) from public.audit_log')
    const backup = path.join(scratch, 'backup')
    await createBackup(backup, access)
    const manifest = verifyBackup(backup)
    assert.equal(manifest.inventory.objects.length, 6)
    assert.ok(manifest.inventory.tables.some((table) => table.name === 'projects' && table.rows === 2))
    assert.ok(manifest.inventory.tables.some((table) => table.schema === 'portfolio_private'))
    assert.ok(!readFileSync(path.join(backup, 'manifest.json'), 'utf8').includes('synthetic-key'))
    assert.equal(sql('select count(*) from public.audit_log'), before, 'Backup must not write to source')
    const restored = await restoreDrill(backup)
    assert.equal(restored.objects, 6)
    assert.ok(restored.references >= 8)
    assert.equal(sql('select count(*) from public.audit_log'), before, 'Restore must not touch source')

    await t.test('refuses incomplete copies, missing references and overwritten directories', async () => {
      await assert.rejects(createBackup(backup, access), /EEXIST/)
      assert.throws(() => checkRelations(source, { ...manifest.inventory, objects: [] }), /no Storage object/)
      const documents = [{ url: `${source}/storage/v1/object/public/media/deleted.pdf` }]
      assert.throws(() => checkRelations(source, { ...manifest.inventory, documents }), /missing Storage object/)
      writeFileSync(path.join(backup, 'unexpected'), 'extra')
      assert.throws(() => verifyBackup(backup), /inventory mismatch/)
      rmSync(path.join(backup, 'unexpected'))
      const assetPath = path.join(backup, objectFile('media', '2026/cv.pdf'))
      const bytes = readFileSync(assetPath)
      writeFileSync(assetPath, 'corrupt')
      assert.throws(() => verifyBackup(backup), /checksum mismatch/)
      writeFileSync(assetPath, bytes)
    })
    await t.test('failed downloads and concurrent writes never produce a complete manifest', async () => {
      downloadFailure = true
      const failed = path.join(scratch, 'failed')
      await assert.rejects(createBackup(failed, access), /HTTP 503/)
      assert.throws(() => verifyBackup(failed), /ENOENT/)
      downloadFailure = false
      mutateDuringDownload = true
      const changed = path.join(scratch, 'changed')
      await assert.rejects(createBackup(changed, access), /Database changed/)
      assert.throws(() => verifyBackup(changed), /ENOENT/)
    })
  } finally {
    try {
      if (server.listening) await new Promise<void>((resolve) => { server.close(() => resolve()); server.closeAllConnections() })
      if (started) run('pg_ctl', ['-D', path.join(scratch, 'data'), '-m', 'immediate', '-w', 'stop'])
    } finally {
      rmSync(scratch, { recursive: true, force: true })
    }
  }
})
