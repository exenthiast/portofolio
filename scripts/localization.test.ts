import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'
import { createElement, type ComponentType, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import react from '@vitejs/plugin-react'
import { createServer } from 'vite'
import { contentSchema, type Content, type Translations } from '../src/schemas/content.ts'
import { formatCredentialDate, localizeDocument, parseLocale, preparedTranslations, translationFields } from '../src/data/localization.ts'
import { diffContent } from '../src/admin/lib/diff.ts'
import { fetchPublishedContent } from './content-source.ts'

const original = contentSchema.parse(JSON.parse(readFileSync(new URL('../src/data/generated/content.json', import.meta.url), 'utf8')))

test('CMS translations use the matching source and never replace identities, links, technology names or CV files', () => {
  const profile = {
    ...original.profile,
    resumeEnglishUrl: '/cv/english.pdf',
    translations: {
      bio: { source: original.profile.bio, id: 'Biografi yang disetujui pemilik.' },
      email: { source: original.profile.email, id: 'wrong@example.test' },
      resumeUrl: { source: original.profile.resumeUrl, id: '/cv/fake.pdf' },
    },
  }
  const before = JSON.stringify(profile)
  const localized = localizeDocument(profile, 'id')
  assert.equal(localized.bio, 'Biografi yang disetujui pemilik.')
  assert.equal(localized.email, original.profile.email)
  assert.equal(localized.resumeUrl, original.profile.resumeUrl)
  assert.equal(localized.resumeEnglishUrl, '/cv/english.pdf')
  assert.equal(JSON.stringify(profile), before)
  assert.notEqual(localizeDocument({ ...profile, bio: 'A changed source.' }, 'id').bio, localized.bio)
})

test('translation preparation preserves fresh author edits and invalidates stale text without changing source fields', () => {
  const previous = { bio: { source: original.profile.bio, id: 'Manual wording.' }, title: { source: 'Old title', id: 'Stale wording.' } }
  const prepared = preparedTranslations(original.profile, previous)
  assert.equal(prepared.bio?.id, 'Manual wording.')
  assert.notEqual(prepared.title?.id, 'Stale wording.')
  assert.equal(prepared.title?.source, original.profile.title)
  assert.equal(translationFields(original.projects[0]).some((field) => /techStack|id|slug|Url/.test(field.path)), false)
  assert.equal(translationFields(original.experiences[0]).some((field) => field.path === 'category'), false)
})

test('dates retain their actual precision and locale preferences fail safely to English', () => {
  assert.match(formatCredentialDate('Aug 24, 2026', 'id'), /24 Agu 2026/)
  assert.equal(formatCredentialDate('2025', 'id'), '2025')
  assert.equal(formatCredentialDate('Unknown', 'id'), 'Unknown')
  assert.equal(formatCredentialDate('Feb 31, 2026', 'id'), 'Feb 31, 2026')
  assert.equal(parseLocale('id'), 'id')
  for (const input of ['en', 'fr', '', null, undefined, {}, '<script>']) assert.equal(parseLocale(input), 'en')
})

test('CMS profile, project, badge, certificate and experience translations survive publish validation and diff', async (context) => {
  const translations: Translations = { description: { source: 'Source', en: 'English', id: 'Indonesia' } }
  const next = contentSchema.parse({
    profile: { ...original.profile, translations: { bio: { source: original.profile.bio, id: 'Biografi.' } } },
    projects: original.projects.map((item) => ({ ...item, translations })),
    badges: original.badges.map((item) => ({ ...item, translations })),
    experiences: original.experiences.map((item) => ({ ...item, translations })),
  })
  context.mock.method(globalThis, 'fetch', async (input: string | URL | Request) => {
    const table = new URL(String(input)).pathname.split('/').at(-1) as keyof Content
    return Response.json(table === 'profile' ? [{ data: next.profile }] : next[table].map((data) => ({ data })))
  })
  const fetched = await fetchPublishedContent({ url: 'https://cms.example.test', anonKey: 'test-only' })
  assert.deepEqual(fetched, next)
  assert.equal(diffContent(original, fetched).every((change) => change.fields.every((field) => field.path.startsWith('translations'))), true)
})

test('public sections render both languages while maintaining stable links and independent CV selection', async (t) => {
  const cacheDir = await mkdtemp(path.join(tmpdir(), 'portfolio-locale-test-'))
  const server = await createServer({
    root: fileURLToPath(new URL('..', import.meta.url)), configFile: false, cacheDir,
    plugins: [react()], logLevel: 'error',
    server: { middlewareMode: true, hmr: false, ws: false, watch: null }, optimizeDeps: { noDiscovery: true },
  })
  try {
    const { LocaleProvider } = await server.ssrLoadModule('/src/hooks/useLocale.tsx') as { LocaleProvider: ComponentType<{ children?: ReactNode; initialLocale: 'en' | 'id' }> }
    const { Navbar } = await server.ssrLoadModule('/src/components/sections/Navbar.tsx') as { Navbar: ComponentType }
    const { Projects } = await server.ssrLoadModule('/src/components/sections/Projects.tsx') as { Projects: ComponentType }
    const { AboutTerminal } = await server.ssrLoadModule('/src/components/sections/AboutTerminal.tsx') as { AboutTerminal: ComponentType }
    const { default: CvModal } = await server.ssrLoadModule('/src/components/ui/CvModal.tsx') as { default: ComponentType<{ isOpen: boolean; onClose: () => void }> }
    const { getPublicContent } = await server.ssrLoadModule('/src/data/public-content.ts') as { getPublicContent: (locale: 'en' | 'id') => { projectsData: Content['projects']; profileData: Content['profile']; badgesData: Content['badges']; certificatesData: Content['badges'] } }
    const render = (component: ComponentType, locale: 'en' | 'id') => renderToStaticMarkup(createElement(LocaleProvider, { initialLocale: locale }, createElement(component)))

    await t.test('navbar has EN/ID controls and no CV shortcut at tablet/mobile breakpoints', () => {
      const en = render(Navbar, 'en')
      const id = render(Navbar, 'id')
      assert.match(en, />EN<.*>ID</)
      assert.match(id, /Navigasi utama/)
      assert.match(en, /xl:hidden/)
      assert.doesNotMatch(en, />CV</)
      for (const anchor of ['#overview', '#about', '#projects', '#experience', '#badges', '#contact']) assert.ok(en.includes(anchor) && id.includes(anchor))
    })

    await t.test('CMS narratives, case studies and About change without altering source facts or links', () => {
      assert.match(render(Projects, 'en'), /Things I&#x27;ve built and shipped/)
      assert.match(render(Projects, 'id'), /Proyek yang Saya Bangun/)
      assert.match(render(AboutTerminal, 'id'), /Saya mahasiswa Teknologi Rekayasa Perangkat Lunak/)
      const en = getPublicContent('en')
      const id = getPublicContent('id')
      assert.notEqual(en.projectsData[0].description, id.projectsData[0].description)
      for (let i = 0; i < original.projects.length; i++) {
        for (const key of ['id', 'slug', 'githubUrl', 'liveDemoUrl', 'techStack'] as const) assert.deepEqual(en.projectsData[i][key], id.projectsData[i][key])
      }
      assert.deepEqual(en.badgesData.map((badge) => badge.title), id.badgesData.map((badge) => badge.title))
      assert.equal(en.certificatesData.length, id.certificatesData.length)
    })

    await t.test('page locale changes viewer labels while keeping the original PDF until an English file is supplied', () => {
      const cv = renderToStaticMarkup(createElement(LocaleProvider, { initialLocale: 'id' }, createElement(CvModal, { isOpen: true, onClose: () => undefined })))
      assert.match(cv, /Unduh PDF/)
      assert.ok(cv.includes(original.profile.resumeUrl))
      assert.doesNotMatch(cv, /aria-label="Bahasa CV"/)
    })

    await t.test('terminal files use selected CMS prose while commands, paths and literal echo stay stable', async () => {
      const { buildVfs } = await server.ssrLoadModule('/src/lib/vfs.ts') as { buildVfs: (data: unknown) => { children: Record<string, { content?: string }> } }
      const { execute } = await server.ssrLoadModule('/src/lib/commands.ts') as {
        execute: (command: string, context: { root: unknown; cwd: string[]; history: string[]; setCwd: () => void; clear: () => void; content: unknown }) => { lines: { text: string }[][] }
      }
      const id = getPublicContent('id')
      const root = buildVfs(id)
      assert.match(root.children['about.md'].content ?? '', /Saya mahasiswa Teknologi Rekayasa Perangkat Lunak/)
      assert.ok(root.children.projects && root.children['cv.pdf'])
      const context = { root, cwd: [], history: [], setCwd: () => undefined, clear: () => undefined, content: id }
      assert.equal(execute('echo Software Engineer', context).lines[0]?.[0]?.text, 'Software Engineer')
      assert.ok(execute('whoami', context).lines.flat().some((segment) => segment.text.includes('Pengembang Perangkat Lunak')))
    })
  } finally {
    await server.close()
    await rm(cacheDir, { recursive: true, force: true })
  }
})
