import { useRef, useState, useEffect } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { AboutTerminal } from './AboutTerminal'

export function About() {
  const sectionRef = useRef<HTMLElement>(null)

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

  // ─── Scroll-linked Expansion: Starts at Card 4 position and blooms into full Terminal ───
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'center center'],
  })

  // Desktop scrolly morph: scales up from compact card (0.5) to full terminal (1.0)
  // and translates from bottom-right towards center (x: 220 -> 0, y: 70 -> 0)
  const terminalScale = useTransform(scrollYProgress, [0.0, 1.0], [0.5, 1.0])
  const terminalX = useTransform(scrollYProgress, [0.0, 1.0], [220, 0])
  const terminalY = useTransform(scrollYProgress, [0.0, 1.0], [70, 0])
  const terminalOpacity = useTransform(scrollYProgress, [0.0, 0.4, 1.0], [0.5, 0.85, 1.0])

  return (
    <section
      ref={sectionRef}
      id="about"
      className="relative py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full min-h-[70vh] flex flex-col justify-center items-center overflow-visible"
    >
      {/* ─── Morphing Container ─── */}
      {isDesktop && !reducedMotion ? (
        <motion.div
          style={{
            scale: terminalScale,
            x: terminalX,
            y: terminalY,
            opacity: terminalOpacity,
            transformOrigin: 'bottom right',
          }}
          className="w-full flex justify-center will-change-transform"
        >
          <AboutTerminal />
        </motion.div>
      ) : (
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
