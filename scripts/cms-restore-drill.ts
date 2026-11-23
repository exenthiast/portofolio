/** Restore only into a newly created local Unix-socket cluster; accepts no target URL. */
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { checkRelations, inventory, objectFile, verifyBackup } from './cms-backup.ts'

export function postgresBin(): string {
  const candidates = [process.env.PG_BIN, '/Library/PostgreSQL/18/bin', '/opt/homebrew/opt/postgresql@18/bin', '/usr/lib/postgresql/18/bin', '/usr/lib/postgresql/17/bin']
  const bin = candidates.find((dir) => dir && existsSync(path.join(dir, 'initdb')))
  if (!bin) throw new Error('Set PG_BIN to an installed PostgreSQL 17+ bin directory')
  return bin
}

export async function restoreDrill(dir: string): Promise<{ tables: number; objects: number; references: number }> {
  const manifest = verifyBackup(dir)
  const bin = postgresBin()
  const scratch = mkdtempSync(path.join(tmpdir(), 'portfolio-restore-'))
  // Never inherit PGHOST/PGSERVICE/PGPASSWORD or connection files from production.
  const env = { PATH: '/usr/bin:/bin', LANG: 'C', PGPASSFILE: path.join(scratch, 'no-password-file'), PGHOST: scratch, PGUSER: 'postgres', PGDATABASE: 'postgres', PG_BIN: bin }
  function run(name: string, args: string[]): string {
    try {
      return execFileSync(path.join(bin, name), args, { env, encoding: 'utf8', timeout: 300_000, maxBuffer: 32 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] })
    } catch {
      throw new Error(`Local restore ${name} failed; no remote target was used. Managed extensions may require an isolated Supabase instance; see docs/BACKUP.md`)
    }
  }
  const data = path.join(scratch, 'data')
  let started = false
  const server = createServer((request, response) => {
    const object = manifest.inventory.objects.find((item) =>
      request.url === `/${[item.bucket, ...item.name.split('/')].map(encodeURIComponent).join('/')}`)
    if (!object) { response.writeHead(404).end(); return }
    response.setHeader('Content-Type', object.mime)
    response.end(readFileSync(path.join(dir, objectFile(object.bucket, object.name))))
  })
  try {
    run('initdb', ['-D', data, '-U', 'postgres', '--auth=trust', '--no-locale', '-E', 'UTF8'])
    // Scratch path comes from tmpdir/mkdtemp, quoted for PostgreSQL's option parser.
    const socket = scratch.replace(/'/g, "'\\''")
    run('pg_ctl', ['-D', data, '-l', path.join(scratch, 'postgres.log'), '-o', `-F -k '${socket}' -c listen_addresses='' -c unix_socket_permissions=0700 -c max_connections=10 -c shared_buffers=16MB`, '-w', 'start'])
    started = true
    // Recreate names for ownership/ACL restoration, without production logins/passwords.
    for (const role of manifest.inventory.roles.filter((name) => name !== 'postgres')) {
      run('psql', ['-X', '-v', 'ON_ERROR_STOP=1', '-c', `create role "${role.replace(/"/g, '""')}" nologin`])
    }
    run('pg_restore', ['--exit-on-error', '--clean', '--if-exists', '--dbname', 'postgres', path.join(dir, 'database.dump')])
    const restored = inventory(env)
    assert.deepEqual(restored, manifest.inventory, 'Restored rows, drafts, history or Storage metadata differ')
    const references = checkRelations(manifest.source, restored)
    // Exercise byte delivery locally, with the original object key and MIME type.
    await new Promise<void>((resolve, reject) => {
      server.once('error', reject)
      server.listen(0, '127.0.0.1', resolve)
    })
    const address = server.address()
    if (!address || typeof address === 'string') throw new Error('Local media server unavailable')
    for (const object of restored.objects) {
      const key = [object.bucket, ...object.name.split('/')].map(encodeURIComponent).join('/')
      const response = await fetch(`http://127.0.0.1:${address.port}/${key}`, { signal: AbortSignal.timeout(10_000) })
      assert.equal(response.status, 200)
      assert.equal(response.headers.get('content-type'), object.mime)
      assert.deepEqual(Buffer.from(await response.arrayBuffer()), readFileSync(path.join(dir, objectFile(object.bucket, object.name))))
    }
    return { tables: restored.tables.length, objects: restored.objects.length, references }
  } finally {
    try {
      if (server.listening) await new Promise<void>((resolve) => { server.close(() => resolve()); server.closeAllConnections() })
      if (started) run('pg_ctl', ['-D', data, '-m', 'immediate', '-w', 'stop'])
    } finally {
      rmSync(scratch, { recursive: true, force: true })
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  process.umask(0o077)
  try {
    if (process.argv.length !== 3) throw new Error('Usage: node scripts/cms-restore-drill.ts <private-backup-directory>')
    console.log('[cms-restore-drill]', await restoreDrill(path.resolve(process.argv[2]!)))
    console.log('Local database and byte delivery verified; real Supabase Auth/Storage still require staging QA')
  } catch {
    console.error('[cms-restore-drill] Failed. No remote database was changed; check backup integrity, PG_BIN, and platform-extension compatibility privately.')
    process.exitCode = 1
  }
}
