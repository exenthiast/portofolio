import { db } from './supabase'

export interface MediaRow {
  id: string
  path: string
  url: string
  alt: string
  width: number
  height: number
  mime: string
  size_bytes: number
  created_at: string
}

const MAX_EDGE = 2000

/** Decode any browser-supported image, downscale to MAX_EDGE and re-encode as WebP (no dependency). */
export async function toWebp(file: File, quality = 0.86): Promise<{ blob: Blob; width: number; height: number }> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D is not available')
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('WebP encoding failed'))), 'image/webp', quality),
  )
  return { blob, width, height }
}

const slugify = (name: string) =>
  name
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40) || 'file'

export async function uploadMedia(file: File, alt: string): Promise<MediaRow> {
  const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name)
  const prefix = `${new Date().getFullYear()}/${crypto.randomUUID().slice(0, 8)}-${slugify(file.name)}`
  // Storage derives multipart MIME from the Blob, so normalize PDFs even when
  // the browser reports an empty or generic type. File bytes stay unchanged.
  let body: Blob = isPdf && file.type !== 'application/pdf'
    ? new File([file], file.name, { type: 'application/pdf', lastModified: file.lastModified })
    : file
  let width = 1
  let height = 1
  let mime = isPdf ? 'application/pdf' : file.type
  let path = `${prefix}.pdf`

  if (!isPdf) {
    if (file.type === 'image/svg+xml') {
      path = `${prefix}.svg`
    } else {
      const converted = await toWebp(file)
      body = converted.blob
      width = converted.width
      height = converted.height
      mime = 'image/webp'
      path = `${prefix}.webp`
    }
  }

  const storage = db().storage.from('media')
  const { error: upErr } = await storage.upload(path, body, { contentType: mime, cacheControl: '31536000', upsert: false })
  if (upErr) throw new Error(upErr.message)
  const url = storage.getPublicUrl(path).data.publicUrl

  const { data, error } = await db()
    .from('media')
    .insert({ path, url, alt: alt || slugify(file.name).replace(/-/g, ' '), width, height, mime, size_bytes: body.size })
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return data as MediaRow
}

export async function listMedia(kind: 'image' | 'pdf' | 'all' = 'all'): Promise<MediaRow[]> {
  let q = db().from('media').select('*').order('created_at', { ascending: false })
  if (kind === 'image') q = q.like('mime', 'image/%')
  if (kind === 'pdf') q = q.eq('mime', 'application/pdf')
  const { data, error } = await q
  if (error) throw new Error(error.message)
  return data as MediaRow[]
}

export async function updateAlt(id: string, alt: string): Promise<void> {
  const { error } = await db().from('media').update({ alt }).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteMedia(row: MediaRow): Promise<void> {
  const { error: sErr } = await db().storage.from('media').remove([row.path])
  if (sErr) throw new Error(sErr.message)
  const { error } = await db().from('media').delete().eq('id', row.id)
  if (error) throw new Error(error.message)
}

export const formatBytes = (n: number) => (n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(0)} KB` : `${(n / 1048576).toFixed(1)} MB`)
