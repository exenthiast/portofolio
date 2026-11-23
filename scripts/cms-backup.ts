/** Task 16.1: private, operator-run backup. No production restore command. */
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { cpSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { z } from 'zod'

const root = fileURLToPath(new URL('../', import.meta.url))
const digest = (bytes: Uint8Array | string) => createHash('sha256').update(bytes).digest('hex')
const objectSchema = z.object({ bucket: z.string(), name: z.string(), size: z.number().int().nonnegative(), mime: z.string() })
const inventorySchema = z.object({
  tables: z.array(z.object({ schema: z.string(), name: z.string(), rows: z.number(), hash: z.string() })),
  roles: z.array(z.string()),
  buckets: z.array(z.object({ id: z.string(), public: z.boolean() })),
  objects: z.array(objectSchema),
  documents: z.array(z.unknown()),
  mediaPaths: z.array(z.string()),
})
const manifestSchema = z.object({
  format: z.literal(1), createdAt: z.iso.datetime(), source: z.url(), revision: z.string(),
  inventory: inventorySchema,
  files: z.record(z.string(), z.string().regex(/^[a-f0-9]{64}$/)),
})
export type Inventory = z.infer<typeof inventorySchema>

/** Never include command stderr/arguments: database diagnostics can contain secrets/rows. */
export function pg(name: string, args: string[], env: NodeJS.ProcessEnv = process.env): string {
  try {
    return execFileSync(env.PG_BIN ? path.join(env.PG_BIN, name) : name, args, {
      env: { ...env, PGAPPNAME: 'portfolio-backup' },
      encoding: 'utf8', timeout: 300_000, maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'],
    })
  } catch {
    throw new Error(`${name} failed; check PostgreSQL version, connection, privileges and disk space privately`)
  }
}

/** Poolers can discard startup PGOPTIONS; enforce read-only in SQL itself. */
export function readSql(query: string, env: NodeJS.ProcessEnv = process.env): string {
  return pg('psql', ['-X', '-w', '-qAt', '-v', 'ON_ERROR_STOP=1', '-c',
    `begin isolation level repeatable read read only; set local statement_timeout = '30s'; ${query}; commit;`,
  ], env)
}

/** Row fingerprints include drafts, inbox/audit history and managed Auth/Storage tables. */
export function inventory(env: NodeJS.ProcessEnv = process.env): Inventory {
  const sql = `
    select format('select %L as schema, %L as name, count(*)::float8 as rows, md5(coalesce(string_agg(h, chr(10) order by h collate "C"), %L)) as hash from (select md5(to_jsonb(t)::text) h from %I.%I t) row_hashes',
      schemaname, tablename, '', schemaname, tablename)
    from pg_tables where schemaname in ('public','portfolio_private','auth','storage')
    order by schemaname collate "C", tablename collate "C";`
  const queries = readSql(sql, env).trim().split('\n').filter(Boolean)
  const tables = queries.map((query) => JSON.parse(readSql(`select row_to_json(r) from (${query}) r`, env)) as unknown)
  const details = JSON.parse(readSql(`
    select json_build_object(
      'roles', (select coalesce(json_agg(rolname order by rolname collate "C"), '[]') from pg_roles where rolname !~ '^pg_'),
      'buckets', (select coalesce(json_agg(json_build_object('id', id, 'public', public) order by id collate "C"), '[]') from storage.buckets),
      'objects', (select coalesce(json_agg(json_build_object('bucket', bucket_id, 'name', name,
        'size', (metadata->>'size')::bigint, 'mime', metadata->>'mimetype') order by bucket_id collate "C", name collate "C"), '[]') from storage.objects),
      'documents', (select coalesce(json_agg(data order by data::text collate "C"), '[]') from (
        select data from public.profile union all select data from public.projects
        union all select data from public.badges union all select data from public.experiences
        union all select to_jsonb(m) from public.media m) d),
      'mediaPaths', (select coalesce(json_agg(path order by path collate "C"), '[]') from public.media));`, env)) as Record<string, unknown>
  return inventorySchema.parse({ ...details, tables })
}

export function objectFile(bucket: string, name: string): string {
  // Object names are opaque input, never local filesystem paths.
  return `objects/${digest(JSON.stringify([bucket, name]))}`
}

export function checkRelations(source: string, data: Inventory): number {
  const keys = new Set(data.objects.map((object) => JSON.stringify([object.bucket, object.name])))
  for (const name of data.mediaPaths) {
    if (!keys.has(JSON.stringify(['media', name]))) throw new Error('CMS media row has no Storage object')
  }
  let references = 0
  function walk(value: unknown): void {
    if (typeof value === 'string' && value.startsWith(`${source}/storage/v1/object/public/`)) {
      const url = new URL(value)
      const parts = url.pathname.slice('/storage/v1/object/public/'.length).split('/')
      const bucket = decodeURIComponent(parts.shift() ?? '')
      const name = parts.map(decodeURIComponent).join('/')
      if (!keys.has(JSON.stringify([bucket, name]))) throw new Error('Content references a missing Storage object')
      references++
    } else if (Array.isArray(value)) value.forEach(walk)
    else if (value && typeof value === 'object') Object.values(value).forEach(walk)
  }
  data.documents.forEach(walk)
  return references
}

function sourceUrl(value: string): string {
  const url = new URL(value)
  if (url.username || url.password || url.search || url.hash || url.pathname !== '/' ||
    (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(url.hostname)))) {
    throw new Error('BACKUP_SOURCE_URL must be an HTTPS origin (HTTP allowed only for local tests)')
  }
  return url.origin
}

