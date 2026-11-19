import type { Content } from '../../schemas/content.ts'

export type ChangeKind = 'added' | 'removed' | 'changed'

export interface FieldChange {
  path: string
  before: unknown
  after: unknown
}

export interface Change {
  section: 'profile' | 'projects' | 'badges' | 'experiences'
  id: string
  title: string
  kind: ChangeKind
  fields: FieldChange[]
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

/** Leaf-level diff; arrays of primitives are compared as a whole for readable output. */
export function diffValues(before: unknown, after: unknown, path = ''): FieldChange[] {
  if (isObj(before) && isObj(after)) {
    const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])]
    return keys.flatMap((k) => diffValues(before[k], after[k], path ? `${path}.${k}` : k))
  }
  return JSON.stringify(before) === JSON.stringify(after) ? [] : [{ path, before, after }]
}

const titleOf = (item: Record<string, unknown>) => String(item.title ?? item.role ?? item.id)

export function diffContent(live: Content, next: Content): Change[] {
  const changes: Change[] = []
  const profileFields = diffValues(live.profile, next.profile)
  if (profileFields.length) changes.push({ section: 'profile', id: 'profile', title: 'Profile', kind: 'changed', fields: profileFields })

  for (const section of ['projects', 'badges', 'experiences'] as const) {
    const before = new Map<string, Record<string, unknown>>(live[section].map((i) => [i.id, i as Record<string, unknown>]))
    const after = new Map<string, Record<string, unknown>>(next[section].map((i) => [i.id, i as Record<string, unknown>]))
    for (const [id, item] of after) {
      const prev = before.get(id)
      if (!prev) changes.push({ section, id, title: titleOf(item), kind: 'added', fields: [] })
      else {
        const fields = diffValues(prev, item)
        if (fields.length) changes.push({ section, id, title: titleOf(item), kind: 'changed', fields })
      }
    }
    for (const [id, item] of before) if (!after.has(id)) changes.push({ section, id, title: titleOf(item), kind: 'removed', fields: [] })
    const orderBefore = live[section].map((i) => i.id).filter((id) => after.has(id)).join()
    const orderAfter = next[section].map((i) => i.id).filter((id) => before.has(id)).join()
    if (orderBefore !== orderAfter) changes.push({ section, id: `${section}-order`, title: `${section} order`, kind: 'changed', fields: [{ path: 'order', before: orderBefore, after: orderAfter }] })
  }
  return changes
}

export const show = (v: unknown) => (v === undefined ? '∅' : typeof v === 'string' ? v : JSON.stringify(v))
