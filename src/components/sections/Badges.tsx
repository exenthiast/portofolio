import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowUpRight, BadgeCheck } from 'lucide-react'
import { badgesData } from '../../data/badges'
import { on } from '../../lib/events'
import { track } from '../../lib/analytics'
import { Modal } from '../ui/Modal'
import { SmartImage } from '../ui/SmartImage'
import type { Badge } from '../../types'

const CREDLY_PROFILE = 'https://www.credly.com/users/alfiz-desta'

export function BadgeDetail({ badge }: { badge: Badge }) {
  const rows: [string, string | undefined][] = [
    ['Issuer', badge.issuer],
    ['Issued', badge.issueDate],
    ['Expires', badge.expiryDate ?? 'No expiry'],
    ['Credential ID', badge.credentialId],
  ]
  return (
    <div className="mt-6 grid gap-6 sm:grid-cols-[160px_1fr]">
      <SmartImage image={badge.image} fallbackLabel={badge.issuer} className="h-40 w-40 rounded-xl object-contain" />
      <div className="flex flex-col gap-4">
        {badge.description && <p className="text-[length:var(--step-body)] leading-relaxed text-[var(--ink-secondary)]">{badge.description}</p>}
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-[length:var(--step-small)]">
          {rows.filter(([, v]) => v).map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-[var(--ink-secondary)]">{k}</dt>
              <dd className="font-medium break-all">{v}</dd>
            </div>
          ))}
        </dl>
        <ul className="flex flex-wrap gap-1.5" aria-label="Skills">
          {badge.skills.map((s) => (
            <li key={s} className="rounded-full bg-[var(--surface-raised)] px-2.5 py-1 text-xs font-medium">{s}</li>
          ))}
        </ul>
        <a href={badge.credlyUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 w-fit items-center gap-2 rounded-full bg-[var(--surface-terminal)] px-4 text-sm font-medium text-white hover:bg-[#1f2029]">
          <BadgeCheck className="h-4 w-4" aria-hidden="true" /> Verify on Credly
        </a>
      </div>
    </div>
  )
}

export function Badges() {
  const [selected, setSelected] = useState<Badge | null>(null)
  const reduce = useReducedMotion()

  const open = (badge: Badge) => {
    setSelected(badge)
    track('badge_open', badge.id)
  }

  useEffect(
    () =>
      on('open-badge', ({ id }) => {
        const badge = badgesData.find((b) => b.id === id)
        if (badge) setSelected(badge)
      }),
    [],
  )

  return (
    <section id="badges" aria-labelledby="badges-heading" className="px-4 sm:px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <h2 id="badges-heading" className="max-w-2xl text-[length:var(--step-head)] font-bold leading-[1.05] tracking-[-0.03em]">
            {badgesData.length} verified credentials
          </h2>
          <a href={CREDLY_PROFILE} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded text-[length:var(--step-body)] font-medium hover:text-[var(--accent)]">
            See all on Credly <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {badgesData.map((badge, i) => (
            <motion.li
              key={badge.id}
              initial={reduce ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.35, delay: (i % 5) * 0.05 }}
            >
              <button
                type="button"
                onClick={() => open(badge)}
                className="group flex h-full w-full flex-col items-center gap-3 rounded-2xl bg-[var(--surface)] p-4 text-center cursor-pointer transition-colors hover:bg-[var(--surface-raised)]"
              >
                <SmartImage image={badge.image} fallbackLabel={badge.issuer} className="aspect-square w-full max-w-[120px] rounded-xl object-contain transition-transform duration-300 group-hover:-translate-y-1" />
                <span className="text-sm font-semibold leading-snug line-clamp-2">{badge.title}</span>
                <span className="mt-auto text-xs text-[var(--ink-secondary)]">{badge.issuer} · {badge.issueDate}</span>
              </button>
            </motion.li>
          ))}
        </ul>
      </div>
      <Modal open={selected !== null} onOpenChange={(o) => !o && setSelected(null)} title={selected?.title ?? 'Badge'} className="max-w-2xl p-6 sm:p-8">
        {selected && <BadgeDetail badge={selected} />}
      </Modal>
    </section>
  )
}
