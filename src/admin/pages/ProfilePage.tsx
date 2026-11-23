import { useMemo, useState } from 'react'
import { FileText, Plus, Trash2 } from 'lucide-react'
import { profileSchema, type Credential, type ProfileContent } from '../../schemas/content'
import { content as bundled } from '../../data/content'
import { aboutContent } from '../../data/about'
import { navbarBrandContent } from '../../data/branding'
import { cvContent, cvLanguages, getCvDocuments } from '../../data/cv'
import type { CvLanguage } from '../../types/profile'
import { NavbarBrand } from '../../components/ui/NavbarBrand'
import { repo } from '../lib/repo'
import { usePending } from '../lib/pending'
import { listMedia, type MediaRow } from '../lib/media'
import { useAsync } from '../lib/useAsync'
import { useToast } from '../components/Toast'
import { Btn, Card, ErrorNote, PageHeader, Skeleton } from '../components/ui'
import { timeAgo } from '../lib/time'
import { ImageField, MediaPicker, TextArea, TextField } from '../components/Fields'
import { TranslationFields } from '../components/TranslationFields'

export function ProfilePage() {
  const toast = useToast()
  const { refresh } = usePending()
  const { data, error, loading } = useAsync(() => repo.profile(), [])
  const cvs = useAsync(async () => {
    const [media, credentials] = await Promise.all([listMedia('pdf'), repo.list<Credential>('badges')])
    const certificatePdfs = new Set(credentials.flatMap(({ data }) => data.kind === 'certificate' && data.pdfUrl ? [data.pdfUrl] : []))
    return media.filter((file) => !certificatePdfs.has(file.url))
  }, [])
  const [edited, setDoc] = useState<ProfileContent | null>(null)
  const [saving, setSaving] = useState(false)
  const [pickCv, setPickCv] = useState<CvLanguage | null>(null)

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

  const applyCv = (row: MediaRow, language: CvLanguage) => {
    if (row.mime !== 'application/pdf') throw new Error(cvContent.pdfRequired)
    const key = language === 'id' ? 'resumeUrl' : 'resumeEnglishUrl'
    setDoc((previous) => ({ ...(previous ?? doc), [key]: row.url }))
    cvs.reload()
  }

  const selectedCvs = getCvDocuments(doc)
  const previousCvs = cvs.data?.filter((file) => !selectedCvs.some((cv) => cv.url === file.url)) ?? []

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
          <TextArea label="Short bio" value={doc.bio} onChange={(v) => set('bio', v)} error={errors.bio} />
          <TextArea label="About story" hint="Shown in the About terminal and cat ./about.md. Separate paragraphs with a blank line. Save profile, then Publish to update the live site." rows={8} value={doc.aboutBio ?? aboutContent.defaultBio} onChange={(v) => set('aboutBio', v)} error={errors.aboutBio} />
          <TranslationFields document={doc} value={doc.translations} onChange={(value) => set('translations', value)} />
          <ImageField label={navbarBrandContent.logoLabel} hint={navbarBrandContent.logoHint} error={errors['navbarLogo.alt'] ?? errors['navbarLogo.src'] ?? errors['navbarLogo.width'] ?? errors['navbarLogo.height']} value={doc.navbarLogo} onChange={(value) => {
            const next = { ...doc }
            if (value) next.navbarLogo = value
            else delete next.navbarLogo
            setDoc(next)
          }} />
          <div className="flex flex-col gap-3">
            <p className="text-sm text-[var(--ink-secondary)]">{navbarBrandContent.previewLabel}</p>
            <NavbarBrand firstName={doc.firstName} title={doc.title} logo={doc.navbarLogo} />
          </div>
          <ImageField label="Profile photo" hint="Shown in About. Choose or upload a photo, enter its alt text, then Save profile. Changes go live after Publish. Remove hides the photo." error={errors['photo.alt'] ?? errors['photo.src'] ?? errors['photo.width'] ?? errors['photo.height']} value={doc.photo} onChange={(v) => setDoc(() => {
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
            <p className="text-sm font-medium">{cvContent.heading}</p>
            <p className="text-sm text-[var(--ink-secondary)]">{cvContent.saveHint}</p>
            {cvLanguages.map(({ id, label }) => {
              const selected = selectedCvs.find((cv) => cv.language === id)
              return (
                <fieldset key={id} className="flex min-w-0 flex-col gap-3 rounded-xl bg-[var(--bg-subtle)] p-3">
                  <legend className="px-1 text-sm font-semibold">{label}</legend>
                  {selected ? (
                    <a href={selected.url} target="_blank" rel="noopener noreferrer" className="flex min-h-11 min-w-0 items-center gap-2 text-sm underline">
                      <FileText aria-hidden="true" className="h-4 w-4 shrink-0" />
                      <span className="truncate">{selected.url.split('/').pop()}</span>
                    </a>
                  ) : <p className="text-sm text-[var(--ink-secondary)]">{cvContent.missingEnglish}</p>}
                  <Btn disabled={saving} onClick={() => setPickCv(id)}><Plus aria-hidden="true" className="h-4 w-4" /> {cvContent.choose}</Btn>
                  {id === 'en' && selected && (
                    <Btn disabled={saving} onClick={() => setDoc((previous) => {
                      const next = { ...(previous ?? doc) }
                      delete next.resumeEnglishUrl
                      return next
                    })}>{cvContent.removeEnglish}</Btn>
                  )}
                  {errors[id === 'id' ? 'resumeUrl' : 'resumeEnglishUrl'] && (
                    <p role="alert" className="text-sm text-[#b42318]">{errors[id === 'id' ? 'resumeUrl' : 'resumeEnglishUrl']}</p>
                  )}
                </fieldset>
              )
            })}
            {previousCvs.length > 0 && (
              <ul className="flex flex-col gap-3" aria-label={cvContent.history}>
                {previousCvs.map((file) => (
                  <li key={file.id} className="flex min-w-0 flex-col gap-2 rounded-lg bg-[var(--bg-subtle)] p-3 text-sm">
                    <a href={file.url} target="_blank" rel="noopener noreferrer" className="truncate underline">{file.path.split('/').pop()}</a>
                    <span className="text-[var(--ink-secondary)]">{timeAgo(file.created_at)}</span>
                    <div className="flex flex-wrap gap-2">
                      {cvLanguages.map(({ id, label }) => (
                        <Btn key={id} disabled={saving} onClick={() => applyCv(file, id)}>{cvContent.useFor} {label}</Btn>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <MediaPicker open={pickCv !== null} accept="pdf" onClose={() => setPickCv(null)} onPick={(file) => { if (pickCv) applyCv(file, pickCv) }} />
          </Card>
        </div>
      </div>
    </>
  )
}
