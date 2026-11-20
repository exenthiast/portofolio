# Cloudflare Workers deployment

The Worker serves the Vite build in `dist/`, rewrites `/admin/*` to the separate
admin entry, and handles `/api/publish` and `/api/deploy-status`. Supabase remains
the source of content, authentication and media. No new npm dependency is required.
The legacy Vercel adapter remains available as a rollback path.

## Git integration

Connect `exenthiast/portofolio` in Workers & Pages. Use:

| Setting | Value |
| --- | --- |
| Project / Worker name | `alfizdesta-portfolio` (must match `wrangler.jsonc`) |
| Production branch | `main` |
| Root directory | `/` |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |
| Preview command | `npx wrangler preview` |
| Preview builds | Enabled |
| Cloudflare Access scope | Previews only |

Keep production public. Allow your email or your Cloudflare account members in
the preview Access policy. Cloudflare can create the build/deploy API token for
this Git integration; it is not a Supabase key or a frontend variable.

Configure build variables for production **and previews**:

- `NODE_VERSION=24` (the build executes TypeScript scripts directly with Node).
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`: same public values as local `.env`.

Build variables do not automatically become Worker runtime bindings. Under
Worker Settings → Variables and Secrets, separately configure:

- `SUPABASE_URL`: the same Supabase project URL.
- `SUPABASE_ANON_KEY`: the same public anon key. Never use the service-role key.
- `CLOUDFLARE_DEPLOY_HOOK_URL`: a **secret**, created after the Git integration is connected.

Create the hook under Settings → Builds → Deploy Hooks, choose branch `main`,
then copy the URL directly into that runtime secret. Never commit it. Publish
verifies the Supabase session and admin allowlist before calling this hook, then
records the validated published snapshot using the existing `publish_log` table.
No database migration or reseed is needed.

Keep the production deploy hook out of preview runtime settings. A preview can
read the site and display admin content, but its Publish action will report a
configuration error until a hook is explicitly supplied. Saving in admin still
writes to the configured Supabase project; use a separate project for isolated edits.

Cloudflare build status is currently checked in its dashboard. The protected
status endpoint returns `unknown`; the admin reports that the deployment was
requested, without claiming it has completed. The former Vercel status adapter
continues to work only on Vercel.

## Preview and OAuth verification

After this configuration reaches the preview branch, check the Cloudflare build
log and open its preview URL. Verify `/`, `/admin`, `/admin/profile`, project
drawers, credential media and CV. Add the actual preview `/admin` URL to Supabase
Auth → URL Configuration → Redirect URLs before testing Google sign-in. Retain
the existing Supabase Google callback URL.

After merging to `main`, repeat the checks on production and test Save → Publish
→ Cloudflare build success → refreshed public content.

## Name.com domain

Keep Name.com as the registrar. Add `alfizdesta.dev` to Cloudflare Domains and
review the imported DNS records, including any mail records. Cloudflare provides
two nameservers for this domain; set those exact nameservers in Name.com.
Follow Cloudflare's DNSSEC instructions if the domain already has DNSSEC enabled.

Once the Cloudflare zone is Active and the Worker has deployed, open Worker
Settings → Domains & Routes → Add → Custom Domain → `alfizdesta.dev`.
Cloudflare creates the DNS record and certificate. Configure `www` separately
if needed. Set Supabase Site URL to `https://alfizdesta.dev` and allow
`https://alfizdesta.dev/admin` as a redirect URL. Verify production remains public
while Access protects only previews.

## Local proof and rollback

Run `npm run build`, `npm run lint`, and `node --test scripts/*.test.ts`.
Use `npx wrangler deploy --dry-run` to bundle the Worker without publishing.
Use `npx wrangler dev` for a local Worker preview; runtime values can be supplied
in ignored `.dev.vars`. Do not copy credentials into tracked files.

Before a Cloudflare release, rollback means leaving production on its previous
deployment. After a release, restore a known-good Cloudflare version or revert
the migration through a feature branch and PR. Existing Supabase data and the
Vercel adapter are preserved.

References: [Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/),
[deploy hooks](https://developers.cloudflare.com/workers/ci-cd/builds/deploy-hooks/),
[custom domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/).
