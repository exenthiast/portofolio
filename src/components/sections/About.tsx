import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { AboutTerminal } from './AboutTerminal'

interface AboutProps {
  isExpanded?: boolean
}

// Spring physics: deliberate, slow, weighted inertia matching Hero's morph spring
const MORPH_SPRING = {
  type: 'spring' as const,
  stiffness: 45,
  damping: 20,
  mass: 2.2,
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
      className="relative w-full lg:h-[185vh] flex flex-col items-center"
    >
      {/* ─── DESKTOP STICKY SCROLL HOLD TRACK (Holds terminal centered while user scrolls) ─── */}
      {isDesktop && !reducedMotion ? (
        <div className="sticky top-0 h-screen w-full flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden">
          <div className="w-full max-w-6xl min-h-[580px] flex items-center justify-center">
            {/* Animates directly from Card 4 in Hero with heavy, slow inertia */}
            {isExpanded && (
              <motion.div
                layoutId="about-terminal-window"
                transition={MORPH_SPRING}
                className="w-full flex justify-center"
              >
                <AboutTerminal />
              </motion.div>
            )}
          </div>
        </div>
      ) : (
        /* ─── MOBILE / REDUCED-MOTION: CLEAN RESPONSIVE FADE-IN ─── */
        <div className="py-20 sm:py-28 px-4 sm:px-6 w-full max-w-7xl mx-auto flex justify-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="w-full flex justify-center"
          >
            <AboutTerminal />
          </motion.div>
        </div>
      )}
    </section>
  )
}
