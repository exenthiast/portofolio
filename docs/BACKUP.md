# CMS backup and isolated recovery — Task 16.1

The Git content snapshot contains published portfolio content only. It does not
contain drafts, the admin allowlist, inbox, analytics, audit/publish history or
Storage file bytes. Supabase database backups include Storage metadata, not those
bytes. Keep the database and file archive together.

## Inventory and boundaries

Read-only production inventory, 23 November 2026:

| Scope | Observed / required copy |
| --- | --- |
| CMS | `profile`, `projects`, `badges`, `experiences`, `media`, `admins`, `publish_log`, `audit_log`, `messages`, `events` |
| Storage | One public `media` bucket; 50 objects, 10,437,676 bytes; 50 media rows, including 5 PDFs and 1 SVG |
| Database definitions | All schemas/data in a custom PostgreSQL dump; separate schema SQL records policies, grants, functions, triggers and sequences |
| Roles | Role definitions/memberships without password hashes; passwords must be reset separately during real recovery |
| Phase 15 | Include `portfolio_private` after rollout; it is absent from the observed production database |
| Repository assets | Copy `public/` (including local CV/fonts/icons), migrations, fallback snapshot and Git revision |
| External settings | Record OAuth origins/redirects, provider settings, Cloudflare bindings/build variables, domain/DNS and secret-manager references separately |

The file inventory includes every Storage object, including unused uploads and
files not present in `public.media`. Certificate PDFs, generated previews, CV
versions, photos and navbar logos retain their original bytes and object keys.
Secrets, OAuth client credentials, encryption keys and DNS settings are not
recoverable from a database dump. Never put their values in this document or Git.
External asset URLs outside this project's Storage and `public/` need a separate
owner-controlled copy; inspect those dependencies before certifying recovery.

## Location, frequency and retention

Use a private `backups/<UTC-timestamp>/` directory on an encrypted local volume;
the repository ignores `backups/`, `*.dump` and `*.backup`. The CLI creates private
directories/files and never prints rows or credentials. Dumps include personal
messages and Auth data: Git ignore is not encryption or an off-device copy.

The production database/Storage live in Supabase; the verified archive lives on
the owner's Mac, already separate from production. A second independent backup
copy is a recommended additional safeguard. The original Task 16.1 checklist does
not require buying an external disk or a particular storage product; the earlier
runbook incorrectly made that an unconditional completion gate. The owner
confirmed on 24 November 2026 that no external disk is available. An encrypted
archive in an existing private cloud account can also serve as an additional
copy once the owner selects a destination. No destination has been selected and
no upload or new service is authorized by this note. Keep recovery keys separate
from the copy, transfer the complete archive and verify its checksums at the
destination; record only a non-secret archive identifier in the evidence log.

Operational policy to activate: daily backup at 02:00 WIB; also immediately before
database/Storage changes. Retain 7 daily and 4 weekly verified copies and the latest
verified pre-release copy until the next release recovery drill passes. Perform a
restore drill monthly and before Phase 15 rollout. Target RPO is 24 hours; measure
RTO during the first real drill. Alert the owner privately on a missing/failed
backup. This is a documented policy, **not an installed scheduler**. A scheduled
backup must arrange the same write pause and private credentials as a manual run;
do not introduce production credentials into PR CI. Never prune the last verified
copy or remove older copies until the replacement has been verified off-device.

## Create and verify

Prerequisites: installed PostgreSQL client/server tools (same major as production
or a compatible newer version), enough disk space, and a direct or session-pooler
database connection. Do not use transaction-pooler port 6543. Set `PG_BIN` to the
PostgreSQL bin directory when it is not in PATH.

Configure `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGSSLMODE=verify-full` and
`PGPASSFILE` through a private operator environment. The password file must have
mode 0600. `PGSERVICE` can replace the connection fields. Use an account permitted
to read all schemas and role definitions, not the public anon key. Do not pass a
credential-bearing connection URL on the command line. These scripts do not load
the application `.env` automatically. Ensure the database connection belongs to
the project specified by `BACKUP_SOURCE_URL`.

Download the project CA certificate from **Database → Settings → SSL
Configuration → Download certificate**. The local operator configuration uses
`backups/prod-ca-2021.crt` through `PGSSLROOTCERT`, retaining
`PGSSLMODE=verify-full`. `backups/.pgpass` contains the password; the ignored
`.env.backup.local` contains exported connection parameters and that file's path.
Load only the trusted local configuration into the shell that runs the commands:

```sh
source .env.backup.local
```

