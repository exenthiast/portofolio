import { useRef, useState, useEffect } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import { profileData } from '../../data/profile'
import { TrafficLightDots } from '../ui/TrafficLightDots'
import { AboutTerminal } from './AboutTerminal'

export function About() {
  const sectionRef = useRef<HTMLElement>(null)
  const card4 = profileData.heroCards[3] // ~/alfiz/portfolio (top card of the stack)

  // Track prefers-reduced-motion & desktop viewport
  const [reducedMotion, setReducedMotion] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  )
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(min-width: 1024px)').matches
      : false
  )

  useEffect(() => {
    const mqMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handleMotion = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mqMotion.addEventListener('change', handleMotion)

    const mqDesktop = window.matchMedia('(min-width: 1024px)')
    const handleDesktop = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    mqDesktop.addEventListener('change', handleDesktop)

    return () => {
      mqMotion.removeEventListener('change', handleMotion)
      mqDesktop.removeEventListener('change', handleDesktop)
    }
  }, [])

  // ─── Scroll-linked Expansion: Card 4 lifts off the stack and expands into the About Terminal ───
  // 'start end': top of About section hits bottom of viewport
  // 'center center': center of About section aligns with center of viewport
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'center center'],
  })

  // Desktop morph: starts at top-right (offset to Card 4 stack position: x: 320, y: -240, scale: 0.38)
  // and glides down to center (x: 0, y: 0, scale: 1.0)
  const terminalScale = useTransform(scrollYProgress, [0.0, 1.0], [0.38, 1.0])
  const terminalX = useTransform(scrollYProgress, [0.0, 1.0], [320, 0])
  const terminalY = useTransform(scrollYProgress, [0.0, 1.0], [-240, 0])
  const terminalOpacity = useTransform(scrollYProgress, [0.0, 0.25, 1.0], [0.8, 0.95, 1.0])

  // Crossfade between the compact Card 4 view and full macOS Terminal Window
  const compactCardOpacity = useTransform(scrollYProgress, [0.1, 0.42], [1, 0])
  const fullTerminalOpacity = useTransform(scrollYProgress, [0.32, 0.7], [0, 1])

  return (
    <section
      ref={sectionRef}
      id="about"
      className="relative py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full min-h-[75vh] flex flex-col justify-center items-center overflow-visible"
    >
      {/* ─── DESKTOP SCROLL-LINKED CARD MORPH (Card 4 peels off stack -> big Terminal) ─── */}
      {isDesktop && !reducedMotion ? (
        <motion.div
          style={{
            scale: terminalScale,
            x: terminalX,
            y: terminalY,
            opacity: terminalOpacity,
            transformOrigin: 'top right',
          }}
          className="w-full flex justify-center will-change-transform relative"
        >
          <div className="w-full max-w-6xl relative rounded-2xl">
            {/* View A: Compact Card 4 (Visible during takeoff from the stack) */}
            <motion.div
              style={{ opacity: compactCardOpacity }}
              className="absolute inset-0 z-30 p-5 rounded-2xl bg-[var(--surface)] border border-slate-200/90 shadow-md flex flex-col justify-between pointer-events-none select-none"
            >
              <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <TrafficLightDots size="sm" />
                  <span className="text-[11px] font-mono text-[var(--ink-secondary)] tracking-tight">
                    {card4.path}
                  </span>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-300" />
              </div>

              <div className="my-auto py-2">
                <h3 className="text-xl font-bold tracking-tight text-[var(--ink)]">
                  {card4.metric}
                </h3>
                <p className="text-xs text-[var(--ink-secondary)] mt-0.5 leading-relaxed">
                  {card4.desc}
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-[var(--bg-subtle)] border border-slate-200/60 flex items-center gap-2">
                {card4.stack.map((item, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] font-mono text-[var(--accent)] font-medium inline-flex items-center gap-1.5"
                  >
                    {item}
                    {idx < card4.stack.length - 1 && <span className="text-slate-300 font-normal">·</span>}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* View B: Full macOS Terminal Window (Expands as it slides down into center) */}
            <motion.div style={{ opacity: fullTerminalOpacity }} className="w-full">
              <AboutTerminal />
            </motion.div>
          </div>
        </motion.div>
      ) : (
        /* ─── MOBILE / REDUCED-MOTION: CLEAN RESPONSIVE FADE-IN ─── */
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full flex justify-center"
        >
          <AboutTerminal />
        </motion.div>
      )}
    </section>
  )
}
