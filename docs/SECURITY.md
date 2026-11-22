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
