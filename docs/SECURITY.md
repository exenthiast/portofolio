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
3. Apply only the four new `20261122*` migrations in order, after verifying the
   existing schema matches the base migrations. They must execute as the expected
   migration owner (`postgres`). The last migration requires the protected server
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
