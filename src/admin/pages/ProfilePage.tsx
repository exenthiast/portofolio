import { useMemo, useState } from 'react'
import { FileText, Plus, Trash2 } from 'lucide-react'
import { profileSchema, type ProfileContent } from '../../schemas/content'
import { content as bundled } from '../../data/content'
import { repo } from '../lib/repo'
import { usePending } from '../lib/pending'
import { listMedia, type MediaRow } from '../lib/media'
import { useAsync } from '../lib/useAsync'
import { useToast } from '../components/Toast'
import { Btn, Card, ErrorNote, PageHeader, Skeleton } from '../components/ui'
import { timeAgo } from '../lib/time'
import { ImageField, MediaPicker, TextArea, TextField } from '../components/Fields'

export function ProfilePage() {
  const toast = useToast()
  const { refresh } = usePending()
  const { data, error, loading } = useAsync(() => repo.profile(), [])
  const cvs = useAsync(() => listMedia('pdf'), [])
  const [edited, setDoc] = useState<ProfileContent | null>(null)
  const [saving, setSaving] = useState(false)
  const [pickCv, setPickCv] = useState(false)

  // Local edits win; otherwise show the DB row (or the bundled snapshot before the first save).
  const doc = edited ?? data?.data ?? (loading ? null : bundled.profile)

  const result = useMemo(() => (doc ? profileSchema.safeParse(doc) : null), [doc])
  const errors = useMemo(() => {
    const m: Record<string, string> = {}
    if (result && !result.success) for (const i of result.error.issues) m[i.path.join('.')] ??= i.message
    return m
  }, [result])

  if (error) return <ErrorNote error={error} />
  if (!doc) return <Skeleton className="h-96" />

  const set = <K extends keyof ProfileContent>(key: K, value: ProfileContent[K]) => setDoc({ ...doc, [key]: value })

  const save = async (next: ProfileContent = doc) => {
    const parsed = profileSchema.safeParse(next)
    if (!parsed.success) return toast(parsed.error.issues[0]?.message ?? 'Invalid profile', 'error')
    setSaving(true)
    try {
      await repo.saveProfile(parsed.data)
      toast('profile.md saved')
      await refresh()
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Save failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  const toggleAvailability = async () => {
    const next = { ...doc, availableForWork: !doc.availableForWork }
    setDoc(next)
    await save(next)
  }

  const applyCv = async (row: MediaRow) => {
    const next = { ...doc, resumeUrl: row.url }
    setDoc(next)
    await save(next)
    cvs.reload()
  }

  return (
    <>
      <PageHeader title="Profile & CV" path="~/admin/profile.md" actions={<Btn variant="accent" disabled={saving} onClick={() => void save()}>Save profile</Btn>} />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="flex flex-col gap-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField label="First name" value={doc.firstName} onChange={(v) => set('firstName', v)} error={errors.firstName} />
            <TextField label="Last name" value={doc.lastName} onChange={(v) => set('lastName', v)} error={errors.lastName} />
            <TextField label="Title" value={doc.title} onChange={(v) => set('title', v)} error={errors.title} />
            <TextField label="Affiliation" value={doc.affiliation} onChange={(v) => set('affiliation', v)} error={errors.affiliation} />
            <TextField label="Location" value={doc.location} onChange={(v) => set('location', v)} error={errors.location} />
            <TextField label="Email" type="email" value={doc.email} onChange={(v) => set('email', v)} error={errors.email} />
          </div>
          <TextField label="Hero subtitle" hint="Max 2 lines on the hero" value={doc.subtitle} onChange={(v) => set('subtitle', v)} error={errors.subtitle} />
          <TextField label="Status text" value={doc.statusText} onChange={(v) => set('statusText', v)} error={errors.statusText} />
          <TextArea label="Bio" value={doc.bio} onChange={(v) => set('bio', v)} error={errors.bio} />
          <ImageField label="Profile photo" value={doc.photo} onChange={(v) => setDoc(() => {
            const next = { ...doc }
            if (v) next.photo = v
            else delete next.photo
            return next
          })} />
          <fieldset className="flex flex-col gap-3">
            <legend className="mb-2 text-sm font-medium">Social links</legend>
            {doc.socialLinks.map((s, i) => (
              <div key={i} className="grid gap-2 sm:grid-cols-[110px_1fr_140px_auto]">
                <TextField label="Name" value={s.name} onChange={(v) => set('socialLinks', doc.socialLinks.map((x, j) => (j === i ? { ...x, name: v, id: x.id || v.toLowerCase() } : x)))} />
                <TextField label="URL" type="url" value={s.url} onChange={(v) => set('socialLinks', doc.socialLinks.map((x, j) => (j === i ? { ...x, url: v } : x)))} error={errors[`socialLinks.${i}.url`]} />
                <TextField label="Handle" value={s.handle ?? ''} onChange={(v) => set('socialLinks', doc.socialLinks.map((x, j) => (j === i ? { ...x, handle: v || undefined } : x)))} />
                <button type="button" aria-label={`Remove ${s.name}`} onClick={() => set('socialLinks', doc.socialLinks.filter((_, j) => j !== i))} className="self-end rounded-full p-2.5 text-[#b42318] hover:bg-[#fef3f2] cursor-pointer">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <Btn className="self-start" onClick={() => set('socialLinks', [...doc.socialLinks, { id: '', name: '', url: 'https://' }])}><Plus className="h-4 w-4" /> Add link</Btn>
          </fieldset>
        </Card>

        <div className="flex flex-col gap-4">
          <Card className="flex flex-col gap-3">
            <p className="text-sm text-[var(--ink-secondary)]">Availability</p>
            <button
              type="button"
              role="switch"
              aria-checked={doc.availableForWork}
              onClick={() => void toggleAvailability()}
              className="flex items-center justify-between gap-4 rounded-xl bg-[var(--bg-subtle)] p-4 text-left cursor-pointer"
            >
              <span className="font-semibold">{doc.availableForWork ? 'Available for work' : 'Not available'}</span>
              <span className={`relative h-6 w-11 rounded-full transition-colors ${doc.availableForWork ? 'bg-[var(--accent)]' : 'bg-[var(--surface-raised)]'}`}>
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${doc.availableForWork ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </span>
            </button>
            <p className="text-xs text-[var(--ink-secondary)]">Saved instantly · goes live on the next Publish.</p>
          </Card>

          <Card className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-[var(--ink-secondary)]">Curriculum vitae</p>
              <Btn onClick={() => setPickCv(true)}><Plus className="h-4 w-4" /> New version</Btn>
            </div>
            <a href={doc.resumeUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 truncate rounded-xl bg-[var(--bg-subtle)] p-3 font-mono text-xs hover:bg-[var(--surface-raised)]">
              <FileText className="h-4 w-4 shrink-0" /> <span className="truncate">{doc.resumeUrl.split('/').pop()}</span>
              <span className="ml-auto shrink-0 rounded-full bg-[var(--accent)] px-2 py-0.5 font-sans text-[10px] font-semibold text-white">current</span>
            </a>
            {cvs.data && cvs.data.filter((c) => c.url !== doc.resumeUrl).length > 0 && (
              <ul className="flex flex-col gap-1" aria-label="CV history">
                {cvs.data.filter((c) => c.url !== doc.resumeUrl).map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-xs hover:bg-[var(--bg-subtle)]">
                    <a href={c.url} target="_blank" rel="noopener noreferrer" className="truncate font-mono">{c.path.split('/').pop()}</a>
                    <span className="shrink-0 text-[var(--ink-secondary)]">{timeAgo(c.created_at)}</span>
                    <button type="button" onClick={() => void applyCv(c)} className="shrink-0 font-medium underline cursor-pointer">use</button>
                  </li>
                ))}
              </ul>
            )}
            <MediaPicker open={pickCv} accept="pdf" onClose={() => setPickCv(false)} onPick={(m) => void applyCv(m)} />
          </Card>
        </div>
      </div>
    </>
  )
}
