import type { Translations } from '../schemas/content.ts'
import type { Locale } from '../types/locale.ts'
import { translationPairs } from './translation-pairs.ts'

export const localeStorageKey = 'alfizdesta:language'
export const parseLocale = (value: unknown): Locale => value === 'id' ? 'id' : 'en'

const dictionaries = {
  en: new Map(translationPairs.map(([en, id]) => [id, en])),
  id: new Map(translationPairs.map(([en, id]) => [en, id])),
}

export function translateText(source: string, locale: Locale): string {
  const exact = dictionaries[locale].get(source)
  if (exact !== undefined) return exact
  const trimmed = source.trim()
  const padded = dictionaries[locale].get(trimmed)
  if (trimmed && padded !== undefined) return source.replace(trimmed, padded)
  // About stories and committee descriptions are editable multiline content.
  const parts = source.split(/(\n+)/)
  if (parts.length > 1) return parts.map((part) => dictionaries[locale].get(part) ?? part).join('')
  const metric = source.match(/^(\d+) (Active Projects|Experiences|Credly Badges)$/)
  if (locale === 'id' && metric) return `${metric[1]} ${dictionaries.id.get(metric[2]) ?? metric[2]}`
  if (locale === 'id' && source.endsWith(' Verified')) return `${source.slice(0, -9)} Terverifikasi`
  return source
}

const protectedKeys = new Set([
  'id', 'slug', 'kind', 'firstName', 'lastName', 'organization', 'issuer',
  'url', 'src', 'href', 'handle', 'email', 'resumeUrl', 'resumeEnglishUrl', 'pdfUrl',
  'liveDemoUrl', 'githubUrl', 'credlyUrl', 'verificationUrl', 'credentialId', 'techStack',
  'databaseSchema', 'apiEndpoints', 'path', 'terminalPath', 'prompt', 'command', 'translations',
])

/** Paths that CMS authors can translate; source matching prevents stale overrides. */
export function translationFields(document: unknown): { path: string; source: string }[] {
  const fields: { path: string; source: string }[] = []
  function visit(value: unknown, path: string, key: string): void {
    if (protectedKeys.has(key)) return
    if (typeof value === 'string') {
      if (key === 'category' && ['organization', 'committee', 'training'].includes(value)) return
      if (!/^(?:https?:\/\/|\/|~\/)/.test(value) && !['title', 'issueDate', 'expiryDate', 'year', 'name'].includes(key)) fields.push({ path, source: value })
    } else if (Array.isArray(value)) value.forEach((item, index) => visit(item, `${path}.${index}`, key))
    else if (value && typeof value === 'object') Object.entries(value).forEach(([child, item]) => visit(item, path ? `${path}.${child}` : child, child))
  }
  visit(document, '', '')
  // Profile job titles are prose; project/credential titles remain their official names.
  if (document && typeof document === 'object' && 'firstName' in document && 'title' in document && typeof document.title === 'string') fields.unshift({ path: 'title', source: document.title })
  return fields
}

export function formatCredentialDate(source: string, locale: Locale): string {
  const match = source.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{1,2}), (\d{4})$/)
  if (!match) return source
  const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(match[1])
  const date = new Date(Date.UTC(Number(match[3]), month, Number(match[2])))
  if (date.getUTCMonth() !== month || date.getUTCDate() !== Number(match[2])) return source
  return new Intl.DateTimeFormat(locale === 'id' ? 'id-ID' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' }).format(date)
}

export function preparedTranslations(document: unknown, previous: Translations = {}): Translations {
  return Object.fromEntries(translationFields(document).map(({ path, source }) => {
    const existing = previous[path]?.source === source ? previous[path] : undefined
    const en = translateText(source, 'en')
    const id = translateText(source, 'id')
    return [path, { source, ...(en !== source ? { en } : {}), ...(id !== source ? { id } : {}), ...existing }]
  }))
}

export function localizeDocument<T>(document: T, locale: Locale): T {
  const fields = new Map(translationFields(document).map((field) => [field.path, field.source]))
  const translations = document && typeof document === 'object' && 'translations' in document
    ? document.translations as Translations | undefined : undefined
  function visit(value: unknown, path: string): unknown {
    if (typeof value === 'string') {
      if (!fields.has(path)) return value
      const entry = translations?.[path]
      return entry?.source === value && entry[locale] ? entry[locale] : translateText(value, locale)
    }
    if (Array.isArray(value)) return value.map((item, index) => visit(item, `${path}.${index}`))
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, key === 'translations' ? item : visit(item, path ? `${path}.${key}` : key)]))
    return value
  }
  return visit(document, '') as T
}

/** UI dictionaries contain no CMS identifiers or links to change. */
export function localizeCopy<T>(copy: T, locale: Locale): T {
  function visit(value: unknown): unknown {
    if (typeof value === 'string') return translateText(value, locale)
    if (Array.isArray(value)) return value.map(visit)
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, visit(item)]))
    return value
  }
  return visit(copy) as T
}
