import { useState, type DragEvent } from 'react'
import { Copy, Trash2, Upload } from 'lucide-react'
import { deleteMedia, formatBytes, listMedia, updateAlt, uploadMedia } from '../lib/media'
import { useAsync } from '../lib/useAsync'
import { useToast } from '../components/Toast'
import { Empty, ErrorNote, PageHeader, Skeleton } from '../components/ui'
import { mediaPickerContent } from '../../data/media'

export function MediaPage() {
  const toast = useToast()
  const { data, error, loading, reload, setData } = useAsync(() => listMedia('all'), [])
  const [dragging, setDragging] = useState(false)
  const [progress, setProgress] = useState<string | null>(null)

  const upload = async (files: FileList | File[]) => {
    const list = Array.from(files)
    for (const [i, file] of list.entries()) {
      setProgress(`converting & uploading ${i + 1}/${list.length}: ${file.name}`)
      try {
        await uploadMedia(file, '')
      } catch (e) {
        toast(`${file.name}: ${e instanceof Error ? e.message : 'failed'}`, 'error')
      }
    }
    setProgress(null)
    toast(`${list.length} file(s) uploaded`)
    reload()
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files.length) void upload(e.dataTransfer.files)
  }

  return (
    <>
      <PageHeader title="Media library" path="~/admin/media" />
      <p className="mb-4 text-sm text-[var(--ink-secondary)]">{mediaPickerContent.publicAccessNotice}</p>
      <label
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`mb-6 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl p-10 text-center transition-colors ${dragging ? 'bg-[#ecfdf3]' : 'bg-[var(--surface)] hover:bg-[var(--surface-raised)]'}`}
      >
        <Upload className="h-6 w-6 text-[var(--ink-secondary)]" />
        <span className="font-semibold">{progress ?? 'Drop images or PDFs here, or click to browse'}</span>
        <span className="text-sm text-[var(--ink-secondary)]">Images are resized (≤2000px) and converted to WebP in your browser before upload.</span>
        <input type="file" multiple accept="image/*,application/pdf" className="sr-only" onChange={(e) => e.target.files && void upload(e.target.files)} />
      </label>

      {error && <ErrorNote error={error} />}
      {loading && !data ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="aspect-square" />)}</div>
      ) : !data?.length ? (
        <Empty>No media yet.</Empty>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {data.map((m) => (
            <li key={m.id} className="flex flex-col gap-2 rounded-2xl bg-[var(--surface)] p-2">
              {m.mime.startsWith('image/') ? (
                <img src={m.url} alt={m.alt} width={m.width} height={m.height} loading="lazy" className="aspect-square w-full rounded-xl bg-[var(--bg-subtle)] object-cover" />
              ) : (
                <a href={m.url} target="_blank" rel="noopener noreferrer" className="flex aspect-square items-center justify-center rounded-xl bg-[var(--bg-subtle)] font-mono text-sm">PDF ↗</a>
              )}
              <input
                defaultValue={m.alt}
                aria-label="Alt text"
                placeholder="Alt text"
                onBlur={(e) => {
                  const alt = e.target.value.trim()
                  if (alt === m.alt) return
                  updateAlt(m.id, alt).then(() => { setData((prev) => prev?.map((x) => (x.id === m.id ? { ...x, alt } : x)) ?? null); toast('alt text saved') }).catch(() => toast('Failed to save alt', 'error'))
                }}
                className="rounded-lg bg-[var(--bg-subtle)] px-2 py-1.5 text-xs outline-none focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
              />
              <div className="flex items-center justify-between gap-1 px-1 text-[11px] text-[var(--ink-secondary)]">
                <span className="truncate font-mono">{m.mime === 'application/pdf' ? 'pdf' : `${m.width}×${m.height}`} · {formatBytes(m.size_bytes)}</span>
                <span className="flex shrink-0">
                  <button type="button" aria-label="Copy URL" onClick={() => void navigator.clipboard.writeText(m.url).then(() => toast('URL copied'))} className="rounded-full p-1.5 hover:bg-[var(--surface-raised)] cursor-pointer"><Copy className="h-3.5 w-3.5" /></button>
                  <button
                    type="button"
                    aria-label="Delete file"
                    onClick={() => {
                      if (!window.confirm('Delete this file? Content still referencing it will show a placeholder.')) return
                      deleteMedia(m).then(() => { setData((prev) => prev?.filter((x) => x.id !== m.id) ?? null); toast('deleted') }).catch((e: unknown) => toast(e instanceof Error ? e.message : 'Delete failed', 'error'))
                    }}
                    className="rounded-full p-1.5 text-[#b42318] hover:bg-[#fef3f2] cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
