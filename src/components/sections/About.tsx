import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { AboutTerminal } from './AboutTerminal'

interface AboutProps {
  isExpanded?: boolean
}

export function About({ isExpanded = false }: AboutProps) {
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

  return (
    <section
      id="about"
      className="relative py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full min-h-[700px] flex flex-col justify-center items-center"
    >
      {/* ─── DESKTOP SCROLL-LINKED CARD MORPH VIA LAYOUT-ID ─── */}
      {isDesktop && !reducedMotion ? (
        <div className="w-full max-w-6xl min-h-[580px] flex items-center justify-center">
          {/* Only mounted when user scrolls to About; animates directly from Card 4 in Hero */}
          {isExpanded && (
            <motion.div
              layoutId="about-terminal-window"
              transition={{ type: 'spring', stiffness: 70, damping: 24, mass: 2.0 }}
              className="w-full flex justify-center"
            >
              <AboutTerminal />
            </motion.div>
          )}
        </div>
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
