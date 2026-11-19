import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ArrowLeft, Eye, EyeOff, Save, Trash2 } from 'lucide-react'
import { getAt, getCollection, prune, setAt, type CollectionDef, type FieldDef } from '../lib/collections'
import { repo, type Status } from '../lib/repo'
import { usePending } from '../lib/pending'
import { useToast } from '../components/Toast'
import { Btn, ErrorNote, PageHeader, Skeleton } from '../components/ui'
import { CertificateFileField, ImageField, ImagesField, LinesField, SelectField, TagsField, TextArea, TextField } from '../components/Fields'
import { ProjectCaseStudy } from '../../components/sections/ProjectDrawer'
import { CredentialDetail } from '../../components/sections/CredentialDetail'
import { credentialsCopy } from '../../data/credentials'
import { ExperienceEntry } from '../../components/sections/Experience'
import type { Credential, Experience, ExperiencePhoto, ImageAsset, Project } from '../../types'

type AnyDoc = { id: string }

const draftKey = (collection: string, id: string) => `admin-draft:${collection}:${id}`

function readLocalDraft(key: string): AnyDoc | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as AnyDoc) : null
  } catch {
    return null
  }
}

function Field({ field, doc, error, onChange }: { field: FieldDef; doc: AnyDoc; error?: string; onChange: (path: string, value: unknown) => void }) {
  const value = getAt(doc, field.path)
  const set = (v: unknown) => onChange(field.path, v)
  const common = { label: field.label, hint: field.hint, error }
  switch (field.type) {
    case 'text':
      return <TextField {...common} value={typeof value === 'string' ? value : ''} onChange={set} />
    case 'url':
      return <TextField {...common} type="url" value={typeof value === 'string' ? value : ''} onChange={set} />
    case 'textarea':
      return <TextArea {...common} mono={field.path.endsWith('databaseSchema')} value={typeof value === 'string' ? value : ''} onChange={set} />
    case 'select':
      return <SelectField {...common} options={field.options ?? []} value={typeof value === 'string' ? value : field.path === 'kind' ? 'badge' : ''} onChange={set} />
    case 'tags':
      return <TagsField {...common} value={Array.isArray(value) ? (value as string[]) : []} onChange={set} />
    case 'lines':
      return <LinesField {...common} value={Array.isArray(value) ? (value as string[]) : []} onChange={set} />
    case 'image': {
      const image = value as ImageAsset | undefined
      return <ImageField {...common} value={image?.src ? image : undefined} onChange={set} />
    }
    case 'images':
      return <ImagesField {...common} value={Array.isArray(value) ? (value as ExperiencePhoto[]) : []} onChange={set} />
    case 'certificate':
      return <CertificateFileField key={doc.id} {...common} documentTitle={String(getAt(doc, 'title') ?? '')} value={{ image: getAt(doc, 'image') as ImageAsset | undefined, pdfUrl: getAt(doc, 'pdfUrl') as string | undefined }} onChange={(file) => { onChange('image', file.image); onChange('pdfUrl', file.pdfUrl) }} />
  }
}

function Preview({ collection, doc }: { collection: string; doc: AnyDoc }) {
  // Previews reuse the real public components, so what you see is what ships.
  if (collection === 'projects') return <ProjectCaseStudy project={doc as Project} />
  if (collection === 'badges') {
    const credential = doc as Credential
    return (
      <div>
        <h2 className="pr-10 text-[length:var(--step-lead)] font-semibold tracking-tight">{credential.title || credentialsCopy.detailTitle}</h2>
        <CredentialDetail credential={credential} />
      </div>
    )
  }
  return (
    <ol className="rounded-2xl bg-[var(--bg-subtle)] p-3">
      <ExperienceEntry item={{ ...(doc as Experience), photos: (doc as Experience).photos ?? [] }} />
    </ol>
  )
}

