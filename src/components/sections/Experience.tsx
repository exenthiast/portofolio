import { lazy, Suspense, useId, useRef, useState, type KeyboardEvent } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { experienceCategories, experienceData } from '../../data/experience'
import { SmartImage } from '../ui/SmartImage'
import type { Experience as ExperienceItem, ExperienceCategory, ExperiencePhoto } from '../../types'

const Lightbox = lazy(() => import('../ui/Lightbox'))

export function ExperienceEntry({ item, onOpenPhoto }: { item: ExperienceItem; onOpenPhoto?: (photos: ExperiencePhoto[], index: number) => void }) {
  return (
    <li className="grid gap-3 rounded-2xl bg-[var(--surface)] p-5 sm:grid-cols-[180px_1fr] sm:gap-8 sm:p-7">
      <div className="flex flex-col items-start gap-4">
        <p className="text-[length:var(--step-small)] font-medium tabular-nums text-[var(--ink-secondary)]">{item.period}</p>
        {item.logo && (
          <SmartImage
            key={item.logo.src}
            image={item.logo}
            fallbackLabel={item.organization}
            className="h-20 w-28 object-contain object-left sm:h-24 sm:w-32"
          />
        )}
      </div>
      <div className="flex min-w-0 flex-col gap-3">
        <div>
          <h3 className="text-[length:var(--step-lead)] font-semibold leading-tight tracking-tight">{item.role}</h3>
          <p className="mt-1 text-[length:var(--step-body)] text-[var(--ink-secondary)]">
            {item.organization}
            {item.division ? ` · ${item.division}` : ''}
          </p>
        </div>
        <p className="text-[length:var(--step-body)] leading-relaxed">{item.description}</p>
        {item.skills && item.skills.length > 0 && (
          <ul className="flex flex-wrap gap-1.5" aria-label="Skills">
            {item.skills.map((s) => (
              <li key={s} className="rounded-full bg-[var(--bg-subtle)] px-2.5 py-1 text-xs font-medium text-[var(--ink-secondary)]">{s}</li>
            ))}
          </ul>
        )}
        {item.photos.length > 0 && (
          <ul className="flex gap-2 overflow-x-auto pt-1" aria-label="Documentation photos">
            {item.photos.map((photo, i) => (
              <li key={photo.src} className="shrink-0">
                <button
                  type="button"
                  onClick={() => onOpenPhoto?.(item.photos, i)}
                  className="block overflow-hidden rounded-lg cursor-zoom-in"
                  aria-label={`Open photo: ${photo.caption ?? photo.alt}`}
                >
                  <SmartImage image={photo} fallbackLabel={item.organization} className="h-20 w-28 object-cover transition-transform hover:scale-105" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </li>
  )
}

export function Experience() {
  const [active, setActive] = useState<ExperienceCategory>('organization')
  const [lightbox, setLightbox] = useState<{ photos: ExperiencePhoto[]; index: number } | null>(null)
  const reduce = useReducedMotion()
  const baseId = useId()
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  const items = experienceData.filter((e) => e.category === active)

  // WAI-ARIA tabs keyboard model: arrows move focus + selection, Home/End jump.
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const idx = experienceCategories.findIndex((c) => c.id === active)
    let next = idx
    if (e.key === 'ArrowRight') next = (idx + 1) % experienceCategories.length
    else if (e.key === 'ArrowLeft') next = (idx - 1 + experienceCategories.length) % experienceCategories.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = experienceCategories.length - 1
    else return
    e.preventDefault()
    setActive(experienceCategories[next].id)
    tabRefs.current[next]?.focus()
  }

  return (
    <section id="experience" aria-labelledby="experience-heading" className="px-4 sm:px-6 py-24 sm:py-32 bg-[var(--bg-subtle)]">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <h2 id="experience-heading" className="max-w-2xl text-[length:var(--step-head)] font-bold leading-[1.05] tracking-[-0.03em]">
            Journey beyond the codebase
          </h2>
          <div role="tablist" aria-label="Experience category" onKeyDown={onKeyDown} className="inline-flex self-start rounded-full bg-[var(--surface)] p-1 md:self-auto">
            {experienceCategories.map((c, i) => {
              const selected = c.id === active
              const count = experienceData.filter((e) => e.category === c.id).length
              return (
                <button
                  key={c.id}
                  ref={(el) => { tabRefs.current[i] = el }}
                  role="tab"
                  type="button"
                  id={`${baseId}-tab-${c.id}`}
                  aria-selected={selected}
                  aria-controls={`${baseId}-panel`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setActive(c.id)}
                  className="relative rounded-full px-3 py-2 text-sm font-medium cursor-pointer sm:px-4"
                >
                  {selected && (
                    <motion.span layoutId="exp-tab" className="absolute inset-0 rounded-full bg-[var(--surface-terminal)]" transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 260, damping: 24 }} />
                  )}
                  <span className={`relative ${selected ? 'text-white' : 'text-[var(--ink-secondary)]'}`}>
                    {c.label} <span className="tabular-nums opacity-60">{count}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div role="tabpanel" id={`${baseId}-panel`} aria-labelledby={`${baseId}-tab-${active}`}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.ol
              key={active}
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-3"
            >
              {items.map((item) => (
                <ExperienceEntry key={item.id} item={item} onOpenPhoto={(photos, index) => setLightbox({ photos, index })} />
              ))}
            </motion.ol>
          </AnimatePresence>
        </div>
      </div>
      <Suspense fallback={null}>
        {lightbox && <Lightbox photos={lightbox.photos} startIndex={lightbox.index} onClose={() => setLightbox(null)} />}
      </Suspense>
    </section>
  )
}
