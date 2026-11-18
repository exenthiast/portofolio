/**
 * GET /api/deploy-status — admin-only. Latest production deployment state from the Vercel API.
 * Optional: without VERCEL_TOKEN/VERCEL_PROJECT_ID it reports `unknown` and the admin UI
 * falls back to "queued, check back in ~1 minute".
 */
import { json, readEnv, requireAdmin } from './_lib/auth.ts'

type VercelState = 'QUEUED' | 'BUILDING' | 'INITIALIZING' | 'READY' | 'ERROR' | 'CANCELED'

interface VercelDeployment {
  uid: string
  url: string
  state?: VercelState
  readyState?: VercelState
  created: number
}

const mapState = (s: VercelState | undefined) =>
  s === 'READY' ? 'ready' : s === 'ERROR' || s === 'CANCELED' ? 'error' : s ? 'building' : 'unknown'

export async function GET(request: Request): Promise<Response> {
  const env = readEnv()
  if (!env) return json({ error: 'server is not configured' }, 500)
  const session = await requireAdmin(request, env)
  if (session instanceof Response) return session

  const token = process.env.VERCEL_TOKEN
  const projectId = process.env.VERCEL_PROJECT_ID
  if (!token || !projectId) return json({ state: 'unknown' })

  const params = new URLSearchParams({ projectId, target: 'production', limit: '1' })
  if (process.env.VERCEL_TEAM_ID) params.set('teamId', process.env.VERCEL_TEAM_ID)
  const res = await fetch(`https://api.vercel.com/v6/deployments?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) return json({ state: 'unknown', error: `vercel HTTP ${res.status}` })

  const { deployments } = (await res.json()) as { deployments: VercelDeployment[] }
  const latest = deployments[0]
  if (!latest) return json({ state: 'unknown' })
  return json({
    state: mapState(latest.readyState ?? latest.state),
    url: `https://${latest.url}`,
    createdAt: new Date(latest.created).toISOString(),
  })
}
