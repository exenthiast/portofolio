import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { ExperiencePhoto } from '../../types'
import { Modal } from './Modal'

interface LightboxProps {
  photos: ExperiencePhoto[]
  startIndex: number
  onClose: () => void
}

export default function Lightbox({ photos, startIndex, onClose }: LightboxProps) {
  const [index, setIndex] = useState(startIndex)
  const photo = photos[index]
  const go = (delta: number) => setIndex((i) => (i + delta + photos.length) % photos.length)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setIndex((i) => (i + 1) % photos.length)
      if (e.key === 'ArrowLeft') setIndex((i) => (i - 1 + photos.length) % photos.length)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [photos.length])

  if (!photo) return null

  return (
    <Modal open onOpenChange={(o) => !o && onClose()} title={photo.caption ?? photo.alt} hideTitle className="max-w-5xl bg-[var(--surface-terminal)] p-3">
      <figure className="flex flex-col gap-3">
        <img src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} className="max-h-[75dvh] w-full rounded-xl object-contain" />
        <figcaption className="flex items-center justify-between gap-4 px-2 pb-1 text-sm text-[var(--ink-terminal)]">
          <span>
            {photo.caption ?? photo.alt}
            {photo.year && <span className="text-[var(--ink-terminal-muted)]"> · {photo.year}</span>}
          </span>
          {photos.length > 1 && (
            <span className="flex items-center gap-2">
              <button type="button" onClick={() => go(-1)} aria-label="Previous photo" className="rounded-full p-2 hover:bg-[var(--surface-terminal-header)] cursor-pointer"><ChevronLeft className="h-4 w-4" /></button>
              <span className="tabular-nums text-[var(--ink-terminal-muted)]">{index + 1}/{photos.length}</span>
              <button type="button" onClick={() => go(1)} aria-label="Next photo" className="rounded-full p-2 hover:bg-[var(--surface-terminal-header)] cursor-pointer"><ChevronRight className="h-4 w-4" /></button>
            </span>
          )}
        </figcaption>
      </figure>
    </Modal>
  )
}
