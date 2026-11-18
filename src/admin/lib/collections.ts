import type { z } from 'zod'
import { badgeSchema, experienceSchema, projectSchema } from '../../schemas/content'
import type { Badge, Experience, Project } from '../../types'

export type CollectionKey = 'projects' | 'badges' | 'experiences'

export type FieldType = 'text' | 'textarea' | 'url' | 'tags' | 'lines' | 'image' | 'images' | 'select'

export interface FieldDef {
  /** Dot path inside the document, e.g. "architecture.overview". */
  path: string
  label: string
  type: FieldType
  hint?: string
  options?: { value: string; label: string }[]
  /** Optional nested object: remove the whole object when all its fields are empty. */
  group?: string
}

export interface CollectionDef<T> {
  key: CollectionKey
  label: string
  singular: string
  schema: z.ZodType<T>
  fields: FieldDef[]
  titleOf: (doc: T) => string
  subtitleOf: (doc: T) => string
  blank: () => T
}

const projects: CollectionDef<Project> = {
  key: 'projects',
  label: 'Projects',
  singular: 'project',
  schema: projectSchema,
  titleOf: (p) => p.title || 'Untitled project',
  subtitleOf: (p) => `${p.category} · ${p.techStack.slice(0, 3).join(', ')}`,
  blank: () => ({
    id: crypto.randomUUID().slice(0, 8),
    slug: '',
    title: '',
    category: 'Backend Developer',
    role: '',
    description: '',
    techStack: [],
  }),
  fields: [
    { path: 'title', label: 'Title', type: 'text' },
    { path: 'slug', label: 'Slug', type: 'text', hint: 'Used in the share link /#projects/<slug>' },
    { path: 'category', label: 'Category', type: 'text', hint: 'e.g. Backend Developer' },
    { path: 'role', label: 'Role', type: 'text' },
    { path: 'description', label: 'Short description', type: 'textarea', hint: '1–2 sentences: problem solved and outcome' },
    { path: 'techStack', label: 'Tech stack', type: 'tags' },
    { path: 'liveDemoUrl', label: 'Live demo URL', type: 'url' },
    { path: 'githubUrl', label: 'Repository URL', type: 'url' },
    { path: 'preview', label: 'Preview image', type: 'image' },
    { path: 'architecture.overview', label: 'Architecture overview', type: 'textarea', group: 'architecture' },
    { path: 'architecture.keyDecisions', label: 'Key decisions', type: 'lines', hint: 'One per line', group: 'architecture' },
    { path: 'architecture.apiEndpoints', label: 'API endpoints', type: 'lines', hint: 'e.g. GET /api/santri', group: 'architecture' },
    { path: 'architecture.databaseSchema', label: 'Database schema excerpt', type: 'textarea', group: 'architecture' },
    { path: 'keyFeatures', label: 'Key features', type: 'lines', hint: 'One per line' },
  ],
}

const badges: CollectionDef<Badge> = {
  key: 'badges',
  label: 'Badges',
  singular: 'badge',
  schema: badgeSchema,
  titleOf: (b) => b.title || 'Untitled badge',
  subtitleOf: (b) => `${b.issuer} · ${b.issueDate}`,
  blank: () => ({
    id: `badge-${crypto.randomUUID().slice(0, 6)}`,
    title: '',
    issuer: 'Google Cloud',
    issueDate: String(new Date().getFullYear()),
    credlyUrl: 'https://www.credly.com/users/alfiz-desta',
    image: { src: '/badges/placeholder.webp', alt: 'Badge', width: 340, height: 340 },
    skills: [],
  }),
  fields: [
    { path: 'title', label: 'Title', type: 'text' },
    { path: 'issuer', label: 'Issuer', type: 'text' },
    { path: 'issueDate', label: 'Issue date', type: 'text', hint: 'e.g. Mar 2025' },
    { path: 'expiryDate', label: 'Expiry date', type: 'text' },
    { path: 'credentialId', label: 'Credential ID', type: 'text' },
    { path: 'credlyUrl', label: 'Credly verification URL', type: 'url', hint: 'Link to the specific badge, not the profile' },
    { path: 'image', label: 'Badge image', type: 'image' },
    { path: 'skills', label: 'Skills', type: 'tags' },
    { path: 'description', label: 'Description', type: 'textarea' },
  ],
}

const experiences: CollectionDef<Experience> = {
  key: 'experiences',
  label: 'Experience',
  singular: 'experience',
  schema: experienceSchema,
  titleOf: (e) => e.role || 'Untitled experience',
  subtitleOf: (e) => `${e.organization} · ${e.period}`,
  blank: () => ({
    id: `exp-${crypto.randomUUID().slice(0, 6)}`,
    category: 'organization',
    role: '',
    organization: '',
    period: '',
    description: '',
    photos: [],
  }),
  fields: [
    {
      path: 'category',
      label: 'Category',
      type: 'select',
      options: [
        { value: 'organization', label: 'Organization' },
        { value: 'committee', label: 'Committee & Event' },
        { value: 'training', label: 'Training' },
      ],
    },
    { path: 'role', label: 'Role', type: 'text' },
    { path: 'organization', label: 'Organization', type: 'text' },
    { path: 'division', label: 'Division', type: 'text' },
    { path: 'period', label: 'Period', type: 'text', hint: 'e.g. Okt 2024 – Okt 2025' },
    { path: 'logo', label: 'Organization logo', type: 'image', hint: 'Optional organization or event logo, displayed below the period.' },
    { path: 'description', label: 'Description', type: 'textarea' },
    { path: 'skills', label: 'Skills', type: 'tags' },
    { path: 'photos', label: 'Documentation photos', type: 'images' },
  ],
}

export const collections = { projects, badges, experiences }

export function getCollection(key: string): CollectionDef<Project> | CollectionDef<Badge> | CollectionDef<Experience> | null {
  return key in collections ? collections[key as CollectionKey] : null
}

// ── dot-path helpers (immutable) ─────────────────────────────────────
type Doc = Record<string, unknown>

export function getAt(doc: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, k) => (acc && typeof acc === 'object' ? (acc as Doc)[k] : undefined), doc)
}

export function setAt<T>(doc: T, path: string, value: unknown): T {
  const [head, ...rest] = path.split('.')
  const base = (doc && typeof doc === 'object' ? { ...(doc as Doc) } : {}) as Doc
  if (rest.length === 0) {
    // Empty strings mean "unset" so optional fields disappear instead of failing URL/min checks.
    if (value === '' || value === undefined) delete base[head]
    else base[head] = value
  } else {
    base[head] = setAt(base[head], rest.join('.'), value)
  }
  return base as T
}

const isEmpty = (v: unknown) => v === undefined || v === '' || (Array.isArray(v) && v.length === 0)

/** Drop optional groups (e.g. `architecture`) whose fields are all empty. */
export function prune<T>(doc: T, fields: FieldDef[]): T {
  let out = doc
  const groups = [...new Set(fields.map((f) => f.group).filter((g): g is string => Boolean(g)))]
  for (const group of groups) {
    const groupFields = fields.filter((f) => f.group === group)
    if (groupFields.every((f) => isEmpty(getAt(out, f.path)))) {
      const copy = { ...(out as Doc) }
      delete copy[group]
      out = copy as T
    }
  }
  return out
}
