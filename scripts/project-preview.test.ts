import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'
import { createElement, type ComponentType } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import react from '@vitejs/plugin-react'
import { createServer } from 'vite'
import { projectSchema, type Project } from '../src/schemas/content.ts'

test('project preview renders architecture while its draft is still incomplete', async (t) => {
  const cacheDir = await mkdtemp(path.join(tmpdir(), 'portfolio-preview-test-'))
  const server = await createServer({
    root: fileURLToPath(new URL('..', import.meta.url)),
    configFile: false,
    cacheDir,
    plugins: [react()],
    logLevel: 'error',
    server: { middlewareMode: true, hmr: false, ws: false, watch: null },
    optimizeDeps: { noDiscovery: true },
  })

  try {
    const { ProjectCaseStudy } = await server.ssrLoadModule('/src/components/sections/ProjectDrawer.tsx') as {
      ProjectCaseStudy: ComponentType<{ project: Project }>
    }
    const { collections, setAt } = await server.ssrLoadModule('/src/admin/lib/collections.ts') as {
      collections: { projects: { blank: () => Project } }
      setAt: <T>(doc: T, field: string, value: unknown) => T
    }
    const render = (project: Project) => renderToStaticMarkup(createElement(ProjectCaseStudy, { project }))

    await t.test('pasting overview before key decisions does not crash the raw draft preview', () => {
      const text = 'A Vue 3 SPA communicates with a Laravel REST API.'
      const draft = setAt(collections.projects.blank(), 'architecture.overview', text)
      // The editor previews raw data while required fields are still missing.
      assert.equal(projectSchema.safeParse(draft).success, false)
      assert.match(render(draft), /A Vue 3 SPA communicates with a Laravel REST API\./)
    })

    await t.test('API endpoints and schema may be entered before key decisions', () => {
      const draft = setAt(
        setAt(collections.projects.blank(), 'architecture.apiEndpoints', ['GET /api/books']),
        'architecture.databaseSchema',
        'books(id, title, isbn)',
      )
      const html = render(draft)
      assert.match(html, /GET \/api\/books/)
      assert.match(html, /books\(id, title, isbn\)/)
    })

    await t.test('clearing an overview and re-entering it keeps preview usable', () => {
      let draft = setAt(collections.projects.blank(), 'architecture.overview', 'First overview')
      draft = setAt(draft, 'architecture.overview', '')
      assert.doesNotThrow(() => render(draft))
      draft = setAt(draft, 'architecture.overview', 'Updated overview')
      assert.match(render(draft), /Updated overview/)
    })

    await t.test('a complete project still renders decisions and other case-study content', () => {
      const project = projectSchema.parse({
        ...collections.projects.blank(),
        title: 'Katalog Pustaka',
        slug: 'katalog-pustaka',
        role: 'Developer',
        description: 'Book catalog academic project.',
        techStack: ['Laravel', 'Vue'],
        architecture: {
          overview: 'A REST API and frontend in separate containers.',
          keyDecisions: ['Persist PostgreSQL data in a named volume.'],
          apiEndpoints: ['GET /api/books'],
          databaseSchema: 'books(id, title, isbn)',
        },
        keyFeatures: ['Authenticated book CRUD.'],
      })
      const html = render(project)
      assert.match(html, /Persist PostgreSQL data in a named volume\./)
      assert.match(html, /GET \/api\/books/)
      assert.match(html, /Authenticated book CRUD\./)
    })
  } finally {
    await server.close()
    await rm(cacheDir, { recursive: true, force: true })
  }
})