Inventory queries start an explicit `REPEATABLE READ READ ONLY` transaction with
a 30-second statement timeout. Do not depend on startup `PGOPTIONS` for read-only
enforcement: the observed session pooler did not apply that setting. Each query
has its own transaction; a maintenance window still synchronizes the inventory,
dump and file capture. `pg_dump` manages its own consistent read transaction.

### Maintenance runner

For an owner-authorized maintenance window, use the runner that actually holds
temporary database locks, rather than declaring the pause by setting a flag:

```sh
source .env.backup.local
node scripts/cms-backup-maintenance.ts backups/<new-UTC-archive-id>
```

It acquires `SHARE` locks in one transaction on application, Auth and Storage
tables, allowing reads while writes wait or hit their client timeout. Ask the
owner to stop edits/uploads/publish/sign-in first; no Storage file overwrite or
delete should run during capture. It does not deploy a maintenance notice, change
policies/grants, or run migrations. Lock acquisition uses `NOWAIT` so a conflicting
writer causes an immediate failure. PostgreSQL enforces an eight-minute maximum
transaction lifetime; success, failure or connection close rolls back the guard
transaction and releases its locks. The completed backup is certified only if
the guard still holds its locks at the end. Loss of the guard renames a completed
manifest to `manifest.uncertified.json`; the ordinary verify command rejects it.

The observed hosted `postgres` role cannot lock four provider-managed tables:
`auth.schema_migrations`, `storage.migrations`, `storage.buckets_vectors` and
`storage.vector_indexes`. Those four are deliberately excluded from application
locks; their row fingerprints are still captured and compared before/after.
Do not run platform migrations or vector-bucket changes during the window.
Unexpected lock-privilege failures abort rather than silently skip more tables.
This is a supervised maintenance capture, not an atomic PostgreSQL/S3 snapshot.
The normal before/after check still rejects changed rows/metadata and missing
files. Public requests attempted during the pause can time out; preserve the
email fallback and arrange the window accordingly.

For an externally managed pause, the lower-level `cms-backup.ts create` command
still supports the following procedure:

1. Pause CMS edits/uploads/deletes, publish jobs, public contact/analytics writes
   and Auth/account changes for the backup window. Keep the statically built
   portfolio and email fallback available. Arrange a maintenance window so no
   visitor message is silently lost. The scripts do not change runtime settings.
2. Set `BACKUP_SOURCE_URL` to the project's HTTPS origin and
   `BACKUP_WRITES_PAUSED=yes` only after that pause is effective. Public buckets
   download without a key. If private buckets exist, set `BACKUP_STORAGE_KEY` to
   the source project's server-only service-role key; never prefix it `VITE_`.
3. Create a new directory under an existing private parent:

   ```sh
   mkdir -p backups
   node scripts/cms-backup.ts create backups/2026-11-23T120000Z
   node scripts/cms-backup.ts verify backups/2026-11-23T120000Z
   ```

4. Resume writers once capture succeeds or fails. A failure leaves an incomplete
   directory without a valid final manifest; use a **new** directory for retry.
   The CLI never overwrites/prunes an archive. It compares row fingerprints and
   object metadata before/after capture and fails on detected changes. This is
   not an atomic transaction spanning PostgreSQL and Storage: the write pause
   is essential, including avoiding equal-size object overwrites.
5. Transfer the verified directory to the encrypted second location and repeat
   `verify` there. SHA-256 catches missing/changed/extra files; it is an integrity
   check, not a signature against a maliciously replaced archive and manifest.

A completed directory contains `database.dump`, `schema.sql`, `roles.sql`,
`manifest.json`, `objects/<opaque-key-hash>`, `migrations/`, `public/`, and
`published-fallback.json`. The manifest maps each object key, MIME and byte size to
its local hashed filename and stores checksums for every artifact. It contains
private CMS data as well as inventory; keep it private too. Object names never
become local paths. Unexpected private buckets, missing downloads or dangling
current content/media references fail capture rather than certify a partial copy.

## Isolated restore drill

Run only with a trusted archive; a SQL dump can execute source-defined functions.

```sh
node scripts/cms-restore-drill.ts backups/2026-11-23T120000Z
```

The drill accepts an archive directory only, creates a new temporary PostgreSQL
cluster and uses a private Unix socket with TCP disabled. It ignores production
connection environment, creates non-login role names for ownership/ACL restoration,
and restores the archive with `pg_restore --exit-on-error`. It compares every
inventoried table's row count/fingerprint, Storage metadata and current CMS media
references, then serves each archived object's bytes/MIME over a temporary
loopback HTTP server and compares downloads. It always stops/removes the temporary
cluster. It never connects to a remote restore target or executes `roles.sql`.

