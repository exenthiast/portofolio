/** Owner-authorized maintenance: temporary table locks, no persistent DB changes. */
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { randomUUID } from 'node:crypto'
import { renameSync, existsSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { createBackup, readSql } from './cms-backup.ts'

export async function withWritePause<T>(env: NodeJS.ProcessEnv, operation: () => Promise<T>): Promise<T> {
  const tables = readSql(`select string_agg(format('%I.%I', schemaname, tablename), ', ' order by schemaname collate "C", tablename collate "C")
    from pg_tables where schemaname in ('public','portfolio_private','auth','storage')
    and not (schemaname='auth' and tablename='schema_migrations')
    and not (schemaname='storage' and tablename in ('migrations','buckets_vectors','vector_indexes'))`, env).trim()
  if (!tables) throw new Error('No application tables found; maintenance was not started')
  const marker = `portfolio-backup-${randomUUID()}`
  const child = spawn(env.PG_BIN ? path.join(env.PG_BIN, 'psql') : 'psql', ['-X', '-w', '-qAt', '-v', 'ON_ERROR_STOP=1'], {
    env: { ...env, PGAPPNAME: marker }, stdio: ['pipe', 'pipe', 'pipe'],
  })
  const closed = once(child, 'close')
  child.stdin.on('error', () => { /* A lost connection is rejected by the lock check below. */ })
  // Keep diagnostic output private: source SQL errors may include sensitive values.
  let diagnostic = ''
  child.stderr.on('data', (chunk: Buffer) => { diagnostic = (diagnostic + chunk.toString('utf8')).slice(-4_000) })
  let ready = false
  let output = ''
  try {
    const identity = await new Promise<{ pid: number; locks: number }>((resolve, reject) => {
      const timer = setTimeout(() => { child.kill('SIGTERM'); reject(new Error('Maintenance lock acquisition timed out')) }, 25_000)
      child.once('error', () => { clearTimeout(timer); reject(new Error('Could not start the maintenance connection')) })
      child.once('close', () => {
        clearTimeout(timer)
        if (!ready) {
          const reason = diagnostic.match(/permission denied for (?:table|schema) [a-zA-Z0-9_]+|could not obtain lock on relation ["a-zA-Z0-9_.]+|unrecognized configuration parameter ["a-zA-Z0-9_]+|permission denied to set parameter ["a-zA-Z0-9_]+/)?.[0]
          reject(new Error(`Could not pause writers${reason ? `: ${reason}` : '; check active writes and table-lock privileges privately'}`))
        }
      })
      child.stdout.on('data', (chunk: Buffer) => {
        output += chunk.toString('utf8')
        const line = output.split('\n').find((value) => value.startsWith(`${marker}:`))
        if (!line) return
        const match = line.match(/:(\d+):(\d+)$/)
        if (!match || Number(match[2]) === 0) return
        ready = true
        clearTimeout(timer)
        resolve({ pid: Number(match[1]), locks: Number(match[2]) })
      })
      // NOWAIT avoids building a queue behind an existing writer. The server
      // expires this transaction after eight minutes even if the operator crashes.
      child.stdin.write(`begin read write;
        set local application_name = '${marker}';
        set local statement_timeout = '20s';
        set local idle_in_transaction_session_timeout = '8min';
        set local transaction_timeout = '8min';
        lock table ${tables} in share mode nowait;
        select '${marker}:' || pg_backend_pid() || ':' || count(*) from pg_locks
          where pid = pg_backend_pid() and mode = 'ShareLock' and granted;
      `)
    })
    const result = await operation()
    // A server-side expiry/connection loss must never certify an unlocked backup.
    const held = readSql(`select count(*) from pg_locks l join pg_stat_activity a on a.pid=l.pid
      where l.pid=${identity.pid} and l.mode='ShareLock' and l.granted
      and a.application_name='${marker}'`, env).trim()
    if (Number(held) !== identity.locks) throw new Error('Maintenance locks were lost before backup completed; copy is not certified')
    return result
  } finally {
    if (child.exitCode === null && child.signalCode === null) {
      child.stdin.end('rollback;\n')
      const timer = setTimeout(() => child.kill('SIGTERM'), 5_000)
      try { await closed } finally { clearTimeout(timer) }
    } else {
      await closed
    }
  }
}

export async function createMaintenanceBackup(dir: string, env: NodeJS.ProcessEnv = process.env): Promise<void> {
  if (!env.PGHOST && !env.PGSERVICE) throw new Error('Set PGHOST or PGSERVICE before starting maintenance')
  if (existsSync(dir)) throw new Error('Backup directory already exists; use a new directory')
  try {
    await withWritePause(env, async () => {
      console.log('[cms-backup] Maintenance locks acquired; reads remain available (maximum eight minutes)')
      await createBackup(dir, { ...env, BACKUP_WRITES_PAUSED: 'yes' })
    })
  } catch (error) {
    const manifest = path.join(dir, 'manifest.json')
    if (existsSync(manifest)) renameSync(manifest, path.join(dir, 'manifest.uncertified.json'))
    throw error
  } finally {
    console.log('[cms-backup] Maintenance connection closed; temporary locks released')
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  process.umask(0o077)
  try {
    if (process.argv.length !== 3) throw new Error('Usage: node scripts/cms-backup-maintenance.ts <new-private-backup-directory> (requires an owner-authorized maintenance window)')
    await createMaintenanceBackup(path.resolve(process.argv[2]!))
    console.log('[cms-backup] Database/media capture succeeded; restore is a separate gate')
  } catch (error) {
    console.error('[cms-backup]', error instanceof Error ? error.message : 'Maintenance backup failed')
    process.exitCode = 1
  }
}
