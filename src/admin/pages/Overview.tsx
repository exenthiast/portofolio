import { Link } from 'react-router'
import { ArrowRight, BadgeCheck, Briefcase, FolderGit2, Inbox, Upload } from 'lucide-react'
import { db } from '../lib/supabase'
import { repo } from '../lib/repo'
import { usePending } from '../lib/pending'
import { useAsync } from '../lib/useAsync'
import { useAuth } from '../lib/auth'
import { Card, PageHeader, Skeleton } from '../components/ui'
import { timeAgo } from '../lib/time'

interface DailyRow { day: string; name: string; total: number }

async function loadOverview() {
  const now = Date.now()
  const days = Array.from({ length: 14 }, (_, i) => new Date(now - (13 - i) * 86400000).toISOString().slice(0, 10))
  const since = days[0]
  const [projects, badges, experiences, unread, daily] = await Promise.all([
    repo.list('projects'),
    repo.list('badges'),
    repo.list('experiences'),
    db().from('messages').select('id', { count: 'exact', head: true }).is('read_at', null),
    db().from('event_daily').select('day,name,total').gte('day', since),
  ])
  const count = (rows: { status: string }[]) => ({ total: rows.length, drafts: rows.filter((r) => r.status === 'draft').length })
  return {
    projects: count(projects),
    badges: count(badges),
    experiences: count(experiences),
    unread: unread.count ?? 0,
    daily: (daily.data ?? []) as DailyRow[],
    days,
  }
}

function Sparkbars({ rows, days }: { rows: DailyRow[]; days: string[] }) {
  const values = days.map((d) => rows.filter((r) => r.day === d && r.name === 'page_view').reduce((s, r) => s + r.total, 0))
  const max = Math.max(1, ...values)
  const total = values.reduce((a, b) => a + b, 0)
  return (
    <figure>
      <figcaption className="mb-3 flex items-baseline justify-between">
        <span className="text-sm text-[var(--ink-secondary)]">Page views · 14 days</span>
        <span className="text-2xl font-bold tabular-nums">{total}</span>
      </figcaption>
      <div className="flex h-20 items-end gap-1" role="img" aria-label={`Page views per day: ${values.join(', ')}`}>
        {values.map((v, i) => (
          <div key={days[i]} title={`${days[i]}: ${v}`} className="flex-1 rounded-t bg-[var(--accent)]/80" style={{ height: `${Math.max(4, (v / max) * 100)}%`, opacity: v ? 1 : 0.25 }} />
        ))}
      </div>
    </figure>
  )
}

export function Overview() {
  const { state } = useAuth()
  const { changes, lastPublish } = usePending()
  const { data, loading } = useAsync(loadOverview, [])
  const name = state.status === 'admin' ? state.email.split('@')[0] : 'admin'

  const tiles = data
    ? [
        { to: '/projects', label: 'Projects', icon: FolderGit2, ...data.projects },
        { to: '/badges', label: 'Credentials', icon: BadgeCheck, ...data.badges },
        { to: '/experiences', label: 'Experience', icon: Briefcase, ...data.experiences },
      ]
    : []

  return (
    <>
      <PageHeader title={`Welcome back, ${name}`} path="~/admin" />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="flex flex-col gap-4 lg:col-span-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-[var(--ink-secondary)]">git status</p>
              <p className="mt-1 text-xl font-bold tracking-tight">
                {changes.length === 0 ? 'Working tree clean — site is up to date' : `${changes.length} uncommitted change${changes.length > 1 ? 's' : ''} ready to publish`}
              </p>
              <p className="mt-1 text-sm text-[var(--ink-secondary)]">
                Last publish: {lastPublish ? `${timeAgo(lastPublish.created_at)} by ${lastPublish.actor}` : 'never (live site uses the bundled snapshot)'}
              </p>
            </div>
            <Link to="/publish" className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-medium ${changes.length ? 'bg-[var(--accent)] text-white' : 'bg-[var(--surface-raised)]'}`}>
              <Upload className="h-4 w-4" /> Review
            </Link>
          </div>
          {changes.length > 0 && (
            <ul data-ui="terminal" className="rounded-xl bg-[var(--surface-terminal)] p-4 font-mono text-xs leading-relaxed text-[var(--ink-terminal)]">
              {changes.slice(0, 6).map((c) => (
                <li key={`${c.section}-${c.id}`}>
                  <span className={c.kind === 'added' ? 'text-[var(--accent)]' : c.kind === 'removed' ? 'text-[var(--mac-close)]' : 'text-[var(--mac-minimize)]'}>
                    {c.kind === 'added' ? 'new file:  ' : c.kind === 'removed' ? 'deleted:   ' : 'modified:  '}
                  </span>
                  {c.section}/{c.id}
                </li>
              ))}
              {changes.length > 6 && <li className="text-[var(--ink-terminal-muted)]">…and {changes.length - 6} more</li>}
            </ul>
          )}
        </Card>
        <Card>{loading || !data ? <Skeleton className="h-28" /> : <Sparkbars rows={data.daily} days={data.days} />}</Card>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading || !data
          ? [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-32" />)
          : (
            <>
              {tiles.map((t) => (
                <Link key={t.to} to={t.to} className="group flex flex-col gap-3 rounded-2xl bg-[var(--surface)] p-5 hover:bg-[var(--surface-raised)]">
                  <t.icon className="h-5 w-5 text-[var(--ink-secondary)]" aria-hidden="true" />
                  <span className="text-3xl font-bold tabular-nums">{t.total}</span>
                  <span className="flex items-center justify-between text-sm text-[var(--ink-secondary)]">
                    {t.label}{t.drafts ? ` · ${t.drafts} draft` : ''}
                    <ArrowRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
                  </span>
                </Link>
              ))}
              <Link to="/inbox" className="group flex flex-col gap-3 rounded-2xl bg-[var(--surface)] p-5 hover:bg-[var(--surface-raised)]">
                <Inbox className="h-5 w-5 text-[var(--ink-secondary)]" aria-hidden="true" />
                <span className="text-3xl font-bold tabular-nums">{data.unread}</span>
                <span className="text-sm text-[var(--ink-secondary)]">Unread messages</span>
              </Link>
            </>
          )}
      </div>
    </>
  )
}
