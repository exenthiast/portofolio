import { useEffect, useRef, useState } from 'react'
import type { ImageAsset } from '../../types'

interface SmartImageProps {
  image: ImageAsset
  className?: string
  /** Text rendered in the placeholder when the asset is missing or fails to load. */
  fallbackLabel: string
  priority?: boolean
}

/** WebP image with explicit dimensions and a flat, on-brand placeholder when the asset is missing. */
export function SmartImage({ image, className = '', fallbackLabel, priority = false }: SmartImageProps) {
  const [failed, setFailed] = useState(false)
  const ref = useRef<HTMLImageElement>(null)

  // Catch images that already failed before React attached onError.
  useEffect(() => {
    const img = ref.current
    if (img && img.complete && img.naturalWidth === 0) setFailed(true)
  }, [image.src])

  if (failed) {
    return (
      <div
        role="img"
        aria-label={image.alt}
        style={{ aspectRatio: `${image.width} / ${image.height}` }}
        className={`flex items-center justify-center bg-[var(--surface-raised)] text-[var(--ink-secondary)] ${className}`}
      >
        <span className="px-4 text-center font-semibold tracking-tight text-[length:var(--step-small)]">{fallbackLabel}</span>
      </div>
    )
  }

  return (
    <img
      ref={ref}
      src={image.src}
      alt={image.alt}
      width={image.width}
      height={image.height}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      onError={() => setFailed(true)}
      className={className}
    />
  )
}
