import type { ImageAsset } from '../../types'
import { uploadMedia } from './media'

const PREVIEW_EDGE = 1600

/** PDF.js and its worker are loaded only when an admin requests a PDF thumbnail. */
export async function renderPdfFirstPage(data: Uint8Array): Promise<Blob> {
  const [pdfjs, { default: workerUrl }] = await Promise.all([
    import('pdfjs-dist/legacy/build/pdf.mjs'),
    import('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url'),
  ])
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl
  const task = pdfjs.getDocument({ data, useSystemFonts: true })
  const canvas = document.createElement('canvas')

  try {
    const pdf = await task.promise
    const page = await pdf.getPage(1)
    const original = page.getViewport({ scale: 1 })
    const viewport = page.getViewport({ scale: PREVIEW_EDGE / Math.max(original.width, original.height) })
    canvas.width = Math.max(1, Math.ceil(viewport.width))
    canvas.height = Math.max(1, Math.ceil(viewport.height))
    await page.render({ canvas, viewport, background: '#ffffff' }).promise

    // A lossless intermediate lets the existing media uploader encode WebP once.
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Could not create the PDF preview.')), 'image/png')
    })
  } finally {
    await task.destroy()
    canvas.width = 0
    canvas.height = 0
  }
}

export async function generateCertificatePreview(pdfUrl: string, title: string, signal?: AbortSignal): Promise<ImageAsset> {
  const response = await fetch(pdfUrl, { credentials: 'omit', signal })
  if (!response.ok) throw new Error(`Could not read the PDF (HTTP ${response.status}).`)
  const png = await renderPdfFirstPage(new Uint8Array(await response.arrayBuffer()))
  signal?.throwIfAborted()
  const file = new File([png], 'certificate-preview.png', { type: 'image/png' })
  const media = await uploadMedia(file, `First page of ${title.trim() || 'certificate PDF'}`)
  return { src: media.url, alt: media.alt, width: media.width, height: media.height }
}
