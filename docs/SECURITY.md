# Phase 15 security implementation

Repository changes and database deployment are separate steps. A local test does
not prove that a production migration has been applied. Do not close the Phase 15
deployment checks until backup/restore and staging verification are recorded.

## Protected public input — Task 15.1

Public writes now use Cloudflare Worker endpoints; the browser never inserts into
Supabase directly. Requests require the configured exact Origin, bounded JSON,
validated fields, and a trusted Cloudflare client IP. The Worker ignores supplied
`X-Forwarded-For`. Missing configuration or an upstream failure rejects the write.

| Route | Verification | Database quota per source |
| --- | --- | --- |
| `POST /api/contact` | One-use Turnstile token; hostname and `contact` action checked | 3 attempts / 10 minutes |
| `POST /api/analytics-session` | One-use Turnstile token; hostname and `analytics` action checked | 6 attempts / 10 minutes |
| `POST /api/events` | HMAC proof issued by the session endpoint, bound to source and valid for 10 minutes | 60 events / minute |

An additional native Worker rate-limit binding rejects excess traffic before
database/Siteverify calls (90 requests/minute per source per Cloudflare location).
This edge limit is approximate; the database's atomic fixed-window counters are
the authoritative cross-instance limits. Limits do not use client-provided email
or a shared project-wide contact quota. People behind the same public IP share a
source quota; email remains the fallback if a legitimate sender is limited.

Analytics proofs live only in browser memory, not cookies/localStorage, and confer
no contact/admin privileges. No raw IP is stored in Supabase. Abuse counters use
daily HMAC-derived source hashes in the non-exposed `portfolio_private` schema,
separate from analytics rows. Expired counters older than one day are cleaned in
bounded batches during ingestion; schedule an owner-side daily cleanup if strict
time-based deletion is required even when there is no traffic.

The server-only service-role key can bypass RLS. It is used only for these fixed
validated writes and the rate RPC, never forwarded to the browser. The protected
migration removes anonymous insert/sequence grants and replaces ordinary-user
insert policies with admin-only policies; admin inbox/read/update/delete and
published-content reads continue using their existing session/RLS controls.

### Configuration and rollout

Use a separate Supabase project and secrets for staging. Configure an **Invisible**
Turnstile widget for the exact production/staging hostnames; the implementation
does not support interactive Managed widgets. Siteverify must validate the real
tokens server-side. Dummy tokens and mocks prove local behavior only.

| Variable / binding | Location |
| --- | --- |
| `VITE_TURNSTILE_SITE_KEY` | Build-time public site key; enables the form and analytics |
| `SUPABASE_URL` | Worker runtime; target environment's project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Worker runtime secret; legacy service-role JWT, never `VITE_` |
| `TURNSTILE_SECRET_KEY` | Worker runtime secret for the matching site key |
| `PUBLIC_INPUT_SECRET` | Independent random runtime secret, at least 32 characters |
| `PUBLIC_INPUT_ORIGIN` | Exact browser origin, e.g. `https://alfizdesta.dev`; separate for previews |
| `PUBLIC_INPUT_LIMITER` | Native binding in `wrangler.jsonc`; choose a namespace ID unused by other apps |

1. Record backup and successful isolated restore (Task 16.1). Capture current
   grants/policies/function definitions for rollback. The live project currently
   reports no migration history despite having the base tables: reconcile that
   baseline before using automated migration tools; do not rerun CREATE TABLE
   migrations against existing tables.
2. Configure staging runtime secrets and the native binding; deploy the new Worker
   with `VITE_TURNSTILE_SITE_KEY` initially unset. The public email link works while
   form/analytics are disabled during this maintenance step. Do not use the legacy
   frontend that still writes directly after revoking its database access.
3. Apply only the five new `20261122*` migrations in order, after verifying the
   existing schema matches the base migrations. They must execute as the expected
   migration owner (`postgres`). The protected-input migration requires the protected server
   path; it intentionally closes the former browser write path.
4. Set the matching public site key and rebuild. Verify contact, rate limits,
   analytics, admin operations and publish with synthetic staging data. Confirm
   the current production build contains no server secrets before release.
