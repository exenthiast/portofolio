import { Reorder, useDragControls } from 'framer-motion'
import { GripVertical, Plus } from 'lucide-react'
import { useRef, useState } from 'react'
import { Link, useParams } from 'react-router'
import { getCollection, type CollectionDef } from '../lib/collections'
import { repo, type ContentRow, type Status } from '../lib/repo'
import { useAsync } from '../lib/useAsync'
import { usePending } from '../lib/pending'
import { useToast } from '../components/Toast'
import { Btn, Empty, ErrorNote, PageHeader, Skeleton, StatusPill } from '../components/ui'
import { timeAgo } from '../lib/time'

type AnyDoc = { id: string }

function Row({ row, def, onToggle }: { row: ContentRow<AnyDoc>; def: CollectionDef<AnyDoc>; onToggle: (row: ContentRow<AnyDoc>) => void }) {
  const controls = useDragControls()
  return (
    <Reorder.Item value={row} dragListener={false} dragControls={controls} className="flex items-center gap-3 rounded-2xl bg-[var(--surface)] p-3 sm:p-4" whileDrag={{ scale: 1.01, boxShadow: '0 16px 40px rgba(9,9,11,0.14)' }}>
      <button type="button" aria-label="Drag to reorder" onPointerDown={(e) => controls.start(e)} className="cursor-grab touch-none rounded-lg p-1.5 text-[var(--ink-secondary)] hover:bg-[var(--surface-raised)] active:cursor-grabbing">
        <GripVertical className="h-4 w-4" />
      </button>
      <Link to={row.id} className="min-w-0 flex-1 rounded-lg">
        <p className="truncate font-semibold">{def.titleOf(row.data)}</p>
        <p className="truncate text-sm text-[var(--ink-secondary)]">{def.subtitleOf(row.data)}</p>
      </Link>
      <span className="hidden text-xs text-[var(--ink-secondary)] sm:inline">{timeAgo(row.updated_at)}</span>
      <button type="button" onClick={() => onToggle(row)} title="Toggle draft/published" className="rounded-full cursor-pointer">
        <StatusPill status={row.status} />
      </button>
    </Reorder.Item>
  )
}

export function CollectionList() {
  const { collection = '' } = useParams()
  const def = getCollection(collection) as CollectionDef<AnyDoc> | null
  const toast = useToast()
  const { refresh } = usePending()
  const [filter, setFilter] = useState<'all' | Status>('all')
  const orderDirty = useRef(false)
  const { data, error, loading, setData } = useAsync(() => (def ? repo.list<AnyDoc>(def.key) : Promise.resolve([])), [collection])

  if (!def) return <ErrorNote error={`No such directory: ${collection}`} />

  const rows = data ?? []
  const visible = filter === 'all' ? rows : rows.filter((r) => r.status === filter)

  const onReorder = (next: ContentRow<AnyDoc>[]) => {
    orderDirty.current = true
    setData(() => next)
  }
  const persistOrder = async () => {
    if (!orderDirty.current) return
    orderDirty.current = false
    try {
      await repo.reorder(def.key, rows.map((r) => r.id))
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Reorder failed', 'error')
      return
    }
    toast('Order saved')
    try {
      await refresh()
    } catch {
      /* badge count refresh is best-effort */
    }
  }
  const toggle = async (row: ContentRow<AnyDoc>) => {
    const status: Status = row.status === 'published' ? 'draft' : 'published'
    setData((prev) => prev?.map((r) => (r.id === row.id ? { ...r, status } : r)) ?? null)
    try {
      await repo.setStatus(def.key, row.id, status)
      toast(`${def.titleOf(row.data)} → ${status}`)
      await refresh()
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Update failed', 'error')
    }
  }

  return (
    <>
      <PageHeader
        title={def.label}
        path={`~/admin/${def.key}`}
        actions={
          <Link to="new" className="inline-flex h-9 items-center gap-2 rounded-full bg-[var(--surface-terminal)] px-4 text-sm font-medium text-white hover:bg-[#1f2029]">
            <Plus className="h-4 w-4" /> New {def.singular}
          </Link>
        }
      />
      <div className="mb-4 flex items-center gap-1" role="group" aria-label="Filter by status">
        {(['all', 'published', 'draft'] as const).map((f) => (
          <Btn key={f} variant={filter === f ? 'primary' : 'ghost'} onClick={() => setFilter(f)} aria-pressed={filter === f} className="h-8 px-3">
            {f} <span className="opacity-60">{f === 'all' ? rows.length : rows.filter((r) => r.status === f).length}</span>
          </Btn>
        ))}
        <span className="ml-auto hidden text-xs text-[var(--ink-secondary)] sm:inline">Drag ⠿ to reorder — order is what visitors see</span>
      </div>
      {error && <ErrorNote error={error} />}
      {loading && !data ? (
        <div className="flex flex-col gap-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-[72px]" />)}</div>
      ) : visible.length === 0 ? (
        <Empty>No {def.label.toLowerCase()} here yet. <Link to="new" className="font-medium text-[var(--ink)] underline">Create one</Link>.</Empty>
      ) : filter === 'all' ? (
        <Reorder.Group axis="y" values={rows} onReorder={onReorder} onPointerUp={() => void persistOrder()} className="flex flex-col gap-2">
          {rows.map((row) => <Row key={row.id} row={row} def={def} onToggle={toggle} />)}
        </Reorder.Group>
      ) : (
        <ul className="flex flex-col gap-2">
          {visible.map((row) => (
            <li key={row.id}>
              <Link to={row.id} className="flex items-center justify-between gap-3 rounded-2xl bg-[var(--surface)] p-4 hover:bg-[var(--surface-raised)]">
                <span className="min-w-0"><span className="block truncate font-semibold">{def.titleOf(row.data)}</span><span className="block truncate text-sm text-[var(--ink-secondary)]">{def.subtitleOf(row.data)}</span></span>
                <StatusPill status={row.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