This verifies database rows and local byte delivery. Role password/attributes and
memberships, Google OAuth, real Supabase Storage API/policies, public URLs, browser
rendering and Cloudflare publish require a separate staging exercise. Managed
Supabase extensions may be unavailable in vanilla PostgreSQL: in that case the
drill fails; use a disposable compatible Supabase instance and the official
backup/restore procedure below. Never ignore restore errors or delete extensions
from production to make a drill pass.

For that staging exercise, record a **different** project identifier and disable
public ingestion, deploy hooks, email delivery and other integrations. Follow the
official Supabase restore procedure for managed schemas/roles, reviewing
`roles.sql` and platform compatibility. Recreate bucket settings and upload every
archived object through the Storage API using its original bucket/key/MIME;
inserting `storage.objects` rows alone does not restore files. For a new project,
rewrite source Storage origins in a staging-only copy of CMS URLs (including
profile CV/history, credential PDFs/previews and nested media). Preserve the
original archive, IDs, ordering, draft/published state and audit/publish history.

Verify authenticated admin access, draft preservation, published-content export,
CV open/download, certificate PDF/thumbnail, logos, project/experience images,
inbox/history, allowlisting/RLS, and all uploaded objects through actual HTTP
downloads. Compare byte hashes, not just object counts. Confirm staging never
calls production hooks or writes production rows. Record the steps and duration,
then remove the disposable project according to its access/retention policy.

Database rollback and Worker rollback are separate operations. Keep the matching
content snapshot, archive and deployment identity. Never use `seed.sql` as a
production recovery mechanism and never restore a dump over production during a
drill. Actual disaster recovery needs a separately reviewed target/cutover plan.

### Production archive with Supabase extensions

Use the compatible Supabase PostgreSQL runtime for production archives. The
container runner uses a fresh cluster, a read-only archive mount, no network and
no published ports. It compares all inventoried database rows/metadata and uses
the same loopback byte/MIME checks as the native drill. It never accepts a remote
database target or forwards source connection variables/password files.

```sh
docker pull supabase/postgres:17.12.0.002
node scripts/cms-restore-container.ts backups/<archive-id>
```

The code pins the tested image digest, not the mutable tag. A production source
on PostgreSQL 17.12 emits `pg_attver` column metadata when dumped by the installed
older client; the old 17.6 image rejects it. Keep the archive intact and restore
with the compatible 17.12 runtime. Do not remove metadata to conceal restore
errors. Container removal and temporary-cluster cleanup run on success/failure;
private failure diagnostics remain under the ignored backup directory. Role names
are recreated without production logins/passwords. Source superuser owners (needed
for event triggers) retain that attribute only inside the network-disabled local
cluster, based on declarative `ALTER ROLE ... WITH SUPERUSER` entries in
`roles.sql`. The source role SQL/configuration is never executed wholesale.
Other role attributes/memberships,
real Google Auth/Storage service behavior and encryption-key recovery remain
separate checks; a successful database restore does not certify those services.

## Evidence and remaining gate

Repository regression tests use synthetic principals/content and temporary
databases. On 23 November 2026 the owner supplied a local password file and the
dashboard CA certificate. The operator connection reached PostgreSQL **17.12**
through the session pooler with `verify-full`; an explicit read-only transaction
reported `transaction_read_only=on`. Certificate/hostname verification covers
client → pooler. The server's `pg_stat_ssl` value was false for the pooler's
upstream session; that query does not establish end-to-end TLS.

Privileged read-only inventory succeeded for 10 public CMS, 27 Auth and 10 Storage
tables. All 50 files (10,437,676 bytes) and 101 current Storage URL references
resolved against the catalog; no private bucket was present. This verifies
metadata relationships, not HTTP file downloads or file bytes. Schema and role
export commands also succeeded, writing only private local preflight artifacts
under `backups/preflight-2026-11-23T07-34-20-152Z/` (`schema.sql`, `roles.sql`, with
no role password hashes). No production rows/policies/settings were modified.

### Production capture and isolated database/file recovery

Alfiz authorized maintenance immediately on 23 November 2026. Complete capture
ran from **09:31:05 to 09:35:43 UTC** (16:31–16:35 WIB, 278.4 seconds including
verification). The guard acquired application locks, captured and compared all
47 inventoried tables (including the four unlocked provider-managed tables), and
confirmed the locks still existed at completion. Its connection then rolled back
and closed. A subsequent activity check found no maintenance transaction.
Production reads remained available; no rows, policies, grants or migrations were
changed. The first lock attempt had failed on managed-table privileges and closed
without changing anything; it produced no certified archive.

