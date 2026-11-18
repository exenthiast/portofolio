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
2. **SQL Editor** → run `supabase/migrations/20261118000000_portfolio_cms.sql`.
3. Run `supabase/seed.sql` (regenerate any time with `npm run seed:sql`).
4. Allow-list the owner:
   ```sql
   insert into public.admins (email) values ('alfizdestaap@gmail.com');
   ```

## 2. Google OAuth

1. Google Cloud Console → APIs & Services → **Credentials** → *Create OAuth client ID* → *Web application*.
2. **Authorized JavaScript origins:** `https://alfizdesta.com`, `http://localhost:5173`
3. **Authorized redirect URI:** `https://<project-ref>.supabase.co/auth/v1/callback`
4. Supabase → **Authentication → Providers → Google**: paste Client ID + Secret, enable.
5. Supabase → **Authentication → URL Configuration**:
   - Site URL: `https://alfizdesta.com`
   - Redirect URLs: `https://alfizdesta.com/admin`, `http://localhost:5173/admin`, `https://*-<vercel-team>.vercel.app/admin`

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

## 5. Security notes

- Allow-list + RLS: non-admin Google accounts can sign in but read/write nothing (`sudo: not in the sudoers file`).
- `/api/publish` and `/api/deploy-status` re-verify the session with Supabase and call `is_admin()` server-side.
- Visitors can only `INSERT` into `messages` (rate-limited by trigger) and `events` (whitelisted names); they cannot read them back.
- Every content change is recorded in `audit_log` by a trigger (Activity page).
- Analytics store no IPs, cookies or user identifiers.
