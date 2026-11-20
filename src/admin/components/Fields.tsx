import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { FileText, ImagePlus, Trash2, Upload, X } from 'lucide-react'
import type { CertificateFileValue, ExperiencePhoto, ImageAsset } from '../../types'
import { Modal } from '../../components/ui/Modal'
import { listMedia, uploadMedia, type MediaRow } from '../lib/media'
import { generateCertificatePreview } from '../lib/pdf-preview'
import { useToast } from './Toast'
import { mediaPickerContent } from '../../data/media'
import { Btn } from './ui'

const inputCls =
  'w-full rounded-xl bg-[var(--bg-subtle)] px-3 py-2.5 text-sm text-[var(--ink)] placeholder:text-[var(--ink-secondary)]/60 outline-none focus-visible:bg-[var(--surface)] focus-visible:outline-2 focus-visible:outline-[var(--accent)] aria-[invalid=true]:outline-2 aria-[invalid=true]:outline-[#d92d20]'

interface FieldShellProps {
  label: string
  hint?: string
  error?: string
  children: (id: string, describedBy: string | undefined) => ReactNode
}

export function FieldShell({ label, hint, error, children }: FieldShellProps) {
  const id = useId()
  const describedBy = error || hint ? `${id}-desc` : undefined
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">{label}</label>
      {children(id, describedBy)}
      {(error || hint) && (
        <p id={describedBy} className={`text-xs ${error ? 'text-[#b42318]' : 'text-[var(--ink-secondary)]'}`}>{error ?? hint}</p>
      )}
    </div>
  )
}

interface BaseProps<V> {
  label: string
  hint?: string
  error?: string
  value: V
  onChange: (value: V) => void
}

export function TextField({ label, hint, error, value, onChange, type = 'text' }: BaseProps<string> & { type?: 'text' | 'url' | 'email' }) {
  return (
    <FieldShell label={label} hint={hint} error={error}>
      {(id, d) => <input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={Boolean(error)} aria-describedby={d} className={inputCls} />}
    </FieldShell>
  )
}

export function TextArea({ label, hint, error, value, onChange, rows = 4, mono = false }: BaseProps<string> & { rows?: number; mono?: boolean }) {
  return (
    <FieldShell label={label} hint={hint} error={error}>
      {(id, d) => (
        <textarea id={id} rows={rows} value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={Boolean(error)} aria-describedby={d} className={`${inputCls} resize-y ${mono ? 'font-mono text-xs' : ''}`} />
      )}
    </FieldShell>
  )
}

export function SelectField({ label, hint, error, value, onChange, options }: BaseProps<string> & { options: { value: string; label: string }[] }) {
  return (
    <FieldShell label={label} hint={hint} error={error}>
      {(id, d) => (
        <select id={id} value={value} onChange={(e) => onChange(e.target.value)} aria-describedby={d} className={inputCls}>
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      )}
    </FieldShell>
  )
}