5. Repeat the verified rollout on production only when backup and staging gates
   are met. Use normal human smoke checks; never run spam/rate-load tests there.

If configuration or Turnstile fails, contact shows an error/fallback and analytics
fails silently; neither falls back to a direct anonymous insert. Without a site
key, the form is hidden and email remains available. The Vercel adapter currently
retains admin publish/status only: protected public ingestion is Cloudflare-only;
do not assume switching to Vercel restores the new public APIs.

Rollback safely by disabling the public site key and keeping email available while
restoring a known-good Worker/build. Do not reopen unrestricted public inserts as
an automatic rollback. A Worker rollback does not undo database changes. Preserve
existing messages/events/media and use the captured definitions for an explicitly
reviewed database rollback if needed; never reseed production to roll back.

References: [Turnstile validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/),
[Worker rate limiting](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/).

## Public and private files — Task 15.5

Read-only inspection on 22 November 2026 found one Storage bucket, `media`, with
public downloads, a 10 MiB limit, and image/PDF MIME types. Its write policies
require an authenticated allowlisted admin. The public portfolio needs public
access to project images, profile/logo images, credentials and the public CV.

Keep this bucket public. CMS draft status controls content rows, not Storage
downloads: an uploaded file is public immediately, even before publish. The media
manager and all file pickers explain this before uploading. An unlisted URL or
random file name is not an access control.

There is no requested private-file feature, so this change does not provision an
unused private bucket or silently move existing files. If confidential files are
needed, create a separate **private** bucket, apply admin-only read/write policies,
and use short-lived signed URLs after server authorization. Do not put those URLs
in the public build snapshot. Review file contents before uploading; this review
does not certify that every existing document contains only public information.

Never upload credentials, environment files, or private personal documents to the
public library. Removing an accidentally exposed file cannot revoke copies that
have already been downloaded or cached.

Local role-based testing also reproduced a missing admin metadata-read policy on
`storage.objects`: UPDATE/DELETE could not see their target rows. Migration
`20261122050000_preserve_admin_storage_access.sql` adds SELECT for authenticated
allowlisted admins, scoped only to `media`. It does not grant other users access
or allow reading other buckets. This migration is prepared and tested locally;
it has not been applied to the active project.

## Active Auth review — Task 15.6

Read-only checks on 22 November 2026:

| Setting / account evidence | Observed value |
| --- | --- |
| Google provider | Enabled |
| Email provider (including password flows) | Enabled |
| Phone provider | Disabled |
| Public signup | Enabled (`disable_signup=false`) |
| Email auto-confirm | Disabled; confirmation required |
| Allowlisted admin accounts | One, with confirmed email and Google as provider |
| Allowlisted admin accounts with a stored password | Zero |
| Supabase verified MFA factors for allowlisted admins | Zero |
| Security Advisor leaked-password protection | Disabled |

The UI only exposes Google OAuth, but that does not disable other Auth API login
methods. Database allowlisting remains the authorization control: registration
does not grant admin access. Do not add a self-service allowlist mutation policy.

Owner-side decisions still needed before closing Task 15.6:

1. If email/password is unused, disable the Email provider in the Supabase Auth
   dashboard, then verify the existing Google admin can still sign in.
2. If passwords are retained, check the project's plan and enable leaked-password
   protection when supported; record an unavailable-plan exception explicitly.
   Supabase documents this feature for Pro and above; the active plan was not
   available through the connected tools and must not be inferred.
3. Review public signup against the intended admin-only login model. Do not disable
   signup blindly: a first-time Google admin also needs account creation. Confirm
   recovery and onboarding paths before changing this setting.
4. Verify Google account two-step verification and recovery with the owner. An
   absence of Supabase MFA factors does not establish whether Google MFA is enabled.
5. Verify Site URL and the exact redirect allowlist for production/staging in the
   dashboard. The public Auth settings endpoint does not expose these or plan data.

These checks used only configuration fields and aggregate account counts; no user
emails, password hashes, session tokens, or credentials are retained here. No Auth
settings or accounts were modified. The available connector has no Auth settings
management tool, so the remaining dashboard checks are not claimed as complete.

