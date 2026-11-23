import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { contentSchema, profileSchema } from '../src/schemas/content.ts'
import { getCvDocuments } from '../src/data/cv.ts'
import { diffContent } from '../src/admin/lib/diff.ts'
import { fetchPublishedContent } from './content-source.ts'

const original = contentSchema.parse(JSON.parse(readFileSync(new URL('../src/data/generated/content.json', import.meta.url), 'utf8')))
const { resumeEnglishUrl: _english, ...legacy } = original.profile
const englishUrl = 'https://media.example.test/cv/english.PDF?v=2'

test('legacy profiles retain their original CV and expose no invented English file', () => {
  assert.deepEqual(profileSchema.parse(legacy), legacy)
  const documents = getCvDocuments(legacy)
  assert.equal(documents.length, 1)
  assert.equal(documents[0]?.language, 'id')
  assert.equal(documents[0]?.url, legacy.resumeUrl)
})

test('each CV retains its language, URL and download name when the other version changes or is removed', () => {
  const profile = profileSchema.parse({ ...legacy, resumeEnglishUrl: englishUrl })
  const documents = getCvDocuments(profile)
  assert.deepEqual(documents.map(({ language, url }) => ({ language, url })), [
    { language: 'id', url: legacy.resumeUrl }, { language: 'en', url: englishUrl },
  ])
  assert.match(documents[0]!.downloadName, /-ID\.pdf$/)
  assert.match(documents[1]!.downloadName, /-EN\.pdf$/)
  assert.equal(getCvDocuments({ ...profile, resumeUrl: '/cv/new-id.pdf' })[1]?.url, englishUrl)
  assert.equal(getCvDocuments(legacy)[0]?.url, legacy.resumeUrl)
})

test('an English CV must be a PDF at a safe asset URL', () => {
  for (const resumeEnglishUrl of ['', 'javascript:alert(1)', 'data:application/pdf;base64,abc', '/cv/image.webp', 'https://example.test/cv.pdf.exe']) {
    const parsed = profileSchema.safeParse({ ...legacy, resumeEnglishUrl })
    assert.equal(parsed.success, false)
    if (!parsed.success) assert.equal(parsed.error.issues[0]?.path[0], 'resumeEnglishUrl')
  }
  assert.equal(profileSchema.parse({ ...legacy, resumeEnglishUrl: '/cv/english.pdf' }).resumeEnglishUrl, '/cv/english.pdf')
})

test('published content and review diff retain both CVs and allow removal of English without changing Indonesian', async (context) => {
  const before = { ...original, profile: legacy }
  let profile = profileSchema.parse({ ...legacy, resumeEnglishUrl: englishUrl })
  context.mock.method(globalThis, 'fetch', async (input: string | URL | Request) => {
    const table = new URL(String(input)).pathname.split('/').at(-1)
    return Response.json(table === 'profile' ? [{ data: profile }] :
      (original[table as 'projects' | 'badges' | 'experiences'] ?? []).map((data) => ({ data })))
  })
  const after = await fetchPublishedContent({ url: 'https://cms.example.test', anonKey: 'test-only' })
  assert.equal(after.profile.resumeUrl, legacy.resumeUrl)
  assert.equal(after.profile.resumeEnglishUrl, englishUrl)
  const changes = diffContent(before, after)
  assert.equal(changes.length, 1)
  assert.deepEqual(changes[0]?.fields, [{ path: 'resumeEnglishUrl', before: undefined, after: englishUrl }])
  profile = legacy
  const removed = await fetchPublishedContent({ url: 'https://cms.example.test', anonKey: 'test-only' })
  assert.deepEqual(removed.profile, legacy)
  assert.deepEqual(diffContent(after, removed)[0]?.fields, [{ path: 'resumeEnglishUrl', before: englishUrl, after: undefined }])
})