| Archive evidence | Observed result |
| --- | --- |
| Private local directory | `backups/production-2026-11-23T09-31-05-440Z/` |
| Captured repository revision | `8712da2697a491b5daa05f3a6ca5b263421ab64f` |
| Database custom archive | 541,384 bytes, plus schema SQL and role SQL without password hashes |
| Inventoried rows/metadata | All 47 public/Auth/Storage tables, including CMS drafts and history |
| Storage files | 50 objects, 10,437,676 bytes: 44 WebP, 5 PDF, 1 SVG |
| File inventory | 71 checksummed artifacts including local assets, migrations and fallback snapshot |
| Current Storage URL references | 101, all resolved against captured object keys |
| Manifest SHA-256 | `91e5a33ca58f8b7ba65ee5e80345ac391550373724a386712d54240727956467` |
| Private capture receipt | `backups/production-2026-11-23T09-31-05-440Z-receipt.json` |

The original archive was restored successfully into a fresh Supabase PostgreSQL
17.12 container with no network, no published ports and a read-only archive
mount. Every inventoried table's row count/fingerprint and captured documents
matched, all 101 media references resolved, and all 50 files passed loopback HTTP
byte/MIME comparisons. The temporary container was removed. The image digest is
`sha256:0b64586fb84124b9070525a6528616594a1aa84a75d84cd4c3d43acc8de3ba92`.
The restore runner saves a private JSON proof (including actual server version and
local drill duration) alongside the archive; this duration is not a production
recovery-time guarantee. The older 17.6 runtime had rejected `pg_attver`, and the
first 17.12 attempt revealed the event-trigger-owner requirement above. Neither
failure was ignored or repaired by editing the archive.

Final proof: `backups/restore-proof-ae89acf3-595d-4ef3-9eca-edf6f0320201.json`
records PostgreSQL 17.12, a 122.3-second successful local drill (excluding image
downloads/earlier attempts), and comparison/cleanup from the final runner.
This proof and the actual archive stay outside Git; only this summary,
the runbook and tooling are committed.

The local archive is access-restricted and ignored by Git. On **24 November 2026**,
Alfiz confirmed that macOS Settings shows **FileVault On**. This is owner-reported
UI evidence; the earlier CLI volume check failed and has not independently
verified that status. Encryption confirmation is no longer awaiting the owner.
No off-device archive transfer, recurring schedule or real Supabase Auth/Storage
service restore has been performed. No second backup destination is available
yet. The Task 16.1 parent remains open in `TASKS.md`; additional-copy planning,
scheduler activation and full staging-service QA must be distinguished from its
original backup/isolated-restore acceptance conditions. Real-service staging QA
is still required before Phase 15 rollout. The evidence and follow-ups are:

| Evidence | Status |
| --- | --- |
| Repository backup + corruption/concurrent-write tests + isolated synthetic restore | See validation recorded in `TASKS.md` |
| Production connection, explicit read-only access and schema/role export capability | Verified 23 November 2026, PostgreSQL 17.12; preflight only |
| Complete production archive ID/time, revision and maintenance window | Verified; archive and receipt above |
| Database tables/drafts/history, all Storage objects and reference/hash comparison | Verified from the real archive in isolated PostgreSQL 17.12 and local HTTP delivery |
| Local Mac FileVault status | On, owner-confirmed 24 November 2026; earlier CLI verification unavailable |
| Additional encrypted backup copy and successful verify | Recommended follow-up; destination pending, no external disk available |
| Isolated staging target, actual Storage/Auth/CV/PDF checks, measured RTO | Pending |
| Daily schedule, retained-copy inventory and failure alert recipient | Policy documented; activation pending |

References: [Supabase database backups](https://supabase.com/docs/guides/platform/backups),
[Supabase backup and restore](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore),
[Supabase SSL configuration](https://supabase.com/docs/guides/platform/ssl-enforcement),
[Supabase PostgreSQL 17.12 release](https://github.com/supabase/postgres/releases/tag/17.12.0.002),
[PostgreSQL table locks](https://www.postgresql.org/docs/17/explicit-locking.html),
[PostgreSQL pg_dump](https://www.postgresql.org/docs/current/app-pgdump.html),
[PostgreSQL pg_restore](https://www.postgresql.org/docs/current/app-pgrestore.html).
