# EN/ID and dual-CV production deployment

This release ports the reviewed UI/CMS changes from PR #15 (`24ed953`) onto the
existing production baseline, `dcd9462`. It is a selective application deployment,
not the v1.1.0 release or a Phase 15 rollout.

## Scope

- EN/ID page switch, replacing the navbar CV shortcut on tablet/mobile.
- Optional CMS translations with source matching and separate Indonesian/English
  PDF selectors; original records remain compatible.
- Existing production Worker, Wrangler configuration and analytics transport
  remain byte-identical to the baseline. Contact retains the existing PostgREST
  transport and field limits; only its copy is localized. The form element is
  retained across the asynchronous request so a successful send can reset it.
- No SQL, grants, policies, runtime variables, Turnstile activation, Storage
  objects or CMS content are changed by deployment. An already configured
  Turnstile site key is not consumed by this release's production transport.
- Prepared copy in `src/data/contact.ts` is static text only. Turnstile-specific
  messages from that dictionary are not shown by the production contact form.

Phase 15 and backup source/evidence remain on
[dev at e313367](https://github.com/exenthiast/portofolio/tree/e3133672f4a31dabf937831be8750e8230189a07).
The original 61-test result belongs to that source tree. Keeping the existing
production transport here does not certify its pending security hardening.

## Validation

- Build with the validated fallback snapshot: passed.
- Lint and 40 tests: passed, no failures or skips. These include CMS/schema
  compatibility, EN/ID render checks, CV document independence and existing Worker
  authentication/publish routing with synthetic responses.
- Existing PDF chunk-size warning remains.
- Browser viewport/interaction QA remains unavailable in this environment;
  Chrome/Chromium is absent and Safari remote automation is disabled. Render
  tests are not viewport proof.

## Deployment and verification

Use a release PR to `main`; Cloudflare Workers Builds is already connected to
that production branch. Verify the exact merge SHA's Cloudflare check, then GET
the public page/admin and referenced assets to establish that the new code is
served. Do not interpret a successful preview build or accepted deploy hook as
production success.

After compatible code is live, the owner can upload the actual English CV and
apply the approved Lazuardy JavaScript correction through CMS → Save → Publish.
Those content changes and their snapshot verification remain separate from this
code deployment. Task 14.4/16.2 stay open until the remaining evidence is collected.

For rollback, preserve the prior main SHA `dcd94621528219f594ccdc78136ecc10aab03863`
and use the existing Cloudflare version/release PR workflow. Deployment rollback
does not restore CMS data. A later release of Phase 15 must reconcile this
selective contact adaptation with the protected transport on dev after staging
QA; do not overwrite either path without reviewing the integration.
