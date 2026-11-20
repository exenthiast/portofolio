# Admin Dashboard — Setup & Operations

The admin lives at **`/admin`** (separate Vite entry `admin.html`, its own bundle, `noindex`).
Sign-in is **Google OAuth via Supabase Auth**; only emails in the `public.admins` table get in,
and Postgres Row Level Security enforces that on every query (the UI guard is only UX).

```
Admin (/admin) ──Google OAuth──► Supabase Auth
   │  CRUD, uploads                Postgres + RLS (allowlist in public.admins)
   │                               Storage bucket `media` (WebP, PDF)
   └─ Publish ─► /api/publish (verifies JWT + allowlist) ─► Vercel Deploy Hook
                                                              │
Build: prebuild → scripts/pull-content.ts → zod validation → src/data/generated/content.json
Public site: 100% static; no Supabase SDK in the public bundle
```

## 1. Supabase

1. Create a project at supabase.com (region: Singapore is closest to Yogyakarta).
2. **SQL Editor** → run every SQL file in `supabase/migrations/` in filename order:
   - `20261118000000_portfolio_cms.sql` creates the schema and RLS policies (run once).
   - `20261118010000_grant_cms_access.sql` grants the API roles table access; RLS still limits rows and writes.
3. Run `supabase/seed.sql` (regenerate any time with `npm run seed:sql`).
4. Allow-list the owner:
   ```sql
   insert into public.admins (email) values ('alfizdestaap@gmail.com');
   ```

For an existing installation showing `permission denied for table ...`, run only
`20261118010000_grant_cms_access.sql`, then refresh the admin. Do not rerun the
initial schema or seed: the permission migration preserves existing content and
can be safely rerun. Before applying it, save existing table/sequence ACLs if a
rollback is needed; restore those ACLs to undo only the newly added privileges.

## 2. Google OAuth

1. Google Cloud Console → APIs & Services → **Credentials** → *Create OAuth client ID* → *Web application*.
2. **Authorized JavaScript origins:** `https://alfizdesta.dev`, `http://localhost:5173`
3. **Authorized redirect URI:** `https://<project-ref>.supabase.co/auth/v1/callback`
4. Supabase → **Authentication → Providers → Google**: paste Client ID + Secret, enable.
5. Supabase → **Authentication → URL Configuration**:
   - Site URL: `https://alfizdesta.dev`
   - Redirect URLs: `https://alfizdesta.dev/admin`, `http://localhost:5173/admin`, `https://*-<vercel-team>.vercel.app/admin`

## 3. Environment variables

Copy `.env.example` → `.env` for local work, and add the same keys in **Vercel → Settings → Environment Variables**.

