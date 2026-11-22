# Phase 15 security implementation

Repository changes and database deployment are separate steps. A local test does
not prove that a production migration has been applied. Do not close the Phase 15
deployment checks until backup/restore and staging verification are recorded.

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