export function CollectionEditor() {
  const { collection = '', id = 'new' } = useParams()
  const def = getCollection(collection) as CollectionDef<AnyDoc> | null
  const isNew = id === 'new'
  const navigate = useNavigate()
  const toast = useToast()
  const { refresh } = usePending()

  const [doc, setDoc] = useState<AnyDoc | null>(null)
  const [original, setOriginal] = useState<string>('')
  const [status, setStatus] = useState<Status>('draft')
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [showErrors, setShowErrors] = useState(false)
  const [restorable, setRestorable] = useState<AnyDoc | null>(null)
  const [preview, setPreview] = useState(true)

  // Load
  useEffect(() => {
    if (!def) return
    let cancelled = false
    const init = async () => {
      try {
        const row = isNew ? null : await repo.get<AnyDoc>(def.key, id)
        if (cancelled) return
        if (!isNew && !row) return setLoadError(`${collection}/${id}: No such file`)
        const initial = row ? row.data : def.blank()
        setDoc(initial)
        setOriginal(JSON.stringify(initial))
        setStatus(row ? row.status : 'draft')
        const local = readLocalDraft(draftKey(collection, id))
        if (local && JSON.stringify(local) !== JSON.stringify(initial)) setRestorable(local)
      } catch (e) {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : String(e))
      }
    }
    void init()
    return () => {
      cancelled = true
    }
  }, [def, isNew, id, collection])

  const dirty = doc !== null && JSON.stringify(doc) !== original

  // Autosave a local recovery copy (survives tab crashes / accidental closes).
  useEffect(() => {
    if (!doc || !dirty) return
    const t = window.setTimeout(() => {
      try {
        localStorage.setItem(draftKey(collection, id), JSON.stringify(doc))
      } catch {
        /* storage unavailable */
      }
    }, 600)
    return () => window.clearTimeout(t)
  }, [doc, dirty, collection, id])

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (!dirty) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty])

  const validation = useMemo(() => (doc && def ? def.schema.safeParse(prune(doc, def.fields)) : null), [doc, def])
  const errors = useMemo(() => {
    const map: Record<string, string> = {}
    if (validation && !validation.success) {
      for (const issue of validation.error.issues) {
        const path = issue.path.join('.')
        // Attach nested errors (e.g. preview.alt) to their field.
        const field = def?.fields.find((f) => [f.path, ...(f.validationPaths ?? [])].some((prefix) => path === prefix || path.startsWith(`${prefix}.`)))
        const key = field?.path ?? path
        map[key] ??= issue.message
      }
    }
    return map
  }, [validation, def])

  const save = useCallback(
    async (nextStatus: Status = status) => {
      if (!def || !doc || !validation) return
      if (!validation.success) {
        setShowErrors(true)
        toast(`${Object.keys(errors).length} field(s) need attention`, 'error')
        return
      }
      setSaving(true)
      try {
        const clean = validation.data
        await repo.save(def.key, clean, nextStatus, isNew ? undefined : id, isNew ? Date.now() % 1_000_000 : undefined)
        try {
          localStorage.removeItem(draftKey(collection, id))
        } catch {
          /* ignore */
        }
        setStatus(nextStatus)
        setDoc(clean)
        setOriginal(JSON.stringify(clean))
        toast(`saved ${collection}/${clean.id} (${nextStatus})`)
        await refresh()
        if (isNew || clean.id !== id) navigate(`/${collection}/${clean.id}`, { replace: true })
      } catch (e) {
        toast(e instanceof Error ? e.message : 'Save failed', 'error')
      } finally {
        setSaving(false)
      }
    },
    [def, doc, validation, status, errors, isNew, id, collection, toast, refresh, navigate],
  )

  // ⌘S / Ctrl+S
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        void save()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [save])

  const remove = async () => {
    if (!def || isNew || !window.confirm(`rm ${collection}/${id}? This cannot be undone.`)) return
    try {
      await repo.remove(def.key, id)
      toast(`removed ${collection}/${id}`)
      await refresh()
      navigate(`/${collection}`)
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Delete failed', 'error')
    }
  }

  if (!def) return <ErrorNote error={`No such directory: ${collection}`} />
  if (loadError) return <ErrorNote error={loadError} />
  if (!doc) return <Skeleton className="h-96" />

  const onChange = (path: string, value: unknown) => setDoc((d) => (d ? setAt(d, path, value) : d))

  return (
    <>
      <Link to={`/${collection}`} className="mb-3 inline-flex items-center gap-1.5 rounded text-sm text-[var(--ink-secondary)] hover:text-[var(--ink)]">
        <ArrowLeft className="h-4 w-4" /> {def.label}
      </Link>
      <PageHeader
        title={isNew ? `New ${def.singular}` : def.titleOf(doc)}
        path={`~/admin/${collection}/${isNew ? 'new' : id}`}
        actions={
          <>
            <Btn variant="ghost" onClick={() => setPreview((p) => !p)} className="hidden xl:inline-flex" aria-pressed={preview}>
              {preview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />} Preview
            </Btn>
            {!isNew && <Btn variant="danger" onClick={() => void remove()}><Trash2 className="h-4 w-4" /> Delete</Btn>}
            <Btn onClick={() => void save('draft')} disabled={saving}><Save className="h-4 w-4" /> Save draft</Btn>
            <Btn variant="accent" onClick={() => void save('published')} disabled={saving}>
              {status === 'published' ? 'Save' : 'Save & mark published'}
            </Btn>
          </>
        }
      />

      {restorable && (
        <div role="status" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#fffaeb] p-4 text-sm">
          <span>Unsaved local changes from a previous session were found.</span>
          <span className="flex gap-2">
            <Btn onClick={() => { setDoc(restorable); setRestorable(null) }}>Restore</Btn>
            <Btn variant="ghost" onClick={() => { localStorage.removeItem(draftKey(collection, id)); setRestorable(null) }}>Discard</Btn>
          </span>
        </div>
      )}

      <p className="mb-4 text-xs text-[var(--ink-secondary)]" aria-live="polite">
        {dirty ? '● unsaved changes — ⌘S to save' : '✓ saved'} · status: <strong>{status}</strong> · published items go live on the next Publish
      </p>

      <div className={`grid gap-6 ${preview ? 'xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]' : ''}`}>
        <form className="flex flex-col gap-5 rounded-2xl bg-[var(--surface)] p-5 sm:p-6" onSubmit={(e) => { e.preventDefault(); void save() }} noValidate>
          <TextField label="ID" hint="Stable identifier (changing it creates a new URL key)" value={doc.id} onChange={(v) => onChange('id', v)} error={showErrors ? errors.id : undefined} />
          {def.fields.filter((field) => !field.credentialKind || field.credentialKind === (getAt(doc, 'kind') ?? 'badge')).map((f) => (
            <Field key={f.path} field={f} doc={doc} error={showErrors ? errors[f.path] : undefined} onChange={onChange} />
          ))}
        </form>
        {preview && (
          <aside aria-label="Live preview" className="hidden xl:block">
            <div className="sticky top-20 max-h-[calc(100dvh-6rem)] overflow-y-auto rounded-2xl bg-[var(--surface)] p-6">
              <p className="mb-4 font-mono text-xs text-[var(--ink-secondary)]">live preview · real public component</p>
              {validation?.success ? <Preview collection={collection} doc={validation.data} /> : <Preview collection={collection} doc={doc} />}
            </div>
          </aside>
        )}
      </div>
    </>
  )
}
