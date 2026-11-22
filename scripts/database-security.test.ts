import test from 'node:test'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const candidates = [process.env.PG_BIN, '/Library/PostgreSQL/18/bin', '/opt/homebrew/opt/postgresql@18/bin', '/usr/lib/postgresql/18/bin']
const bin = candidates.find((dir): dir is string => Boolean(dir && existsSync(path.join(dir, 'initdb'))))

test('security migrations enforce PostgreSQL invariants with synthetic principals', { skip: !bin && 'Set PG_BIN to a local PostgreSQL installation' }, () => {
  if (!bin) return
  const scratch = mkdtempSync(path.join(tmpdir(), 'portfolio-phase15-'))
  const data = path.join(scratch, 'data')
  const env = { PATH: '/usr/bin:/bin', LANG: 'C', TMPDIR: scratch }
  const run = (name: string, args: string[]) => execFileSync(path.join(bin, name), args, { env, timeout: 30_000, maxBuffer: 512_000, encoding: 'utf8' })
  const sql = (file: string) => run('psql', ['-X', '-h', scratch, '-U', 'postgres', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1', '-f', file])
  let started = false
  try {
    run('initdb', ['-D', data, '-U', 'postgres', '--auth=trust', '--no-locale', '-E', 'UTF8'])
    run('pg_ctl', ['-D', data, '-l', path.join(scratch, 'postgres.log'), '-o', `-F -k ${scratch} -c listen_addresses='' -c unix_socket_permissions=0700 -c max_connections=10 -c shared_buffers=16MB`, '-w', 'start'])
    started = true
    sql(path.join(root, 'supabase/tests/bootstrap.sql'))
    for (const name of readdirSync(path.join(root, 'supabase/migrations')).filter((name) => name.endsWith('.sql')).sort()) {
      sql(path.join(root, 'supabase/migrations', name))
    }
    for (const name of readdirSync(path.join(root, 'supabase/tests')).filter((name) => name.endsWith('.sql') && name !== 'bootstrap.sql').sort()) {
      sql(path.join(root, 'supabase/tests', name))
    }
  } catch (error) {
    const log = path.join(scratch, 'postgres.log')
    if (existsSync(log)) process.stderr.write(readFileSync(log, 'utf8'))
    throw error
  } finally {
    if (started) run('pg_ctl', ['-D', data, '-m', 'immediate', '-w', 'stop'])
    rmSync(scratch, { recursive: true, force: true })
  }
})
