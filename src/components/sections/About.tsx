import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { profileData } from '../../data/profile'
import { TerminalWindow, Prompt } from '../ui/TerminalWindow'
import { SmartImage } from '../ui/SmartImage'

const initials = `${profileData.firstName[0] ?? ''}${profileData.lastName[0] ?? ''}`

function Portrait() {
  const reduce = useReducedMotion()
  return (
    <motion.figure
      whileHover={reduce ? undefined : { rotate: [0, -2, 2, -1, 0] }}
      transition={{ duration: 0.5 }}
      className="relative aspect-[4/5] w-full max-w-[320px] overflow-hidden rounded-xl bg-[var(--surface-terminal-header)]"
    >
      {profileData.photo ? (
        <SmartImage
          image={profileData.photo}
          fallbackLabel={initials}
          className="h-full w-full object-cover"
        />
      ) : (
        <div aria-hidden="true" className="flex h-full w-full items-center justify-center font-sans text-7xl font-bold tracking-tight text-[var(--ink-terminal-muted)]">
          {initials}
        </div>
      )}
      <figcaption className="absolute left-3 bottom-3 rounded-lg bg-[var(--surface-terminal)] px-3 py-2 font-sans">
        <span className="block text-sm font-semibold text-[var(--ink-terminal)]">{profileData.firstName}</span>
        <span className="block text-xs text-[var(--ink-terminal-muted)]">{profileData.location}</span>
      </figcaption>
    </motion.figure>
  )
}

/**
 * About — the portfolio card "opens" into a full terminal window as it scrolls in
 * (scale/rotation continue the Hero deck stacking). Reduced motion: static window.
 */
export function About() {
  const ref = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'start 0.25'] })
  const scale = useTransform(scrollYProgress, [0, 1], [0.86, 1])
  const rotate = useTransform(scrollYProgress, [0, 1], [3, 0])
  const y = useTransform(scrollYProgress, [0, 1], [80, 0])
  const radius = useTransform(scrollYProgress, [0, 1], [28, 16])

  return (
    <section ref={ref} id="about" aria-labelledby="about-heading" className="relative px-4 sm:px-6 py-24 sm:py-32">
      <motion.div
        style={reduce ? undefined : { scale, rotate, y, borderRadius: radius }}
        className="mx-auto max-w-6xl overflow-hidden rounded-2xl"
      >
        <TerminalWindow title="~/alfiz/about" showClock bodyClassName="p-5 sm:p-8 lg:p-12">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,320px)_1fr] lg:gap-14">
            <div className="flex flex-col gap-4">
              <Prompt>cat ./about.md</Prompt>
              <Portrait />
            </div>
            <div className="flex flex-col justify-center gap-6 font-sans">
              <h2 id="about-heading" className="text-[length:var(--step-head)] font-bold leading-[1.05] tracking-[-0.03em] text-white">
                Hi, I'm {profileData.firstName} {profileData.lastName}
              </h2>
              <p className="text-[length:var(--step-lead)] leading-snug text-[var(--ink-terminal)]">
                {profileData.title} · {profileData.affiliation} · {profileData.location}
              </p>
              <p className="max-w-2xl text-[length:var(--step-body)] leading-relaxed text-[var(--ink-terminal-muted)]">
                {profileData.bio}
              </p>
              <div className="font-mono">
                <Prompt>
                  echo $STATUS <span className="text-[var(--ink-terminal-muted)]">→</span>{' '}
                  <span className={profileData.availableForWork ? 'text-[var(--accent)]' : 'text-[var(--ink-terminal-muted)]'}>
                    {profileData.availableForWork ? 'available_for_work' : 'not_available'}
                  </span>
                </Prompt>
              </div>
            </div>
          </div>
        </TerminalWindow>
      </motion.div>
    </section>
  )
}
