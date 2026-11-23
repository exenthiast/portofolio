/** Restore a trusted production archive into a fresh, network-disabled container. */
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { checkRelations, inventory, verifyBackup } from './cms-backup.ts'
import { verifyMediaDelivery } from './cms-restore-drill.ts'

// Official Supabase image 17.12.0.002, pinned to the verified digest.
const image = 'supabase/postgres@sha256:0b64586fb84124b9070525a6528616594a1aa84a75d84cd4c3d43acc8de3ba92'
const shellQuote = (value: string) => `'${value.replace(/'/g, "'\\''")}'`

export async function restoreContainer(dir: string): Promise<{ tables: number; objects: number; references: number; image: string; serverVersion: string }> {
  const manifest = verifyBackup(dir)
  const docker = execFileSync('which', ['docker'], { encoding: 'utf8' }).trim()
  const name = `portfolio-restore-${randomUUID()}`
  const scratch = mkdtempSync(path.join(tmpdir(), 'portfolio-container-'))
  let started = false
  const run = (args: string[]) => execFileSync(docker, args, { encoding: 'utf8', timeout: 120_000, maxBuffer: 32 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] })
  const sql = (query: string) => run(['exec', '--user', '0', name, 'psql', '-X', '-w', '-qAt', '-h', '/tmp', '-U', 'postgres', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1', '-c', query])
  try {
    run(['image', 'inspect', image]) // Require the explicitly pulled/pinned image.
    run(['run', '--detach', '--rm', '--name', name, '--network', 'none', '--user', 'postgres',
      '--memory', '512m', '--cpus', '1', '--pids-limit', '128', '--tmpfs', '/tmp:rw,mode=1777,size=256m',
      '--mount', `type=bind,source=${path.resolve(dir)},target=/backup,readonly`,
      '--entrypoint', '/bin/sh', image, '-c',
      "initdb -D /tmp/drill -U postgres --auth-local=trust --auth-host=reject --no-locale -E UTF8 >/tmp/init.log 2>&1 && exec postgres -D /tmp/drill -k /tmp -c listen_addresses='' -c shared_preload_libraries=pg_stat_statements -c shared_buffers=32MB",
    ])
    started = true
    let ready = false
    for (let attempt = 0; attempt < 60; attempt++) {
      try {
        run(['exec', name, 'pg_isready', '-h', '/tmp', '-U', 'postgres'])
        ready = true
        break
      } catch { await new Promise((resolve) => setTimeout(resolve, 500)) }
    }
    if (!ready) throw new Error('The isolated Supabase PostgreSQL container did not become ready')
    const roleDefinitions = readFileSync(path.join(dir, 'roles.sql'), 'utf8').split('\n')
    for (const role of manifest.inventory.roles.filter((role) => role !== 'postgres')) {
      const quoted = `"${role.replace(/"/g, '""')}"`
      // Event-trigger ownership requires a superuser owner. Read only this
      // declarative attribute; never execute the source role SQL/configuration.
      const superuser = roleDefinitions.some((line) => line.startsWith(`ALTER ROLE ${role} WITH SUPERUSER `) || line.startsWith(`ALTER ROLE ${quoted} WITH SUPERUSER `))
      sql(`create role ${quoted} nologin${superuser ? ' superuser' : ''}`)
    }
    // No source password files, project URLs or API credentials enter the container.
    run(['exec', '--user', '0', name, 'pg_restore', '--exit-on-error', '--clean', '--if-exists', '-h', '/tmp', '-U', 'postgres', '--dbname', 'postgres', '/backup/database.dump'])
    const wrapper = path.join(scratch, 'psql')
    writeFileSync(wrapper, `#!/bin/sh\nexec ${shellQuote(docker)} exec --user 0 ${shellQuote(name)} psql -h /tmp -U postgres -d postgres "$@"\n`, { mode: 0o700 })
    const env: NodeJS.ProcessEnv = { ...process.env, PG_BIN: scratch }
    for (const key of Object.keys(env)) {
      if (key.startsWith('PG') && key !== 'PG_BIN') delete env[key]
    }
    const restored = inventory(env)
    assert.deepEqual(restored, manifest.inventory, 'Restored database inventory differs from the captured source')
    const references = checkRelations(manifest.source, restored)
    await verifyMediaDelivery(dir, restored)
    return { tables: restored.tables.length, objects: restored.objects.length, references, image, serverVersion: sql('show server_version').trim() }
  } finally {
    try {
      if (started) run(['stop', '--time', '5', name])
    } finally {
      rmSync(scratch, { recursive: true, force: true })
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  process.umask(0o077)
  const dir = process.argv[2]
  try {
    if (process.argv.length !== 3 || !dir) throw new Error('Usage: node scripts/cms-restore-container.ts <private-backup-directory>')
    const startedAt = new Date().toISOString()
    const result = await restoreContainer(path.resolve(dir))
    const completedAt = new Date().toISOString()
    const proof = path.join(path.dirname(path.resolve(dir)), `restore-proof-${randomUUID()}.json`)
    writeFileSync(proof, JSON.stringify({ archive: path.basename(path.resolve(dir)), startedAt, completedAt,
      elapsedSeconds: (Date.parse(completedAt) - Date.parse(startedAt)) / 1000,
      containerNetworkMode: 'none', archiveMountedReadOnly: true, ...result,
    }, null, 2), { mode: 0o600, flag: 'wx' })
    console.log('[cms-restore-container]', result)
    console.log('[cms-restore-container] Private proof:', proof)
    console.log('Database rows and local media delivery verified; real Auth/Storage services require staging QA')
  } catch (error) {
    const diagnostic = path.join(path.resolve(dir ? path.dirname(dir) : '.'), `restore-error-${randomUUID()}.log`)
    writeFileSync(diagnostic, error instanceof Error ? error.stack ?? error.message : 'Restore failed', { mode: 0o600 })
    console.error('[cms-restore-container] Restore failed; private diagnostic:', diagnostic)
    process.exitCode = 1
  }
}