Reference: [Supabase password security](https://supabase.com/docs/guides/auth/password-security).

## Verification and remaining gates — Task 15.7

Verified locally on 22 November 2026:

- `node --test scripts/*.test.ts`: 42 passed, zero failures/skips. Set `PG_BIN`
  to a PostgreSQL 17+ bin directory if it is not discovered automatically. The
  integration harness creates a fresh disposable cluster, uses only a private Unix
  socket (`listen_addresses=''`), applies migrations to synthetic fixtures, and
  stops/removes the cluster afterward. Never run the fixture bootstrap on Supabase.
- SQL checks run as actual `anon`, ordinary `authenticated`, allowlisted admin,
  and server roles. They prove published-only reads; denial of drafts/private
  data, allowlist escalation, direct public ingestion and internal RPC access;
  preservation of admin editing, audit triggers, inbox, analytics views, publish
  log operations, and media metadata updates/deletion.
- Timestamp checks reject forged analytics times on insert/update, including
  admin writes, and preserve database event-name/label/path validation.
- Eight concurrent server-role requests using one synthetic source admitted
  exactly three contact attempts. Expired quotas reset; other sources/scopes are
  independent. These are bounded tests on disposable local data, never production.
- Worker/API tests simulate Siteverify/database responses and reject missing or
  invalid configuration, foreign Origin, spoofed forwarding headers, oversized or
  invalid input, rejected/replayed bot tokens, wrong hostname/action, expired or
  tampered analytics proofs, source changes, throttled requests and upstream errors.
  Existing publish/allowlist behavior remains covered by its regression tests.
- Chromium checks at 390px and 1440px covered public media notices, form success
  and reset, preserved input on rate/verification/backend failures, invalid delivery
  receipts, analytics proof reuse, reduced motion, and absence of overflow/runtime
  errors. All external services were mocked; no messages/uploads were sent live.
  Screenshots are temporary local review artifacts, not production content.
- A production build with synthetic server-secret canaries contained none of
  those canaries in browser bundles. No package/dependency was added. The final
  build also passes with the public site key unset (email fallback, ingestion off).
- `npm run build` and `npm run lint` pass. Vite still reports the pre-existing PDF
  chunk-size warning; no unrelated performance refactor was made to hide it.

The PostgreSQL fixture models Auth claims and Storage metadata policies; it is
not a full Supabase Auth/Storage service. Real Google sign-in, real Turnstile keys,
native Cloudflare rate-limit binding behavior, Storage HTTP access, and an actual
deployment still need staging verification. Worker publish tests mock deployment
requests; they do not establish that production was published.

### Security Advisor reconciliation

The active project was inspected again after local implementation. No production
migration/configuration was changed, so no warning is claimed as resolved there.

| Live warning | Observed | Prepared change / disposition |
| --- | --- | --- |
| Mutable function search path | `touch_updated_at` | Migration `20261122030000` locks the search path; verify after application |
| Anonymous SECURITY DEFINER execution | `guard_message_rate`, `write_audit`, `is_admin` | Internal helpers lose callable grants; `is_admin` remains deliberately callable for published-content RLS |
| Authenticated SECURITY DEFINER execution | Same three functions | Internal helpers lose callable grants; `is_admin` remains required by RLS and the authenticated publish endpoint |
| Leaked password protection disabled | Still active | Auth owner/plan decisions above remain unresolved |

`is_admin()` returns only whether the verified caller's email is allowlisted.
It uses a locked search path and a schema-qualified table; public execution of
this specific predicate is intentional, not evidence of a data leak. Re-check
its implementation/grants whenever authorization changes rather than suppressing
all SECURITY DEFINER warnings.

Remediation references: [search path](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable),
[anonymous execution](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable),
[authenticated execution](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable),
[password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

Phase 15 remains open pending a recorded backup/isolated restore, configured
staging secrets/widget, real-service staging checks, Auth owner decisions, and
application/reverification of the five migrations. The current connector exposes
no `apply_migration` tool; do not use its generic SQL executor as a substitute for
the missing migration workflow. No production data or credentials were exported,
and no remote DDL, Auth updates, deployment, commit push, or release was performed.
