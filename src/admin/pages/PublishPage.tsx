import { useEffect, useRef, useState } from 'react'
import { Rocket } from 'lucide-react'
import { useAccessToken } from '../lib/auth'
import { usePending } from '../lib/pending'
import { repo } from '../lib/repo'
import { show, type Change } from '../lib/diff'
import { useAsync } from '../lib/useAsync'
import { useToast } from '../components/Toast'
import { Btn, Card, ErrorNote, PageHeader, Skeleton } from '../components/ui'
import { timeAgo } from '../lib/time'

type DeployState = 'idle' | 'publishing' | 'queued' | 'building' | 'ready' | 'error' | 'unknown'

function DiffBlock({ change }: { change: Change }) {
  const color = change.kind === 'added' ? 'text-[var(--accent)]' : change.kind === 'removed' ? 'text-[var(--mac-close)]' : 'text-[var(--mac-minimize)]'
  return (
    <div className="border-b border-[var(--surface-terminal-header)] py-3 last:border-0">
      <p>
        <span className={color}>{change.kind === 'added' ? 'new file:' : change.kind === 'removed' ? 'deleted: ' : 'modified:'}</span>{' '}
        {change.section}/{change.id} <span className="text-[var(--ink-terminal-muted)]">— {change.title}</span>
      </p>
      {change.fields.length > 0 && (
        <div className="mt-2 flex flex-col gap-1.5 pl-4">
          {change.fields.slice(0, 12).map((f) => (
            <div key={f.path} className="text-xs">
              <p className="text-[var(--ink-terminal-muted)]">@@ {f.path} @@</p>
              {f.before !== undefined && <p className="whitespace-pre-wrap break-words text-[var(--mac-close)]">- {show(f.before)}</p>}
              {f.after !== undefined && <p className="whitespace-pre-wrap break-words text-[var(--accent)]">+ {show(f.after)}</p>}
            </div>
          ))}
          {change.fields.length > 12 && <p className="text-xs text-[var(--ink-terminal-muted)]">…{change.fields.length - 12} more fields</p>}
        </div>
      )}
    </div>
  )
}

const stepLabel: Record<DeployState, string> = {
  idle: '',
  publishing: 'validating content & triggering deploy…',
  queued: 'deploy queued on Vercel…',
  building: 'building (pull-content → tsc → vite build)…',
  ready: 'live! alfizdesta.com is up to date',
  error: 'deploy failed — check Vercel logs',
  unknown: 'deploy triggered — status API not configured; live in ~1 minute',
}

export function PublishPage() {
  const token = useAccessToken()
  const toast = useToast()
  const { changes, loading, refresh } = usePending()
  const history = useAsync(() => repo.publishHistory(), [])
  const [state, setState] = useState<DeployState>('idle')
  const [error, setError] = useState<string | null>(null)
  const poll = useRef<number | null>(null)

  useEffect(() => () => { if (poll.current) window.clearInterval(poll.current) }, [])

  const startPolling = () => {
    const started = Date.now()
    poll.current = window.setInterval(async () => {
      if (Date.now() - started > 5 * 60_000) {
        if (poll.current) window.clearInterval(poll.current)
        return setState('unknown')
      }
      try {
        const res = await fetch('/api/deploy-status', { headers: { Authorization: `Bearer ${token}` } })
        const body = (await res.json()) as { state: DeployState; createdAt?: string }
        // Ignore the previous deployment until a new one appears.
        if (body.createdAt && new Date(body.createdAt).getTime() < started - 30_000) return
        setState(body.state)
        if (['ready', 'error', 'unknown'].includes(body.state) && poll.current) window.clearInterval(poll.current)
      } catch {
        /* transient — keep polling */
      }
    }, 5000)
  }

  const publish = async () => {
    if (!token) return
    setError(null)
    setState('publishing')
    try {
      const res = await fetch('/api/publish', { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
      const body = (await res.json()) as { ok?: boolean; error?: string; detail?: string }
      if (!res.ok) throw new Error([body.error, body.detail].filter(Boolean).join(': ') || `HTTP ${res.status}`)
      setState('queued')
      toast('pushed to origin/main — deploying')
      await refresh()
      history.reload()
      startPolling()
    } catch (e) {
      setState('error')
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  const busy = state === 'publishing' || state === 'queued' || state === 'building'

  return (
    <>
      <PageHeader
        title="Review & publish"
        path="~/admin $ git diff --staged"
        actions={
          <Btn variant="accent" disabled={busy || changes.length === 0} onClick={() => void publish()}>
            <Rocket className="h-4 w-4" /> {busy ? 'Publishing…' : 'Publish to alfizdesta.com'}
          </Btn>
        }
      />

      {state !== 'idle' && (
        <div role="status" data-ui="terminal" className="mb-4 rounded-2xl bg-[var(--surface-terminal)] p-4 font-mono text-sm text-[var(--ink-terminal)]">
          <span className={state === 'error' ? 'text-[var(--mac-close)]' : 'text-[var(--accent)]'}>$ </span>
          {stepLabel[state]}
          {busy && <span aria-hidden="true" className="caret ml-1 inline-block h-3.5 w-2 translate-y-0.5 bg-[var(--ink-terminal)]" />}
        </div>
      )}
      {error && <div className="mb-4"><ErrorNote error={error} /></div>}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div data-ui="terminal" className="rounded-2xl bg-[var(--surface-terminal)] p-5 font-mono text-sm text-[var(--ink-terminal)]">
          {loading ? (
            <p className="text-[var(--ink-terminal-muted)]">computing diff…</p>
          ) : changes.length === 0 ? (
            <p className="text-[var(--ink-terminal-muted)]">nothing to commit, working tree clean ✦</p>
          ) : (
            <>
              <p className="mb-2 text-[var(--ink-terminal-muted)]">Changes to be published ({changes.length}): only items marked <em>published</em> are included.</p>
              {changes.map((c) => <DiffBlock key={`${c.section}-${c.id}`} change={c} />)}
            </>
          )}
        </div>
        <Card>
          <p className="mb-3 text-sm font-semibold">Publish history</p>
          {history.loading && !history.data ? (
            <Skeleton className="h-24" />
          ) : !history.data?.length ? (
            <p className="text-sm text-[var(--ink-secondary)]">No publishes yet.</p>
          ) : (
            <ol className="flex flex-col gap-3">
              {history.data.map((h) => (
                <li key={h.id} className="text-sm">
                  <p className="font-mono text-xs text-[var(--ink-secondary)]">#{h.id} · {timeAgo(h.created_at)}</p>
                  <p className="truncate">{h.actor}</p>
                  {h.message && <p className="text-xs text-[#b42318]">{h.message}</p>}
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>
    </>
  )
}
