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

Before closing Task 16.1, Alfiz must record an actual second location: an existing
encrypted external disk or private encrypted backup destination, with access and
recovery keys stored separately. No new service is provisioned by these scripts.
Copy the complete directory, verify its checksums at the second location, and
record only a non-secret archive identifier in the evidence log.

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

## Evidence and remaining gate

Repository tools/tests use synthetic principals/content and temporary databases.
Production inspection above exported counts/metadata only. Local environment has
public Supabase build credentials but no privileged PostgreSQL connection or
private-bucket key; connected SQL tools are not a complete `pg_dump` transport.
No production archive, off-device transfer, schedule or real Supabase restore has
been performed. Task 16.1 and the Phase 15 rollout gate remain open until the owner
records all of the following, without secrets:

| Evidence | Status |
| --- | --- |
| Repository backup + corruption/concurrent-write tests + isolated synthetic restore | See validation recorded in `TASKS.md` |
| Production archive ID/time, source DB version, revision and maintenance window | Pending |
| Database tables/drafts/history, all Storage objects and reference/hash comparison | Pending real archive |
| Encrypted second-copy location and successful verify | Pending owner location |
| Isolated staging target, actual Storage/Auth/CV/PDF checks, measured RTO | Pending |
| Daily schedule, retained-copy inventory and failure alert recipient | Policy documented; activation pending |

References: [Supabase database backups](https://supabase.com/docs/guides/platform/backups),
[Supabase backup and restore](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore),
[PostgreSQL pg_dump](https://www.postgresql.org/docs/current/app-pgdump.html),
[PostgreSQL pg_restore](https://www.postgresql.org/docs/current/app-pgrestore.html).
