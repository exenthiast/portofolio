import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { certificateSchema, contentSchema, credentialSchema } from '../src/schemas/content.ts'
import { splitCredentials } from '../src/data/credentials.ts'
import { diffContent } from '../src/admin/lib/diff.ts'

const original = contentSchema.parse(JSON.parse(readFileSync(new URL('../src/data/generated/content.json', import.meta.url), 'utf8')))
const legacy = original.badges.find((credential) => credential.kind !== 'certificate')!
const certificate = {
  kind: 'certificate' as const,
  id: 'certificate-test', title: 'Course certificate', issuer: 'Test issuer', issueDate: '2026',
  image: { src: '/certificates/test.webp', alt: 'Course completion certificate', width: 1200, height: 850 },
  pdfUrl: '/certificates/test.pdf', verificationUrl: 'https://example.com/verify/test', skills: [],
}

test('legacy Credly badges remain unchanged and certificates are separated from their count', () => {
  const oldBadge = { ...legacy }
  delete oldBadge.kind
  assert.deepEqual(credentialSchema.parse(oldBadge), oldBadge)
  const data = splitCredentials([oldBadge, certificate])
  assert.deepEqual(data.badges, [oldBadge])
  assert.deepEqual(data.certificates, [certificate])
})

test('certificate validation does not require a Credly URL and returns field-level errors', () => {
  const parsed = certificateSchema.parse(certificate)
  assert.equal('credlyUrl' in parsed, false)
  assert.equal(credentialSchema.safeParse({ ...certificate, kind: 'unknown' }).success, false)
  const result = credentialSchema.safeParse({ ...certificate, verificationUrl: 'invalid' })
  assert.equal(result.success, false)
  if (!result.success) assert.deepEqual(result.error.issues[0].path, ['verificationUrl'])
})

test('a PDF certificate does not require a separate preview image', () => {
  const { image: _image, ...pdfOnly } = certificate
  assert.deepEqual(credentialSchema.parse(pdfOnly), pdfOnly)
  const next = contentSchema.parse({ ...original, badges: [...original.badges, pdfOnly] })
  assert.equal(splitCredentials(next.badges).certificates.at(-1)?.pdfUrl, pdfOnly.pdfUrl)
})

test('certificates require an image or PDF, and Credly badges still require an image', () => {
  const { image: _image, pdfUrl: _pdf, ...withoutFile } = certificate
  const result = credentialSchema.safeParse(withoutFile)
  assert.equal(result.success, false)
  if (!result.success) assert.deepEqual(result.error.issues[0].path, ['image'])
  const { image: _badgeImage, ...badgeWithoutImage } = legacy
  assert.equal(credentialSchema.safeParse(badgeWithoutImage).success, false)
})

test('certificate scans require alt text and dimensions; document and verification links use safe protocols', () => {
  assert.equal(certificateSchema.safeParse({ ...certificate, image: { ...certificate.image, alt: '' } }).success, false)
  assert.equal(certificateSchema.safeParse({ ...certificate, image: { ...certificate.image, width: 0 } }).success, false)
  assert.equal(certificateSchema.safeParse({ ...certificate, verificationUrl: 'javascript:alert(1)' }).success, false)
  assert.equal(certificateSchema.safeParse({ ...certificate, pdfUrl: 'javascript:alert(1)' }).success, false)
  const { pdfUrl: _pdf, verificationUrl: _verification, ...imageOnly } = certificate
  assert.equal(certificateSchema.safeParse(imageOnly).success, true)
})

test('the existing publish diff includes certificate additions and removals without legacy badge changes', () => {
  const next = contentSchema.parse({ ...original, badges: [...original.badges, certificate] })
  assert.deepEqual(diffContent(original, next).map(({ section, id, kind }) => ({ section, id, kind })), [
    { section: 'badges', id: certificate.id, kind: 'added' },
  ])
  assert.deepEqual(diffContent(next, original).map(({ id, kind }) => ({ id, kind })), [{ id: certificate.id, kind: 'removed' }])
})
