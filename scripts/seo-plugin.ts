import { readFileSync } from 'node:fs'
import path from 'node:path'
import type { Plugin } from 'vite'
import type { Content } from '../src/schemas/content.ts'

const SITE = 'https://alfizdesta.dev/'

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/**
 * Build-time "prerender lite" for the public page:
 *  - JSON-LD Person schema from the content snapshot,
 *  - semantic HTML fallback inside #root (crawlers, link unfurlers, no-JS users).
 * React's createRoot replaces the fallback on boot, so there is no hydration mismatch.
 */
export function seoPlugin(root: string): Plugin {
  const load = (): Content =>
    JSON.parse(readFileSync(path.join(root, 'src/data/generated/content.json'), 'utf8')) as Content

  return {
    name: 'portfolio-seo',
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        if (!ctx.filename.endsWith(`${path.sep}index.html`) && !ctx.filename.endsWith('/index.html')) return html
        const { profile, projects, badges, experiences } = load()
        const fullName = `${profile.firstName} ${profile.lastName}`
        const jsonLd = {
          '@context': 'https://schema.org',
          '@type': 'Person',
          name: fullName,
          url: SITE,
          image: `${SITE}og.png`,
          jobTitle: profile.title,
          email: `mailto:${profile.email}`,
          alumniOf: { '@type': 'CollegeOrUniversity', name: 'Universitas Gadjah Mada' },
          address: { '@type': 'PostalAddress', addressLocality: 'Yogyakarta', addressCountry: 'ID' },
          sameAs: profile.socialLinks.map((s) => s.url),
          knowsAbout: [...new Set(projects.flatMap((p) => p.techStack))],
        }
        const fallback = `
<article class="seo-fallback">
  <h1>${esc(fullName)}</h1>
  <p>${esc(profile.title)} · ${esc(profile.affiliation)} · ${esc(profile.location)}</p>
  <p>${esc(profile.bio)}</p>
  <h2>Projects</h2>
  <ul>${projects.map((p) => `<li><a href="/#projects/${esc(p.slug)}">${esc(p.title)}</a> — ${esc(p.description)} (${p.techStack.map(esc).join(', ')})</li>`).join('')}</ul>
  <h2>Experience</h2>
  <ul>${experiences.map((e) => `<li>${esc(e.role)} — ${esc(e.organization)} (${esc(e.period)})</li>`).join('')}</ul>
  <h2>Credentials</h2>
  <ul>${badges.map((b) => `<li>${esc(b.title)} — ${esc(b.issuer)}</li>`).join('')}</ul>
  <h2>Contact</h2>
  <p><a href="mailto:${esc(profile.email)}">${esc(profile.email)}</a> · ${profile.socialLinks.map((s) => `<a href="${esc(s.url)}">${esc(s.name)}</a>`).join(' · ')}</p>
</article>`
        return html
          .replace('<!--seo-jsonld-->', `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>`)
          .replace('<!--seo-fallback-->', fallback)
      },
    },
  }
}
