# alfizdesta.com

Personal portfolio of **Alfiz Desta Ariant Permana**: a developer console for recruiters and engineers, with a CMS-style admin dashboard behind Google sign-in.

- **Public site:** React 19 + Vite SPA, Tailwind v4, Framer Motion, Lenis. Static, with content baked in at build time.
- **Admin (`/admin`):** Google OAuth (Supabase Auth), editors with live preview, WebP media library, `git diff`-style publish, inbox, analytics, audit log.
- **Content contract:** `src/schemas/content.ts` (zod) is shared by the site, the admin forms and the build.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server (`/` public, `/admin` dashboard) |
| `npm run build` | `prebuild` pulls + validates content, then type-checks and builds both apps |
| `npm run lint` | oxlint |
| `npm run content:pull` | Pull published content from Supabase into `src/data/generated/content.json` |
| `npm run seed:sql` | Regenerate `supabase/seed.sql` from the snapshot |

## Docs

- [`PRD.md`](./PRD.md): product requirements
- [`DESIGN.md`](./DESIGN.md): visual system and anti-slop rules
- [`TASKS.md`](./TASKS.md): roadmap and status
- [`docs/ADMIN.md`](./docs/ADMIN.md): Supabase, Google OAuth and Vercel setup for the admin