| Variable | Where | Purpose |
| --- | --- | --- |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | client + build | Admin SDK, contact form, analytics (anon key is public by design; RLS protects data) |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY` | server/build | `pull-content` and `/api/*` |
| `VERCEL_DEPLOY_HOOK_URL` | server only | Vercel → Settings → Git → Deploy Hooks (branch `main`). **Never prefix with `VITE_`.** |
| `VERCEL_TOKEN`, `VERCEL_PROJECT_ID`, `VERCEL_TEAM_ID` | server only, optional | Live deploy status in the Publish page |

Without Supabase variables everything still builds: `pull-content` validates the committed snapshot and the admin shows a setup guide.

## 4. Daily workflow

1. Edit projects / badges / experience / profile. Every save is stored immediately; a recovery copy is autosaved locally.
2. Mark items **published** (or keep them as **draft** — drafts never ship).
3. **Publish** shows a `git diff`-style review of what changes on the live site, then triggers a production build.
4. The build pulls published content, validates it with the same zod schemas, and deploys (~1 min).

Keyboard: `⌘K` / `Ctrl+K` command palette · `⌘S` / `Ctrl+S` save in editors.

In **Profile & CV**, **About story** controls the paragraphs in the About window
and the terminal's `cat ./about.md` output. Use a blank line between paragraphs.
Older profiles start with the story in `src/data/about.ts`; **Short bio** remains
the separate summary used elsewhere. **Profile photo** supplies the About portrait:
choose an existing image or upload a new one (converted to WebP), fill in its alt
text, then **Save profile**. **Remove** hides the portrait. Publish when ready to
update production. Both fields use the existing profile JSONB and media pipeline;
no database migration is needed.

Experience entries have an optional **Organization logo** image field below
**Period**. Choose an existing image or upload a new one, provide meaningful alt
text, then save. The logo appears below the period in both the editor preview
and the public entry. Use **Remove** to clear it; existing entries need no logo
and no database migration is required because the image is stored in `data` JSONB.

### Credly badges and certificates

Open **Credentials** in the sidebar and choose **New credential**. Set
**Credential type** to **Credly badge** or **Certificate**. Certificates do not
require a Credly URL. Supply the title, issuer, issue date, and use **Certificate
file → Choose PDF or image** to pick or upload either format in the same picker.
A PDF is stored unchanged. Selecting or uploading it automatically renders the
first page into a WebP preview using PDF.js, so the certificate is visible in the
gallery without opening the document. PDF.js and its worker load only in admin
when a preview is requested; the public site reads the saved image.
Uploaded images are converted to WebP and require meaningful alt text. At least
one certificate file is required; the issuer verification link is optional.
Replacing the file selects the new PDF or image. Existing records containing
both a cover image and an original PDF remain supported until the file is replaced.
For a PDF saved before automatic previews, open its credential, click **Generate
preview**, wait for the image, then **Save & mark published → Publish**. No PDF
re-upload is needed. If preview generation fails, the PDF stays attached and
**Generate preview** allows retry. PDF-only records without a generated preview
retain the document tile/native viewer fallback. **Open PDF** remains available.

**Save draft** keeps the item out of the public site. **Save & mark published**
includes it in the next **Publish**. The public Credentials section shows separate
Credly and certificate tabs, with **See all on Credly** always available.
Certificate PDFs are excluded from the automatic CV version history.
Deploy the application code with PDF-only certificate support before publishing
certificates without images; older builds require certificate preview images.

The existing `badges` table, `/admin/badges` route, and snapshot `badges` array
store both kinds. Legacy rows without `kind` are Credly badges; certificates
use `kind: "certificate"`. No SQL migration or change to RLS is required. Drafts,
ordering, publish diffs, and build-time validation use the existing pipeline.
Public links using `#badges` still work. The VFS also exposes `~/certificates`.
When reverting to code predating certificate support, mark certificate rows as
draft before running an older build that validates only Credly badges.

### Local preview after saving

Save writes to Supabase. While `npm run dev` is running, the admin then asks the
Vite server to refresh the public snapshot. Open portfolio tabs reload
automatically; admin forms stay open without a terminal command or manual refresh.

1. Save the item with status **published**; drafts are excluded from the public snapshot.
2. The local server pulls and validates published content automatically after
   saves, status changes, deletions, and reordering (including profile saves).
3. If the pull fails, the admin reports that the Supabase save succeeded but the
   local preview failed. Check the Vite terminal, fix the issue, and save again.

`npm run content:pull` remains available for changes made outside this local admin,
such as edits directly in Supabase. The automatic sync endpoint exists only in
development, accepts same-origin POST requests, and reads published content with
the public key; it never accepts content from the browser or writes to Supabase.

`npm run build` also pulls the latest published content automatically. If using
`npm run preview`, rebuild before refreshing. Updating the hosted website requires
a deployment; the Publish button needs Vercel Functions and a configured Deploy Hook.

## 5. Security notes

- Allow-list + RLS: non-admin Google accounts can sign in but read/write nothing (`sudo: not in the sudoers file`).
- `/api/publish` and `/api/deploy-status` re-verify the session with Supabase and call `is_admin()` server-side.
- Visitors can only `INSERT` into `messages` (rate-limited by trigger) and `events` (whitelisted names); they cannot read them back.
- Every content change is recorded in `audit_log` by a trigger (Activity page).
- Analytics store no IPs, cookies or user identifiers.
