import { useRef, useState, useEffect } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowDown, ArrowUpRight } from 'lucide-react'
import { profileData } from '../../data/profile'
import { Button } from '../ui/Button'
import { TrafficLightDots } from '../ui/TrafficLightDots'
import { HeroCard } from './HeroCard'
import { AboutTerminal } from './AboutTerminal'

interface HeroProps {
  onOpenCv?: () => void
}

interface CoordinateMetrics {
  containerW: number
  viewportH: number
  c1InitialX: number
  c1InitialY: number
  c2InitialX: number
  c2InitialY: number
  c3InitialX: number
  c3InitialY: number
  c4X: number
  c4Y: number
  terminalW: number
  terminalH: number
}

export function Hero({ onOpenCv }: HeroProps) {
  const [card1, card2, card3, card4] = profileData.heroCards
  const sectionRef = useRef<HTMLElement>(null)

  // Track prefers-reduced-motion & desktop media query
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

  // ─── Measure Coordinates for Screen-Centered Layout ───
  const [coords, setCoords] = useState<CoordinateMetrics>({
    containerW: 1440,
    viewportH: 900,
    c1InitialX: -517,
    c1InitialY: -264,
    c2InitialX: 517,
    c2InitialY: -264,
    c3InitialX: -517,
    c3InitialY: 312,
    c4X: 517,
    c4Y: 312,
    terminalW: 1152,
    terminalH: 620,
  })

  useEffect(() => {
    function calculate() {
      const vW = window.innerWidth
      const vH = window.innerHeight
      const cW = Math.min(1440, vW)

      const marginX = vW >= 1280 ? 48 : 24
      const marginYBottom = 48
      const marginYTop = 96
      const cardW = 310
      const cardH = 180

      const c4PosX = cW / 2 - marginX - cardW / 2
      const c4PosY = vH / 2 - marginYBottom - cardH / 2

      const c1PosX = -(cW / 2 - marginX - cardW / 2)
      const c1PosY = -(vH / 2 - marginYTop - cardH / 2)

      const c2PosX = cW / 2 - marginX - cardW / 2
      const c2PosY = -(vH / 2 - marginYTop - cardH / 2)

      const c3PosX = -(cW / 2 - marginX - cardW / 2)
      const c3PosY = vH / 2 - marginYBottom - cardH / 2

      const termW = Math.min(1152, vW - 48)
      const termH = Math.min(620, Math.max(540, vH - 120))

      setCoords({
        containerW: cW,
        viewportH: vH,
        c1InitialX: c1PosX,
        c1InitialY: c1PosY,
        c2InitialX: c2PosX,
        c2InitialY: c2PosY,
        c3InitialX: c3PosX,
        c3InitialY: c3PosY,
        c4X: c4PosX,
        c4Y: c4PosY,
        terminalW: termW,
        terminalH: termH,
      })
    }

    calculate()
    window.addEventListener('resize', calculate)
    return () => window.removeEventListener('resize', calculate)
  }, [])

  // ─── Scroll Progress Tracking Across Track ───
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  })

  // ─── Card 1 (Top Left: ~/project/2025-2026) ───
  const c1X = useTransform(scrollYProgress, [0.0, 0.32], [coords.c1InitialX, coords.c4X - 14])
  const c1Y = useTransform(scrollYProgress, [0.0, 0.32], [coords.c1InitialY, coords.c4Y - 18])
  const c1Scale = useTransform(scrollYProgress, [0.0, 0.32], [1, 0.94])
  const c1Rotate = useTransform(scrollYProgress, [0.0, 0.32], [card1.rotation, -3])
  const c1Opacity = useTransform(scrollYProgress, [0.3, 0.38], [1, 0])

  // ─── Card 2 (Top Right: ~/badges/alfiz) ───
  const c2X = useTransform(scrollYProgress, [0.0, 0.32], [coords.c2InitialX, coords.c4X + 10])
  const c2Y = useTransform(scrollYProgress, [0.0, 0.32], [coords.c2InitialY, coords.c4Y - 12])
  const c2Scale = useTransform(scrollYProgress, [0.0, 0.32], [1, 0.96])
  const c2Rotate = useTransform(scrollYProgress, [0.0, 0.32], [card2.rotation, 2])
  const c2Opacity = useTransform(scrollYProgress, [0.3, 0.38], [1, 0])

  // ─── Card 3 (Bottom Left: ~/experience/2024-2026) ───
  const c3X = useTransform(scrollYProgress, [0.0, 0.32], [coords.c3InitialX, coords.c4X - 6])
  const c3Y = useTransform(scrollYProgress, [0.0, 0.32], [coords.c3InitialY, coords.c4Y - 6])
  const c3Scale = useTransform(scrollYProgress, [0.0, 0.32], [1, 0.98])
  const c3Rotate = useTransform(scrollYProgress, [0.0, 0.32], [card3.rotation, -1])
  const c3Opacity = useTransform(scrollYProgress, [0.3, 0.38], [1, 0])

  // ─── Hero Center Dominant Text ───
  const heroOpacity = useTransform(scrollYProgress, [0.04, 0.3], [1, 0])
  const heroY = useTransform(scrollYProgress, [0.04, 0.3], [0, -28])

  // ─── Card 4 / Terminal Morph (Bottom Right -> Center Full Terminal) ───
  // Step A: Stays in place while 1-3 stack (0.0 -> 0.38)
  // Step B: Morphs & travels to center (0.38 -> 0.78)
  // Step C: Settles at center full size (0.78 -> 1.0)
  const c4X = useTransform(scrollYProgress, [0.0, 0.38, 0.78, 1.0], [coords.c4X, coords.c4X, 0, 0])
  const c4Y = useTransform(scrollYProgress, [0.0, 0.38, 0.78, 1.0], [coords.c4Y, coords.c4Y, 0, 0])
  const c4Width = useTransform(
    scrollYProgress,
    [0.0, 0.38, 0.78, 1.0],
    [310, 310, coords.terminalW, coords.terminalW]
  )
  const c4Height = useTransform(
    scrollYProgress,
    [0.0, 0.38, 0.78, 1.0],
    [180, 180, coords.terminalH, coords.terminalH]
  )
  const c4Rotate = useTransform(scrollYProgress, [0.0, 0.38], [card4.rotation, 0])

  // Crossfade between compact card and full terminal
  const compactContentOpacity = useTransform(scrollYProgress, [0.36, 0.48], [1, 0])
  const expandedTerminalOpacity = useTransform(scrollYProgress, [0.46, 0.76], [0, 1])

  // Shadow evolution: from resting card shadow to floating terminal elevation
  const c4Shadow = useTransform(
    scrollYProgress,
    [0.0, 0.38, 0.78],
    [
      '0 2px 4px rgba(0, 0, 0, 0.04)',
      '0 20px 25px -5px rgba(15, 23, 42, 0.16)',
      '0 25px 50px -12px rgba(15, 23, 42, 0.18)',
    ]
  )

  // Determine interactivity: terminal is interactive once expanded
  const [isFullyExpanded, setIsFullyExpanded] = useState(false)
  useEffect(() => {
    return scrollYProgress.on('change', (latest) => {
      setIsFullyExpanded(latest >= 0.75)
    })
  }, [scrollYProgress])

  return (
    <section
      ref={sectionRef}
      className={`relative w-full ${reducedMotion ? 'min-h-screen' : 'lg:h-[220vh]'}`}
    >
      {/* Anchor for Navbar link '#overview' */}
      <div id="overview" className="absolute top-0 left-0 w-full h-px pointer-events-none" />

      {/* Anchor for Navbar link '#about' on desktop */}
      {isDesktop && (
        <div id="about" className="absolute top-[75%] left-0 w-full h-px pointer-events-none" />
      )}

      {/* ======================================================== */}
      {/* DESKTOP VIEWPORT: STICKY SCROLLYTELLING TRACK            */}
      {/* ======================================================== */}
      <div className="hidden lg:flex sticky top-0 h-screen w-full flex-col justify-center items-center overflow-hidden">
        {/* Background max-width bounding box */}
        <div className="relative w-full max-w-[1440px] h-full flex items-center justify-center">
          {/* ─── Hero Center Dominant Text (Fades out on scroll) ─── */}
          <motion.div
            style={{ opacity: heroOpacity, y: heroY }}
            className="relative z-10 max-w-2xl sm:max-w-3xl mx-auto text-center flex flex-col items-center pointer-events-auto"
          >
            {/* Status Pill */}
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[var(--surface)] border border-slate-200/80 shadow-2xs mb-6 sm:mb-8 select-none">
              <span className="relative flex h-2 w-2" aria-hidden="true">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent)] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--accent)]" />
              </span>
              <span className="text-xs font-medium text-[var(--ink)] tracking-tight">
                {profileData.statusText}
              </span>
            </div>

            {/* Display Typography */}
            <div className="mb-6 sm:mb-8">
              <h1 className="text-5xl sm:text-7xl lg:text-[5.5rem] font-bold tracking-tight text-[var(--ink)] leading-[0.95] select-none">
                {profileData.firstName}
                <br />
                <span className="text-slate-800">{profileData.lastName}</span>
              </h1>
            </div>

            {/* Lead Subtitle */}
            <p className="text-sm sm:text-base md:text-lg text-[var(--ink-secondary)] max-w-xl mx-auto leading-relaxed mb-8 sm:mb-10 font-normal">
              {profileData.subtitle}
            </p>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 sm:gap-4">
              <Button
                variant="primary"
                size="lg"
                href="#projects"
                iconRight={<ArrowDown className="w-4 h-4" />}
              >
                See What I've Built
              </Button>

              <Button
                variant="secondary"
                size="lg"
                onClick={onOpenCv}
                href={onOpenCv ? undefined : profileData.resumeUrl}
                target={onOpenCv ? undefined : '_blank'}
                iconRight={<ArrowUpRight className="w-4 h-4" />}
              >
                View CV
              </Button>
            </div>
          </motion.div>

          {/* ─── Stacked Cards 1, 2, 3 (Converge & Fade) ─── */}
          {/* Card 1: Top Left */}
          <motion.div
            style={{
              x: c1X,
              y: c1Y,
              scale: c1Scale,
              rotate: c1Rotate,
              opacity: c1Opacity,
            }}
            className="absolute z-20 pointer-events-auto"
          >
            <HeroCard card={card1} variant="desktop" />
          </motion.div>

          {/* Card 2: Top Right */}
          <motion.div
            style={{
              x: c2X,
              y: c2Y,
              scale: c2Scale,
              rotate: c2Rotate,
              opacity: c2Opacity,
            }}
            className="absolute z-20 pointer-events-auto"
          >
            <HeroCard card={card2} variant="desktop" />
          </motion.div>

          {/* Card 3: Bottom Left */}
          <motion.div
            style={{
              x: c3X,
              y: c3Y,
              scale: c3Scale,
              rotate: c3Rotate,
              opacity: c3Opacity,
            }}
            className="absolute z-30 pointer-events-auto"
          >
            <HeroCard card={card3} variant="desktop" />
          </motion.div>

          {/* ─── Card 4: The Morphing Terminal (z-40: On Top) ─── */}
          <motion.div
            style={{
              x: c4X,
              y: c4Y,
              width: c4Width,
              height: c4Height,
              rotate: c4Rotate,
              boxShadow: c4Shadow,
            }}
            className="absolute z-40 rounded-2xl bg-[var(--surface)] border border-slate-200/90 overflow-hidden flex flex-col will-change-transform"
          >
            {/* View A: Compact Hero Card Content (Fades out on morph) */}
            <motion.div
              style={{ opacity: compactContentOpacity }}
              className="absolute inset-0 p-4 flex flex-col justify-between pointer-events-auto bg-[var(--surface)] z-10"
            >
              <a href="#about" className="flex flex-col justify-between h-full select-none">
                <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <TrafficLightDots size="sm" />
                    <span className="text-[11px] font-mono text-[var(--ink-secondary)] tracking-tight">
                      {card4.path}
                    </span>
                  </div>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 hover:text-[var(--accent)] transition-colors" />
                </div>

                <div className="mb-2">
                  <h3 className="text-xl font-bold tracking-tight text-[var(--ink)]">
                    {card4.metric}
                  </h3>
                  <p className="text-xs text-[var(--ink-secondary)] leading-relaxed">
                    {card4.desc}
                  </p>
                </div>

                <div className="p-2 rounded-lg bg-[var(--bg-subtle)] border border-slate-200/60">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {card4.stack.map((item, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] font-mono text-[var(--accent)] font-medium"
                      >
                        {item}
                        {idx < card4.stack.length - 1 && (
                          <span className="text-slate-300 ml-1.5">·</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              </a>
            </motion.div>

            {/* View B: Full macOS About Terminal (Fades in on morph) */}
            <motion.div
              style={{
                opacity: expandedTerminalOpacity,
                pointerEvents: isFullyExpanded ? 'auto' : 'none',
              }}
              className="relative w-full h-full flex flex-col bg-[var(--surface)] z-20 overflow-y-auto"
            >
              <AboutTerminal isEmbedded className="w-full h-full" />
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MOBILE / TABLET VIEWPORT (< 1024px)                      */}
      {/* Standard touch-friendly non-pinned document flow         */}
      {/* ======================================================== */}
      <div className="lg:hidden flex flex-col items-center px-4 pt-24 pb-12 w-full max-w-xl mx-auto text-center">
        {/* Status Pill */}
        <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[var(--surface)] border border-slate-200/80 shadow-2xs mb-6 select-none">
          <span className="relative flex h-2 w-2" aria-hidden="true">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent)] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--accent)]" />
          </span>
          <span className="text-xs font-medium text-[var(--ink)] tracking-tight">
            {profileData.statusText}
          </span>
        </div>

        {/* Display Typography */}
        <div className="mb-6">
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-[var(--ink)] leading-[0.98] select-none">
            {profileData.firstName}
            <br />
            <span className="text-slate-800">{profileData.lastName}</span>
          </h1>
        </div>

        {/* Lead Subtitle */}
        <p className="text-sm sm:text-base text-[var(--ink-secondary)] leading-relaxed mb-8">
          {profileData.subtitle}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <Button
            variant="primary"
            size="lg"
            href="#projects"
            iconRight={<ArrowDown className="w-4 h-4" />}
            className="w-full sm:w-auto"
          >
            See What I've Built
          </Button>

          <Button
            variant="secondary"
            size="lg"
            onClick={onOpenCv}
            href={onOpenCv ? undefined : profileData.resumeUrl}
            target={onOpenCv ? undefined : '_blank'}
            iconRight={<ArrowUpRight className="w-4 h-4" />}
            className="w-full sm:w-auto"
          >
            View CV
          </Button>
        </div>

        {/* Mobile 2x2 Bento Cards */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5 w-full mt-10">
          {profileData.heroCards.map((card) => (
            <HeroCard key={card.id} card={card} variant="mobile" />
          ))}
        </div>
      </div>
    </section>
  )
}
