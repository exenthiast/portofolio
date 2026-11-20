import { useState } from 'react'
import type { ImageAsset } from '../../schemas/content'
import type { NavbarBrandProps } from '../../types/profile'
import { navbarBrandContent } from '../../data/branding'

function Initials() {
  return (
    <span className="flex h-full w-full items-center justify-center rounded-lg bg-[var(--surface-terminal)] text-xs font-bold text-[var(--ink-terminal)] sm:text-sm">
      {navbarBrandContent.initials}
    </span>
  )
}

function Logo({ image }: { image: ImageAsset }) {
  const [failed, setFailed] = useState(false)
  if (failed) return <Initials />

  return (
    <img
      src={image.src}
      alt={image.alt}
      width={image.width}
      height={image.height}
      onError={() => setFailed(true)}
      className="h-full w-full rounded-lg bg-[var(--surface)] object-contain"
    />
  )
}

/** Shared by the public navbar and the admin's unsaved profile preview. */
export function NavbarBrand({ firstName, title, logo }: NavbarBrandProps) {
  return (
    <span className="flex min-w-0 items-center gap-2.5 sm:gap-3">
      <span className="h-8 w-8 shrink-0 sm:h-9 sm:w-9">
        {logo ? <Logo key={logo.src} image={logo} /> : <Initials />}
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="flex items-center gap-0.5 text-xs font-semibold tracking-tight text-[var(--ink)] sm:text-sm">
          {firstName}
          <span className="text-[var(--accent)]">.</span>
        </span>
        <span className="-mt-0.5 hidden text-[10px] font-normal text-[var(--ink-secondary)] xs:inline sm:text-xs">
          {title}
        </span>
      </span>
    </span>
  )
}
