import { useState, useEffect } from 'react'
import { AboutTerminal } from './AboutTerminal'

export function About() {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 1024px)').matches : false
  )

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // On desktop, About is presented via the Hero scrollytelling morph
  if (isDesktop) return null

  return (
    <section id="about" className="py-16 sm:py-24 px-4 sm:px-6 max-w-6xl mx-auto w-full">
      <AboutTerminal />
    </section>
  )
}
