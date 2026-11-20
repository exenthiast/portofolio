import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { contentSchema, profileSchema } from '../src/schemas/content.ts'
import { diffContent } from '../src/admin/lib/diff.ts'
import { fetchPublishedContent } from './content-source.ts'

const original = contentSchema.parse(JSON.parse(readFileSync(new URL('../src/data/generated/content.json', import.meta.url), 'utf8')))
const logo = { src: '/branding/logo.webp', alt: 'Alfiz Desta logo', width: 320, height: 160 }

test('profiles without a navbar logo remain compatible; logo metadata survives validation', () => {
  const { navbarLogo: _logo, ...legacy } = original.profile
  assert.deepEqual(profileSchema.parse(legacy), legacy)
  assert.deepEqual(profileSchema.parse({ ...legacy, navbarLogo: logo }).navbarLogo, logo)
})

test('navbar logos accept SVG and WebP, including absolute URLs with query strings', () => {
  for (const src of ['/branding/logo.svg', 'https://media.example.test/logo.SVG?v=2', '/branding/logo.webp?v=2']) {
    assert.equal(profileSchema.parse({ ...original.profile, navbarLogo: { ...logo, src } }).navbarLogo?.src, src)
  }
})

test('navbar logos require SVG/WebP, alt text, positive dimensions, and a safe asset URL', () => {
  for (const invalid of [
    { ...logo, alt: '' }, { ...logo, width: 0 }, { ...logo, height: -1 },
    { ...logo, src: 'javascript:alert(1)' }, { ...logo, src: '/logo.png' },
  ]) {
    const parsed = profileSchema.safeParse({ ...original.profile, navbarLogo: invalid })
    assert.equal(parsed.success, false)
    if (!parsed.success) assert.equal(parsed.error.issues[0]?.path[0], 'navbarLogo')
  }
})

test('publish fetch preserves the logo and review diff includes its addition and removal', async (context) => {
  const { navbarLogo: _logo, ...legacy } = original.profile
  const before = { ...original, profile: legacy }
  let profile = { ...legacy, navbarLogo: logo }
  context.mock.method(globalThis, 'fetch', async (input: string | URL | Request) => {
    const table = new URL(String(input)).pathname.split('/').at(-1)
    const rows = table === 'profile' ? [{ data: profile }] :
      (original[table as 'projects' | 'badges' | 'experiences'] ?? []).map((data) => ({ data }))
    return Response.json(rows)
  })
  const next = await fetchPublishedContent({ url: 'https://cms.example.test', anonKey: 'test-only' })
  assert.deepEqual(next.profile.navbarLogo, logo)
  for (const [from, to] of [[before, next], [next, before]]) {
    const changes = diffContent(from, to)
    assert.equal(changes.length, 1)
    assert.equal(changes[0]?.section, 'profile')
    assert.equal(changes[0]?.fields[0]?.path, 'navbarLogo')
  }
  profile = { ...legacy, navbarLogo: { ...logo, src: '/branding/logo.svg' } }
  const svgNext = await fetchPublishedContent({ url: 'https://cms.example.test', anonKey: 'test-only' })
  assert.deepEqual(svgNext.profile.navbarLogo, profile.navbarLogo)
  assert.equal(diffContent(next, svgNext)[0]?.fields[0]?.path, 'navbarLogo.src')
})
