import { lazy, Suspense, useEffect, useState } from 'react'
import { useLenis } from './hooks/useLenis'
import { useMediaQuery } from './hooks/useMediaQuery'
import { on } from './lib/events'
import { track } from './lib/analytics'
import { Navbar } from './components/sections/Navbar'
import { Hero } from './components/sections/Hero'
import { About } from './components/sections/About'
import { Shell } from './components/sections/Shell'
import { Projects } from './components/sections/Projects'
import { Experience } from './components/sections/Experience'
import { Badges } from './components/sections/Badges'
import { Contact } from './components/sections/Contact'
import { Footer } from './components/sections/Footer'
import { BootScreen } from './components/sections/BootScreen'
import { NotFound } from './components/sections/NotFound'
import { GithubGridBackground } from './components/ui/GithubGridBackground'

const CvModal = lazy(() => import('./components/ui/CvModal'))

const isKnownRoute = (path: string) => path === '/' || path === '/index.html'

export default function App() {
  const [isCvOpen, setIsCvOpen] = useState(false)
  // The cursor-follow grid only makes sense with a precise pointer (no touch devices).
  const hasFinePointer = useMediaQuery('(pointer: fine)')
  useLenis()

  useEffect(() => on('open-cv', () => setIsCvOpen(true)), [])
  useEffect(() => track('page_view'), [])
  useEffect(() => {
    const hot = import.meta.hot
    if (!hot) return
    const reloadContent = () => window.location.reload()
    hot.on('portfolio:content-updated', reloadContent)
    return () => hot.off('portfolio:content-updated', reloadContent)
  }, [])

  if (!isKnownRoute(window.location.pathname)) return <NotFound />

  const openCv = () => setIsCvOpen(true)

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] flex flex-col font-sans selection:bg-[var(--accent)] selection:text-white relative">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[300] focus:rounded-full focus:bg-[var(--surface-terminal)] focus:px-4 focus:py-2 focus:text-white">
        Skip to content
      </a>
      <BootScreen />
      {hasFinePointer && <GithubGridBackground />}

      <Suspense fallback={null}>{isCvOpen && <CvModal isOpen={isCvOpen} onClose={() => setIsCvOpen(false)} />}</Suspense>

      <Navbar onOpenCv={openCv} />

      <main id="main" className="relative flex-1 flex flex-col">
        <Hero onOpenCv={openCv} />
        <About />
        <Shell />
        <Projects />
        <Experience />
        <Badges />
        <Contact />
      </main>

      <Footer />
    </div>
  )
}