function listFiles(dir: string, prefix = ''): string[] {
  return readdirSync(path.join(dir, prefix), { withFileTypes: true }).flatMap((entry) => {
    const name = prefix ? `${prefix}/${entry.name}` : entry.name
    if (entry.isSymbolicLink()) throw new Error('Backup must not contain symlinks')
    return entry.isDirectory() ? listFiles(dir, name) : [name]
  })
}

export function verifyBackup(dir: string): z.infer<typeof manifestSchema> {
  const manifest = manifestSchema.parse(JSON.parse(readFileSync(path.join(dir, 'manifest.json'), 'utf8')))
  const actual = listFiles(dir).filter((name) => name !== 'manifest.json').sort()
  if (JSON.stringify(actual) !== JSON.stringify(Object.keys(manifest.files).sort())) throw new Error('Backup file inventory mismatch')
  for (const name of actual) {
    if (digest(readFileSync(path.join(dir, name))) !== manifest.files[name]) throw new Error(`Backup checksum mismatch: ${name}`)
  }
  for (const required of ['database.dump', 'schema.sql', 'roles.sql']) {
    if (!manifest.files[required]) throw new Error(`Backup missing ${required}`)
  }
  for (const object of manifest.inventory.objects) {
    const name = objectFile(object.bucket, object.name)
    if (!manifest.files[name] || readFileSync(path.join(dir, name)).byteLength !== object.size) {
      throw new Error('Backup Storage file missing or size mismatch')
    }
  }
  checkRelations(sourceUrl(manifest.source), manifest.inventory)
  return manifest
}

export async function createBackup(dir: string, env: NodeJS.ProcessEnv = process.env): Promise<void> {
  if (!env.PGHOST && !env.PGSERVICE) throw new Error('Set PGHOST or PGSERVICE for the source database')
  if (env.BACKUP_WRITES_PAUSED !== 'yes') throw new Error('Pause all writers and set BACKUP_WRITES_PAUSED=yes; see docs/BACKUP.md')
  const source = sourceUrl(env.BACKUP_SOURCE_URL ?? '')
  // mkdir without recursive/exist_ok refuses to overwrite even an incomplete backup.
  mkdirSync(dir, { mode: 0o700 })
  const before = inventory(env)
  checkRelations(source, before)
  pg('pg_dump', ['--no-password', '--format=custom', '--file', path.join(dir, 'database.dump')], env)
  pg('pg_dump', ['--no-password', '--schema-only', '--file', path.join(dir, 'schema.sql')], env)
  pg('pg_dumpall', ['--no-password', '--roles-only', '--no-role-passwords', '--file', path.join(dir, 'roles.sql')], env)
  mkdirSync(path.join(dir, 'objects'), { mode: 0o700 })
  for (const object of before.objects) {
    // Refuse dot path segments rather than letting URL normalization address another object.
    if (object.name.split('/').some((part) => part === '.' || part === '..')) throw new Error('Unsupported Storage object path')
    const key = [object.bucket, ...object.name.split('/')].map(encodeURIComponent).join('/')
    const privateBucket = !before.buckets.find((bucket) => bucket.id === object.bucket)?.public
    if (privateBucket && !env.BACKUP_STORAGE_KEY) throw new Error('Private buckets require BACKUP_STORAGE_KEY')
    const headers: Record<string, string> = privateBucket ? { apikey: env.BACKUP_STORAGE_KEY!, Authorization: `Bearer ${env.BACKUP_STORAGE_KEY!}` } : {}
    const response = await fetch(`${source}/storage/v1/object/${privateBucket ? 'authenticated/' : 'public/'}${key}`, {
      headers, redirect: 'error', signal: AbortSignal.timeout(60_000),
    })
    if (!response.ok) throw new Error(`Storage download failed: HTTP ${response.status}`)
    const bytes = Buffer.from(await response.arrayBuffer())
    if (bytes.length !== object.size) throw new Error('Storage download size changed; restart backup with writers paused')
    writeFileSync(path.join(dir, objectFile(object.bucket, object.name)), bytes, { mode: 0o600 })
  }
  if (JSON.stringify(before) !== JSON.stringify(inventory(env))) throw new Error('Database changed during backup; discard incomplete copy and retry with writers paused')
  cpSync(path.join(root, 'supabase/migrations'), path.join(dir, 'migrations'), { recursive: true })
  cpSync(path.join(root, 'public'), path.join(dir, 'public'), { recursive: true })
  cpSync(path.join(root, 'src/data/generated/content.json'), path.join(dir, 'published-fallback.json'))
  const files = Object.fromEntries(listFiles(dir).map((name) => [name, digest(readFileSync(path.join(dir, name)))]))
  const revision = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()
  writeFileSync(path.join(dir, 'manifest.json'), `${JSON.stringify({ format: 1, createdAt: new Date().toISOString(), source, revision, inventory: before, files }, null, 2)}\n`, { mode: 0o600 })
  verifyBackup(dir)
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  process.umask(0o077)
  const [command, location] = process.argv.slice(2)
  try {
    if (!location || !['create', 'verify'].includes(command ?? '')) throw new Error('Usage: node scripts/cms-backup.ts create|verify <private-directory>')
    if (command === 'create') await createBackup(path.resolve(location))
    else verifyBackup(path.resolve(location))
    console.log(`[cms-backup] ${command} succeeded; isolated restore is a separate required gate`)
  } catch (error) {
    console.error('[cms-backup]', error instanceof Error && !(error instanceof z.ZodError) ? error.message : 'Invalid backup data/configuration')
    process.exitCode = 1
  }
}
