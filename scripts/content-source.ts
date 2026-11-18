/**
 * Reads published content from Supabase over PostgREST (no SDK needed).
 * Shared by the build (scripts/pull-content.ts) and the publish function (api/publish.ts),
 * so the snapshot logged at publish time is exactly what the build will ship.
 */
import { contentSchema, type Content } from '../src/schemas/content.ts'

interface Row {
  data: unknown
}

export interface SupabaseAccess {
  url: string
  anonKey: string
  /** Optional user JWT (admin); defaults to the anon key. */
  accessToken?: string
}

async function select(access: SupabaseAccess, query: string): Promise<Row[]> {
  const res = await fetch(`${access.url}/rest/v1/${query}`, {
    headers: {
      apikey: access.anonKey,
      Authorization: `Bearer ${access.accessToken ?? access.anonKey}`,
      Accept: 'application/json',
    },
  })
  if (!res.ok) throw new Error(`Supabase ${query} → HTTP ${res.status}: ${await res.text()}`)
  return (await res.json()) as Row[]
}

export async function fetchPublishedContent(access: SupabaseAccess): Promise<Content> {
  const published = 'select=data&status=eq.published&order=sort_order.asc,created_at.asc'
  const [profile, projects, badges, experiences] = await Promise.all([
    select(access, 'profile?select=data&id=eq.1'),
    select(access, `projects?${published}`),
    select(access, `badges?${published}`),
    select(access, `experiences?${published}`),
  ])
  if (!profile[0]) throw new Error('Supabase: profile row (id=1) is missing — run supabase/seed.sql')

  // Throws a readable ZodError naming the exact invalid field.
  return contentSchema.parse({
    profile: profile[0].data,
    projects: projects.map((r) => r.data),
    badges: badges.map((r) => r.data),
    experiences: experiences.map((r) => r.data),
  })
}
