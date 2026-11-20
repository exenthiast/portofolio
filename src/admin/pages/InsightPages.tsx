import { Mail, MailOpen, Trash2 } from 'lucide-react'
import { db } from '../lib/supabase'
import { useAsync } from '../lib/useAsync'
import { useToast } from '../components/Toast'
import { Card, Empty, ErrorNote, PageHeader, Skeleton } from '../components/ui'
import { timeAgo } from '../lib/time'

// ── Inbox ────────────────────────────────────────────────────────────
interface Message { id: number; name: string; email: string; body: string; read_at: string | null; created_at: string }

export function InboxPage() {
  const toast = useToast()
  const { data, error, loading, setData } = useAsync(async () => {
    const { data: rows, error: e } = await db().from('messages').select('*').order('created_at', { ascending: false }).limit(200)
    if (e) throw new Error(e.message)
    return rows as Message[]
  }, [])

  const markRead = async (m: Message, read: boolean) => {
    const read_at = read ? new Date().toISOString() : null
    setData((prev) => prev?.map((x) => (x.id === m.id ? { ...x, read_at } : x)) ?? null)
    const { error: e } = await db().from('messages').update({ read_at }).eq('id', m.id)
    if (e) toast(e.message, 'error')
  }
  const remove = async (m: Message) => {
    if (!window.confirm(`Delete message from ${m.name}?`)) return
    const { error: e } = await db().from('messages').delete().eq('id', m.id)
    if (e) return toast(e.message, 'error')
    setData((prev) => prev?.filter((x) => x.id !== m.id) ?? null)
  }

  return (
    <>
      <PageHeader title="Inbox" path="~/admin/inbox $ mail" />
      {error && <ErrorNote error={error} />}
      {loading && !data ? <Skeleton className="h-40" /> : !data?.length ? <Empty>No messages yet. The contact form appears on the site once Supabase is configured.</Empty> : (
        <ul className="flex flex-col gap-2">
          {data.map((m) => (
            <li key={m.id} className={`rounded-2xl p-5 ${m.read_at ? 'bg-[var(--surface)]' : 'bg-[var(--surface)] ring-2 ring-[var(--accent)]/30'}`}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-semibold">{!m.read_at && <span className="mr-2 inline-block h-2 w-2 rounded-full bg-[var(--accent)]" aria-label="unread" />}{m.name} <span className="font-normal text-[var(--ink-secondary)]">&lt;{m.email}&gt;</span></p>
                <span className="text-xs text-[var(--ink-secondary)]">{timeAgo(m.created_at)}</span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{m.body}</p>
              <div className="mt-3 flex gap-1">
                <a href={`mailto:${m.email}?subject=${encodeURIComponent('Re: your message on alfizdesta.dev')}`} onClick={() => void markRead(m, true)} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[var(--surface-terminal)] px-3 text-xs font-medium text-white">Reply</a>
                <button type="button" onClick={() => void markRead(m, !m.read_at)} className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs hover:bg-[var(--surface-raised)] cursor-pointer">
                  {m.read_at ? <><Mail className="h-3.5 w-3.5" /> Mark unread</> : <><MailOpen className="h-3.5 w-3.5" /> Mark read</>}
                </button>
                <button type="button" onClick={() => void remove(m)} className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs text-[#b42318] hover:bg-[#fef3f2] cursor-pointer"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

// ── Analytics ────────────────────────────────────────────────────────
interface Daily { day: string; name: string; total: number }
interface Top { name: string; label: string; total: number }

const EVENT_LABELS: Record<string, string> = {
  page_view: 'Page views',
  cv_open: 'CV opened',
  cv_download: 'CV downloaded',
  project_open: 'Case studies opened',
  badge_open: 'Badges inspected',
  terminal_command: 'Terminal commands',
  contact_copy_email: 'Email copied',
}

function Bars({ items, unit }: { items: { label: string; total: number }[]; unit?: string }) {
  const max = Math.max(1, ...items.map((i) => i.total))
  if (!items.length) return <p className="text-sm text-[var(--ink-secondary)]">No data yet.</p>
  return (
    <ul className="flex flex-col gap-2">
      {items.map((i) => (
        <li key={i.label} className="grid grid-cols-[minmax(0,140px)_1fr_auto] items-center gap-3 text-sm">
          <span className="truncate font-mono text-xs">{i.label}</span>
          <span className="h-2 rounded-full bg-[var(--bg-subtle)]"><span className="block h-2 rounded-full bg-[var(--accent)]" style={{ width: `${(i.total / max) * 100}%` }} /></span>
          <span className="tabular-nums text-[var(--ink-secondary)]">{i.total}{unit}</span>
        </li>
      ))}
    </ul>
  )
}

export function AnalyticsPage() {
  const { data, error, loading } = useAsync(async () => {
    const now = Date.now()
    const days = Array.from({ length: 30 }, (_, i) => new Date(now - (29 - i) * 86400000).toISOString().slice(0, 10))
    const since = days[0]
    const [daily, top] = await Promise.all([
      db().from('event_daily').select('day,name,total').gte('day', since),
      db().from('event_top_labels').select('name,label,total').order('total', { ascending: false }).limit(200),
    ])
    if (daily.error) throw new Error(daily.error.message)
    if (top.error) throw new Error(top.error.message)
    return { daily: daily.data as Daily[], top: top.data as Top[], days }
  }, [])

  const days = data?.days ?? []
  const views = days.map((d) => data?.daily.filter((r) => r.day === d && r.name === 'page_view').reduce((s, r) => s + r.total, 0) ?? 0)
  const maxViews = Math.max(1, ...views)
  const totals = Object.keys(EVENT_LABELS).map((name) => ({ name, total: data?.daily.filter((r) => r.name === name).reduce((s, r) => s + r.total, 0) ?? 0 }))
  const topOf = (name: string) => (data?.top ?? []).filter((t) => t.name === name).slice(0, 10).map((t) => ({ label: t.label, total: t.total }))

  return (
    <>
      <PageHeader title="Analytics" path="~/admin $ htop --days 30" />
      <p className="mb-4 text-sm text-[var(--ink-secondary)]">Cookie-less, anonymous counters. No IPs, no user IDs — just which parts of the portfolio people use.</p>
      {error && <ErrorNote error={error} />}
      {loading && !data ? <Skeleton className="h-64" /> : (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {totals.map((t) => (
              <Card key={t.name} className="p-4">
                <p className="text-2xl font-bold tabular-nums">{t.total}</p>
                <p className="text-xs text-[var(--ink-secondary)]">{EVENT_LABELS[t.name]}</p>
              </Card>
            ))}
          </div>
          <Card>
            <p className="mb-4 text-sm font-semibold">Page views · last 30 days</p>
            <div className="flex h-40 items-end gap-1" role="img" aria-label={`Daily page views: ${views.join(', ')}`}>
              {views.map((v, i) => (
                <div key={days[i]} title={`${days[i]}: ${v}`} className="flex-1 rounded-t bg-[var(--accent)]" style={{ height: `${Math.max(2, (v / maxViews) * 100)}%`, opacity: v ? 1 : 0.2 }} />
              ))}
            </div>
            <div className="mt-2 flex justify-between font-mono text-[11px] text-[var(--ink-secondary)]"><span>{days[0]}</span><span>{days[days.length - 1]}</span></div>
          </Card>
          <div className="grid gap-4 lg:grid-cols-3">
            <Card><p className="mb-4 text-sm font-semibold">Top terminal commands</p><Bars items={topOf('terminal_command')} /></Card>
            <Card><p className="mb-4 text-sm font-semibold">Most opened case studies</p><Bars items={topOf('project_open')} /></Card>
            <Card><p className="mb-4 text-sm font-semibold">Most inspected badges</p><Bars items={topOf('badge_open')} /></Card>
          </div>
        </div>
      )}
    </>
  )
}

// ── Activity (audit log) ─────────────────────────────────────────────
interface Audit { id: number; actor: string; table_name: string; row_id: string; action: string; created_at: string }

export function ActivityPage() {
  const { data, error, loading } = useAsync(async () => {
    const { data: rows, error: e } = await db().from('audit_log').select('id,actor,table_name,row_id,action,created_at').order('id', { ascending: false }).limit(100)
    if (e) throw new Error(e.message)
    return rows as Audit[]
  }, [])
  const verb = { INSERT: 'created', UPDATE: 'updated', DELETE: 'deleted' } as Record<string, string>

  return (
    <>
      <PageHeader title="Activity" path="~/admin $ git log --oneline" />
      {error && <ErrorNote error={error} />}
      {loading && !data ? <Skeleton className="h-64" /> : !data?.length ? <Empty>No activity yet.</Empty> : (
        <ol data-ui="terminal" className="rounded-2xl bg-[var(--surface-terminal)] p-5 font-mono text-xs leading-loose text-[var(--ink-terminal)]">
          {data.map((a) => (
            <li key={a.id} className="flex flex-wrap gap-x-3">
              <span className="text-[var(--mac-minimize)]">{a.id.toString(16).padStart(7, '0')}</span>
              <span>{verb[a.action] ?? a.action} {a.table_name}/{a.row_id}</span>
              <span className="text-[var(--ink-terminal-muted)]">— {a.actor}, {timeAgo(a.created_at)}</span>
            </li>
          ))}
        </ol>
      )}
    </>
  )
}