/** One value per line (key decisions, features…). */
export function LinesField({ label, hint, error, value, onChange }: BaseProps<string[]>) {
  // Keep raw text locally so trailing newlines are not swallowed while typing.
  const [text, setText] = useState(value.join('\n'))
  useEffect(() => {
    if (value.join('\n') !== text.split('\n').map((l) => l.trim()).filter(Boolean).join('\n')) setText(value.join('\n'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])
  return (
    <TextArea
      label={label}
      hint={hint}
      error={error}
      rows={Math.max(3, Math.min(10, text.split('\n').length + 1))}
      value={text}
      onChange={(t) => {
        setText(t)
        onChange(t.split('\n').map((l) => l.trim()).filter(Boolean))
      }}
    />
  )
}

export function TagsField({ label, hint, error, value, onChange }: BaseProps<string[]>) {
  const [draft, setDraft] = useState('')
  const add = () => {
    const parts = draft.split(',').map((p) => p.trim()).filter((p) => p && !value.includes(p))
    if (parts.length) onChange([...value, ...parts])
    setDraft('')
  }
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      add()
    } else if (e.key === 'Backspace' && !draft && value.length) onChange(value.slice(0, -1))
  }
  return (
    <FieldShell label={label} hint={hint ?? 'Enter or comma to add · Backspace to remove'} error={error}>
      {(id, d) => (
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-[var(--bg-subtle)] p-2 focus-within:outline-2 focus-within:outline-[var(--accent)]">
          {value.map((tag, i) => (
            <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-[var(--surface)] py-1 pl-3 pr-1 text-xs font-medium">
              {tag}
              <button type="button" aria-label={`Remove ${tag}`} onClick={() => onChange(value.filter((_, j) => j !== i))} className="rounded-full p-0.5 hover:bg-[var(--surface-raised)] cursor-pointer">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <input id={id} value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={onKey} onBlur={add} aria-describedby={d} className="min-w-[8rem] flex-1 bg-transparent px-1 py-1 text-sm outline-none" />
        </div>
      )}
    </FieldShell>
  )
}

// ── Media picker ─────────────────────────────────────────────────────
export function MediaPicker({ open, onClose, onPick, accept = 'image' }: { open: boolean; onClose: () => void; onPick: (m: MediaRow) => void | Promise<void>; accept?: 'image' | 'pdf' | 'certificate' }) {
  const [items, setItems] = useState<MediaRow[] | null>(null)
  const [busy, setBusy] = useState(false)
  const toast = useToast()

  useEffect(() => {
    if (!open) return
    listMedia(accept === 'certificate' ? 'all' : accept).then(setItems).catch((e: unknown) => toast(e instanceof Error ? e.message : 'Failed to load media', 'error'))
  }, [open, accept, toast])

  const upload = async (file: File | undefined) => {
    if (!file) return
    setBusy(true)
    try {
      const row = await uploadMedia(file, '')
      await onPick(row)
      setItems(null)
      onClose()
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Upload failed', 'error')
    } finally {
      setBusy(false)
    }
  }

  const choose = async (media: MediaRow) => {
    setBusy(true)
    try {
      await onPick(media)
      setItems(null)
      onClose()
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Could not select media', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={open} onOpenChange={(o) => { if (!o) { setItems(null); onClose() } }} title={accept === 'certificate' ? 'Choose a certificate file' : accept === 'pdf' ? 'Choose a PDF' : 'Choose an image'} className="max-w-3xl p-6">
      <div className="mt-4 flex flex-col gap-4">
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[var(--bg-subtle)] p-6 text-sm font-medium hover:bg-[var(--surface-raised)] focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--accent)]">
          <Upload className="h-4 w-4" />
          {busy ? accept === 'certificate' ? 'Processing certificate…' : 'Uploading…' : accept === 'certificate' ? 'Upload PDF or image' : accept === 'pdf' ? 'Upload a new PDF' : mediaPickerContent.imageUploadLabel}
          <input type="file" className="sr-only" accept={accept === 'certificate' ? '.pdf,application/pdf,image/*' : accept === 'pdf' ? '.pdf,application/pdf' : 'image/*'} disabled={busy} onChange={(e) => void upload(e.target.files?.[0])} />
        </label>
        {items === null ? (
          <p className="text-sm text-[var(--ink-secondary)]">Loading library…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-[var(--ink-secondary)]">Library is empty.</p>
        ) : (
          <ul className="grid max-h-[50dvh] grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-4">
            {items.map((m) => (
              <li key={m.id}>
                <button type="button" disabled={busy} onClick={() => void choose(m)} className="flex w-full flex-col gap-1 rounded-xl p-1.5 text-left hover:bg-[var(--surface-raised)] cursor-pointer disabled:opacity-50 disabled:cursor-wait">
                  {m.mime.startsWith('image/') ? (
                    <img src={m.url} alt={m.alt} width={m.width} height={m.height} loading="lazy" className="aspect-square w-full rounded-lg bg-[var(--bg-subtle)] object-cover" />
                  ) : (
                    <span className="flex aspect-square w-full items-center justify-center rounded-lg bg-[var(--bg-subtle)] font-mono text-xs">PDF</span>
                  )}
                  <span className="truncate text-xs text-[var(--ink-secondary)]">{m.alt || m.path}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  )
}

const fromMedia = (m: MediaRow): ImageAsset => ({ src: m.url, alt: m.alt || 'Image', width: m.width, height: m.height })

export function ImageField({ label, hint, error, value, onChange }: BaseProps<ImageAsset | undefined>) {
  const [picking, setPicking] = useState(false)
  return (
    <FieldShell label={label} hint={hint} error={error}>
      {(id) => (
        <div className="flex flex-col gap-3 rounded-xl bg-[var(--bg-subtle)] p-3 sm:flex-row">
          {value ? (
            <img src={value.src} alt={value.alt} width={value.width} height={value.height} className="h-28 w-40 shrink-0 rounded-lg bg-[var(--surface)] object-contain" />
          ) : (
            <div className="flex h-28 w-40 shrink-0 items-center justify-center rounded-lg bg-[var(--surface)] text-xs text-[var(--ink-secondary)]">No image</div>
          )}
          <div className="flex flex-1 flex-col gap-2">
            {value && (
              <input id={id} value={value.alt} onChange={(e) => onChange({ ...value, alt: e.target.value })} placeholder="Alt text (required)" aria-label="Alt text" className={inputCls} />
            )}
            {value && <p className="font-mono text-xs text-[var(--ink-secondary)]">{value.width}×{value.height} · {value.src.split('/').pop()}</p>}
            <div className="mt-auto flex gap-2">
              <Btn onClick={() => setPicking(true)}><ImagePlus className="h-4 w-4" /> {value ? 'Replace' : 'Choose'}</Btn>
              {value && <Btn variant="danger" onClick={() => onChange(undefined)}><Trash2 className="h-4 w-4" /> Remove</Btn>}
            </div>
          </div>
          <MediaPicker open={picking} onClose={() => setPicking(false)} onPick={(m) => onChange(fromMedia(m))} />
        </div>
      )}
    </FieldShell>
  )
}

export function CertificateFileField({ label, hint, error, value, onChange, documentTitle }: BaseProps<CertificateFileValue> & { documentTitle: string }) {
  const [picking, setPicking] = useState(false)
  const [generating, setGenerating] = useState(false)
  const mounted = useRef(true)
  const request = useRef<AbortController | null>(null)
  const toast = useToast()
  const image = value.image?.src ? value.image : undefined
  const src = value.pdfUrl || image?.src

  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false; request.current?.abort() }
  }, [])

  const attachPdf = async (pdfUrl: string) => {
    const controller = new AbortController()
    request.current = controller
    setGenerating(true)
    try {
      const preview = await generateCertificatePreview(pdfUrl, documentTitle, controller.signal)
      if (mounted.current) onChange({ pdfUrl, image: preview })
    } catch (error) {
      if (mounted.current && !controller.signal.aborted) {
        onChange({ pdfUrl })
        toast(`PDF attached, but its preview could not be generated. ${error instanceof Error ? error.message : 'Use Generate preview to retry.'}`, 'error')
      }
    } finally {
      if (mounted.current) setGenerating(false)
    }
  }

  const selectFile = async (media: MediaRow) => {
    if (media.mime === 'application/pdf') await attachPdf(media.url)
    else onChange({ image: fromMedia(media) })
  }
  return (
    <FieldShell label={label} hint={hint} error={error}>
      {(id, describedBy) => (
        <div className="flex flex-col gap-3">
          {image && <img src={image.src} alt={image.alt} width={image.width} height={image.height} className="max-h-44 w-full bg-[var(--bg-subtle)] object-contain" />}
          {value.pdfUrl && <p className="flex items-center gap-2 text-sm"><FileText aria-hidden="true" className="h-5 w-5" /> PDF document</p>}
          <input id={id} value={src?.split('/').pop() ?? ''} readOnly placeholder="No certificate file selected" aria-describedby={describedBy} aria-invalid={Boolean(error)} className={inputCls} />
          {image && <input disabled={generating} value={image.alt} onChange={(event) => onChange({ ...value, image: { ...image, alt: event.target.value } })} aria-label="Certificate image alt text" placeholder="Alt text (required for images)" className={inputCls} />}
          <div className="flex flex-wrap gap-2">
            <Btn disabled={generating} onClick={() => setPicking(true)}><Upload className="h-4 w-4" /> {src ? 'Replace file' : 'Choose PDF or image'}</Btn>
            {src && <Btn disabled={generating} variant="danger" onClick={() => onChange({})}><Trash2 className="h-4 w-4" /> Remove file</Btn>}
            {value.pdfUrl && !image && <Btn disabled={generating} onClick={() => void attachPdf(value.pdfUrl!)}>Generate preview</Btn>}
            {value.pdfUrl && <a href={value.pdfUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center rounded-full px-3 text-sm underline">Open PDF</a>}
          </div>
          {generating && <p role="status" className="text-sm text-[var(--ink-secondary)]">Generating preview…</p>}
          <MediaPicker open={picking} accept="certificate" onClose={() => setPicking(false)} onPick={selectFile} />
        </div>
      )}
    </FieldShell>
  )
}

export function ImagesField({ label, hint, error, value, onChange }: BaseProps<ExperiencePhoto[]>) {
  const [picking, setPicking] = useState(false)
  const update = (i: number, patch: Partial<ExperiencePhoto>) => onChange(value.map((p, j) => (j === i ? { ...p, ...patch } : p)))
  return (
    <FieldShell label={label} hint={hint} error={error}>
      {() => (
        <div className="flex flex-col gap-2">
          {value.map((p, i) => (
            <div key={p.src} className="flex gap-3 rounded-xl bg-[var(--bg-subtle)] p-2">
              <img src={p.src} alt={p.alt} width={p.width} height={p.height} className="h-20 w-28 shrink-0 rounded-lg object-cover" />
              <div className="grid flex-1 gap-2 sm:grid-cols-[1fr_1fr_80px]">
                <input value={p.alt} onChange={(e) => update(i, { alt: e.target.value })} placeholder="Alt text" aria-label="Alt text" className={inputCls} />
                <input value={p.caption ?? ''} onChange={(e) => update(i, { caption: e.target.value || undefined })} placeholder="Caption" aria-label="Caption" className={inputCls} />
                <input value={p.year ?? ''} onChange={(e) => update(i, { year: e.target.value || undefined })} placeholder="Year" aria-label="Year" className={inputCls} />
              </div>
              <button type="button" aria-label="Remove photo" onClick={() => onChange(value.filter((_, j) => j !== i))} className="self-start rounded-full p-2 text-[#b42318] hover:bg-[#fef3f2] cursor-pointer">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <Btn className="self-start" onClick={() => setPicking(true)}><ImagePlus className="h-4 w-4" /> Add photo</Btn>
          <MediaPicker open={picking} onClose={() => setPicking(false)} onPick={(m) => onChange([...value, fromMedia(m)])} />
        </div>
      )}
    </FieldShell>
  )
}
