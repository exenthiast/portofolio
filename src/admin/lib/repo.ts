import { db } from './supabase'
import type { CollectionKey } from './collections'
import type { Content, ProfileContent } from '../../schemas/content'

export type Status = 'draft' | 'published'

export interface ContentRow<T = unknown> {
  id: string
  data: T
  sort_order: number
  status: Status
  created_at: string
  updated_at: string
}

export interface PublishEntry {
  id: number
  actor: string
  status: 'queued' | 'building' | 'ready' | 'error'
  message: string | null
  snapshot: Content
  created_at: string
}

const COLUMNS = 'id,data,sort_order,status,created_at,updated_at'

function check<T>(res: { data: unknown; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message)
  return res.data as T
}

async function syncLocalPreview(): Promise<void> {
  if (!import.meta.env.DEV) return
  try {
    const response = await fetch('/__dev/content-sync', {
      method: 'POST',
      headers: { 'X-Portfolio-Sync': '1' },
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
  } catch {
    throw new Error('Saved to Supabase, but local preview could not update. Check the Vite terminal and save again to retry.')
  }
}

export const repo = {
  async list<T>(table: CollectionKey): Promise<ContentRow<T>[]> {
    return check(await db().from(table).select(COLUMNS).order('sort_order').order('created_at'))
  },
  async get<T>(table: CollectionKey, id: string): Promise<ContentRow<T> | null> {
    return check(await db().from(table).select(COLUMNS).eq('id', id).maybeSingle())
  },
  async save<T extends { id: string }>(table: CollectionKey, doc: T, status: Status, previousId?: string, sortOrder?: number): Promise<void> {
    if (previousId && previousId !== doc.id) {
      check(await db().from(table).update({ id: doc.id, data: doc, status }).eq('id', previousId))
      await syncLocalPreview()
      return
    }
    const row: Record<string, unknown> = { id: doc.id, data: doc, status }
    if (sortOrder !== undefined) row.sort_order = sortOrder
    check(await db().from(table).upsert(row))
    await syncLocalPreview()
  },
  async remove(table: CollectionKey, id: string): Promise<void> {
    check(await db().from(table).delete().eq('id', id))
    await syncLocalPreview()
  },
  async reorder(table: CollectionKey, ids: string[]): Promise<void> {
    await Promise.all(ids.map((id, i) => db().from(table).update({ sort_order: i }).eq('id', id).then(check)))
    await syncLocalPreview()
  },
  async setStatus(table: CollectionKey, id: string, status: Status): Promise<void> {
    check(await db().from(table).update({ status }).eq('id', id))
    await syncLocalPreview()
  },
  async profile(): Promise<{ data: ProfileContent; updated_at: string } | null> {
    return check(await db().from('profile').select('data,updated_at').eq('id', 1).maybeSingle())
  },
  async saveProfile(data: ProfileContent): Promise<void> {
    check(await db().from('profile').upsert({ id: 1, data }))
    await syncLocalPreview()
  },
  async lastPublish(): Promise<PublishEntry | null> {
    return check(await db().from('publish_log').select('*').order('id', { ascending: false }).limit(1).maybeSingle())
  },
  async publishHistory(): Promise<Omit<PublishEntry, 'snapshot'>[]> {
    return check(await db().from('publish_log').select('id,actor,status,message,created_at').order('id', { ascending: false }).limit(20))
  },
  /** What a publish right now would ship (published rows only). */
  async currentPublished(): Promise<Content | null> {
    const [profile, projects, badges, experiences] = await Promise.all([
      repo.profile(),
      repo.list<Content['projects'][number]>('projects'),
      repo.list<Content['badges'][number]>('badges'),
      repo.list<Content['experiences'][number]>('experiences'),
    ])
    if (!profile) return null
    const pub = <T,>(rows: ContentRow<T>[]) => rows.filter((r) => r.status === 'published').map((r) => r.data)
    return { profile: profile.data, projects: pub(projects), badges: pub(badges), experiences: pub(experiences) }
  },
}
