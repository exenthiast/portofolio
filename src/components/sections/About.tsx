import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { AboutTerminal } from './AboutTerminal'

export function About() {
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

  // On desktop with animations enabled, About terminal is hosted directly in the unified scrollytelling track
  if (isDesktop && !reducedMotion) {
    return null
  }

  return (
    <section
      id="about"
      className="py-16 sm:py-24 px-4 sm:px-6 w-full max-w-7xl mx-auto flex justify-center"
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full flex justify-center"
      >
        <AboutTerminal />
      </motion.div>
    </section>
  )
}
