import { useState, useEffect } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import { profileData } from '../../data/profile'
import { TrafficLightDots } from '../ui/TrafficLightDots'
import { SmartImage } from '../ui/SmartImage'

interface AboutTerminalProps {
  className?: string
  isEmbedded?: boolean
}

export function AboutTerminal({ className = '', isEmbedded = false }: AboutTerminalProps) {
  const { about } = profileData
  const reducedMotion = useReducedMotion()
  const [timeString, setTimeString] = useState('')
  const paragraphs = about.bio.split(/\n\s*\n/).map((text) => text.trim()).filter(Boolean)

  useEffect(() => {
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
    const updateClock = () => setTimeString(`${formatter.format(new Date())} WIB`)
    updateClock()
    const timer = setInterval(updateClock, 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className={`about-terminal w-full bg-[var(--surface)] overflow-hidden flex flex-col ${isEmbedded ? 'h-full' : 'max-w-6xl mx-auto rounded-2xl'} ${className}`}>
      {/* Terminal chrome is kept deliberately: it is the portfolio's established visual language. */}
      <div data-ui="terminal" className="grid grid-cols-[auto_1fr] sm:grid-cols-[1fr_auto_1fr] items-center gap-4 h-14 px-4 sm:px-6 bg-[var(--surface-raised)] shrink-0">
        <TrafficLightDots size="xl" />
        <code className="justify-self-end sm:justify-self-center font-mono text-[length:var(--step-small)] text-[var(--ink-secondary)]">
          {about.terminalPath}
        </code>
        <time className="hidden sm:block justify-self-end text-[length:var(--step-small)] text-[var(--ink-secondary)] tabular-nums">
          {timeString || '\u00a0'}
        </time>
      </div>

      <div data-lenis-prevent className="min-h-0 overflow-y-auto p-5 sm:p-7 lg:p-8 xl:px-10 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 mb-6">
          <code className="font-mono text-[length:var(--step-small)] text-[var(--accent)]">{about.prompt}</code>
          <code className="font-mono text-[length:var(--step-small)] text-[var(--ink)]">{about.command}</code>
          <time className="sm:hidden ml-auto text-[length:var(--step-small)] text-[var(--ink-secondary)] tabular-nums">
            {timeString || '\u00a0'}
          </time>
        </div>

        <div className={`grid gap-7 md:gap-8 lg:gap-12 ${about.photo.image ? 'md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.4fr)] lg:grid-cols-[280px_minmax(0,1fr)]' : ''}`}>
          {about.photo.image && (
            <figure className="m-0 min-w-0">
              <motion.div
                whileHover={reducedMotion ? undefined : { rotate: [-1, 1, -0.5, 0.5, 0] }}
                transition={{ duration: 0.45, ease: 'easeInOut' }}
                className="aspect-[4/3] md:aspect-[4/5] overflow-hidden bg-[var(--bg-subtle)]"
              >
                <SmartImage
                  key={about.photo.image.src}
                  image={about.photo.image}
                  fallbackLabel={about.photo.name}
                  className="w-full h-full object-cover object-top"
                />
              </motion.div>
              <figcaption className="mt-4 space-y-1">
                <p className="text-[length:var(--step-small)] font-medium text-[var(--ink)]">{about.photo.name}</p>
                <p className="text-[length:var(--step-small)] text-[var(--ink-secondary)]">{about.photo.location}</p>
              </figcaption>
            </figure>
          )}

          <div className="min-w-0 max-w-[62ch] flex flex-col items-start">
            <h2 className="text-[length:var(--step-head)] font-semibold tracking-[-0.03em] leading-[1.15] text-[var(--ink)] text-balance">
              {about.headline}
            </h2>
            <p className="mt-2 text-[length:var(--step-small)] text-[var(--ink-secondary)]">{about.subHeadline}</p>
            <div className="mt-5 space-y-4 text-[var(--ink)]">
              {paragraphs.map((text, index) => (
                <p key={index} className="text-[length:var(--step-body)] leading-relaxed text-pretty">
                  {text}
                </p>
              ))}
            </div>
            <a href={about.projectsLink.href} className="group mt-4 inline-flex min-h-11 items-center gap-2 text-[length:var(--step-small)] font-medium text-[var(--ink)] underline decoration-[var(--accent)] underline-offset-4 transition-colors hover:text-[var(--accent)]">
              {about.projectsLink.label}
              <ArrowUpRight aria-hidden="true" className="h-4 w-4 transition-transform motion-safe:group-hover:translate-x-0.5 motion-safe:group-hover:-translate-y-0.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
