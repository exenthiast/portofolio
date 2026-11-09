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

/** Position delta between elements measured via static layout offset */
interface PositionDelta {
  x: number
  y: number
}

// ─── Scrollytelling Track Progress Timeline (0.0 -> 1.0 across 300vh) ───
// 0.00 -> 0.25 : Cards 1, 2, 3 converge to Card 4 on bottom-right (slow, deliberate stacking)
// 0.25 -> 0.55 : Card 4 peels off stack and smoothly glides to center, expanding into macOS Terminal
// 0.55 -> 0.88 : STICKY SCROLL HOLD — Terminal stays locked in the center for deliberate reading & weight
// 0.88 -> 1.00 : Track completes, container unpins and scrolls naturally up into Section Projects
const STACK_START = 0.0
const STACK_END = 0.25
const MORPH_START = 0.25
const MORPH_END = 0.55
const HOLD_END = 0.88

export function Hero({ onOpenCv }: HeroProps) {
  const [card1, card2, card3, card4] = profileData.heroCards

  const sectionRef = useRef<HTMLElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const card1Ref = useRef<HTMLDivElement>(null)
  const card2Ref = useRef<HTMLDivElement>(null)
  const card3Ref = useRef<HTMLDivElement>(null)
  const card4Ref = useRef<HTMLDivElement>(null)

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

  // ─── Precise Centering Translation Metrics ───
  // Computes the exact (targetX, targetY, targetWidth, targetHeight) so that Card 4
  // expanding from 'bottom-12 right-6 xl:right-12' lands exactly in the viewport center.
  const [targetMetrics, setTargetMetrics] = useState({
    targetX: -96,
    targetY: -92,
    targetWidth: 1152,
    targetHeight: 620,
  })

  // Measure static layout position deltas from each card to card4
  const [deltas, setDeltas] = useState<{
    card1: PositionDelta
    card2: PositionDelta
    card3: PositionDelta
  }>({
    card1: { x: 0, y: 0 },
    card2: { x: 0, y: 0 },
    card3: { x: 0, y: 0 },
  })

  useEffect(() => {
    function measureAll() {
      const container = containerRef.current
      const cW = container ? container.clientWidth : Math.min(1440, window.innerWidth)
      const cH = container ? container.clientHeight : window.innerHeight

      const rightMargin = cW >= 1280 ? 48 : 24
      const bottomMargin = 48
      const tW = Math.min(1152, cW - 64)
      const tH = Math.min(620, Math.max(540, cH - 120))

      // Exact centering math derived from right & bottom pinned coordinates
      const tX = rightMargin + tW / 2 - cW / 2
      const tY = bottomMargin + tH / 2 - cH / 2

      setTargetMetrics({
        targetX: tX,
        targetY: tY,
        targetWidth: tW,
        targetHeight: tH,
      })

      // Stacking deltas for cards 1, 2, 3
      const c1 = card1Ref.current
      const c2 = card2Ref.current
      const c3 = card3Ref.current
      const c4 = card4Ref.current
      if (!c1 || !c2 || !c3 || !c4) return

      const dx1 = c4.offsetLeft - c1.offsetLeft
      const dy1 = c4.offsetTop - c1.offsetTop

      const dx2 = c4.offsetLeft - c2.offsetLeft
      const dy2 = c4.offsetTop - c2.offsetTop

      const dx3 = c4.offsetLeft - c3.offsetLeft
      const dy3 = c4.offsetTop - c3.offsetTop

      if (dx1 !== 0 || dy1 !== 0) {
        setDeltas({
          card1: { x: dx1, y: dy1 },
          card2: { x: dx2, y: dy2 },
          card3: { x: dx3, y: dy3 },
        })
      }
    }

    measureAll()
    const raf = requestAnimationFrame(measureAll)
    const t1 = setTimeout(measureAll, 150)
    const t2 = setTimeout(measureAll, 500)

    window.addEventListener('resize', measureAll)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(t1)
      clearTimeout(t2)
      window.removeEventListener('resize', measureAll)
    }
  }, [])

  // ─── Scroll Progress across the 300vh Track ───
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  })

  // ─── Stacking Phase (0.0 -> 0.25): Cards 1, 2, 3 converge to Card 4 at bottom-right ───
  const c1X = useTransform(scrollYProgress, [STACK_START, STACK_END], [0, deltas.card1.x - 14])
  const c1Y = useTransform(scrollYProgress, [STACK_START, STACK_END], [0, deltas.card1.y - 18])
  const c1Scale = useTransform(scrollYProgress, [STACK_START, STACK_END], [1, 0.94])
  const c1Rotate = useTransform(scrollYProgress, [STACK_START, STACK_END], [card1.rotation, -3])
  const c1Opacity = useTransform(scrollYProgress, [MORPH_START, 0.40], [1, 0])

  const c2X = useTransform(scrollYProgress, [STACK_START, STACK_END], [0, deltas.card2.x + 10])
  const c2Y = useTransform(scrollYProgress, [STACK_START, STACK_END], [0, deltas.card2.y - 12])
  const c2Scale = useTransform(scrollYProgress, [STACK_START, STACK_END], [1, 0.96])
  const c2Rotate = useTransform(scrollYProgress, [STACK_START, STACK_END], [card2.rotation, 2])
  const c2Opacity = useTransform(scrollYProgress, [MORPH_START, 0.40], [1, 0])

  const c3X = useTransform(scrollYProgress, [STACK_START, STACK_END], [0, deltas.card3.x - 6])
  const c3Y = useTransform(scrollYProgress, [STACK_START, STACK_END], [0, deltas.card3.y - 6])
  const c3Scale = useTransform(scrollYProgress, [STACK_START, STACK_END], [1, 0.98])
  const c3Rotate = useTransform(scrollYProgress, [STACK_START, STACK_END], [card3.rotation, -1])
  const c3Opacity = useTransform(scrollYProgress, [MORPH_START, 0.40], [1, 0])

  // Center text fades out gently as user begins scrolling down
  const heroTextOpacity = useTransform(scrollYProgress, [0.10, 0.25], [1, 0])
  const heroTextY = useTransform(scrollYProgress, [0.10, 0.25], [0, -32])

  // ─── Morph & Sticky Hold Phase: Card 4 expands into centered macOS Terminal Window ───
  // Card 4 translation from bottom-right towards center
  const c4TranslateX = useTransform(
    scrollYProgress,
    [0.0, MORPH_START, MORPH_END, HOLD_END, 1.0],
    [0, 0, targetMetrics.targetX, targetMetrics.targetX, targetMetrics.targetX]
  )
  const c4TranslateY = useTransform(
    scrollYProgress,
    [0.0, MORPH_START, MORPH_END, HOLD_END, 1.0],
    [0, 0, targetMetrics.targetY, targetMetrics.targetY, targetMetrics.targetY]
  )
  // Card 4 dimensions expanding from 310x180 to full terminal window
  const c4Width = useTransform(
    scrollYProgress,
    [0.0, MORPH_START, MORPH_END, HOLD_END, 1.0],
    [310, 310, targetMetrics.targetWidth, targetMetrics.targetWidth, targetMetrics.targetWidth]
  )
  const c4Height = useTransform(
    scrollYProgress,
    [0.0, MORPH_START, MORPH_END, HOLD_END, 1.0],
    [180, 180, targetMetrics.targetHeight, targetMetrics.targetHeight, targetMetrics.targetHeight]
  )
  const c4Rotate = useTransform(scrollYProgress, [0.0, STACK_END], [card4.rotation, 0])

  // Content crossfade: compact card preview -> full macOS Terminal Window
  const compactContentOpacity = useTransform(scrollYProgress, [MORPH_START, 0.38], [1, 0])
  const terminalContentOpacity = useTransform(scrollYProgress, [0.36, MORPH_END], [0, 1])

  // Interactive state: terminal is interactive once expanded and holding
  const [isHolding, setIsHolding] = useState(false)
  useEffect(() => {
    return scrollYProgress.on('change', (latest) => {
      setIsHolding(latest >= 0.52 && latest <= 0.89)
    })
  }, [scrollYProgress])

  return (
    <section
      ref={sectionRef}
      className={`relative w-full ${reducedMotion ? 'min-h-screen' : 'lg:h-[300vh]'}`}
    >
      {/* Anchor for Navbar link '#overview' */}
      <div id="overview" className="absolute top-0 left-0 w-full h-px pointer-events-none" />

      {/* Anchor for Navbar link '#about' on desktop (lands directly on the held terminal) */}
      {isDesktop && (
        <div id="about" className="absolute top-[62%] left-0 w-full h-px pointer-events-none" />
      )}

      {/* ======================================================== */}
      {/* DESKTOP VIEWPORT: STICKY SCROLLYTELLING HOLD TRACK       */}
      {/* ======================================================== */}
      <div className="hidden lg:flex sticky top-0 h-screen w-full flex-col justify-center items-center overflow-hidden">
        <div
          ref={containerRef}
          className="relative w-full max-w-[1440px] h-full flex items-center justify-center"
        >
          {/* ─── Hero Center Dominant Text (Fades out gently on scroll) ─── */}
          <motion.div
            style={{ opacity: heroTextOpacity, y: heroTextY }}
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

          {/* ─── Cards 1, 2, 3 (Stack at bottom-right, then fade out cleanly) ─── */}
          {/* Top Left Card - Projects (z-10) */}
          <motion.div
            ref={card1Ref}
            style={{ x: c1X, y: c1Y, scale: c1Scale, rotate: c1Rotate, opacity: c1Opacity }}
            className="absolute top-24 left-6 xl:left-12 pointer-events-auto z-10"
          >
            <HeroCard card={card1} variant="desktop" />
          </motion.div>

          {/* Top Right Card - Badges (z-20) */}
          <motion.div
            ref={card2Ref}
            style={{ x: c2X, y: c2Y, scale: c2Scale, rotate: c2Rotate, opacity: c2Opacity }}
            className="absolute top-24 right-6 xl:right-12 pointer-events-auto z-20"
          >
            <HeroCard card={card2} variant="desktop" />
          </motion.div>

          {/* Bottom Left Card - Experience (z-30) */}
          <motion.div
            ref={card3Ref}
            style={{ x: c3X, y: c3Y, scale: c3Scale, rotate: c3Rotate, opacity: c3Opacity }}
            className="absolute bottom-12 left-6 xl:left-12 pointer-events-auto z-30"
          >
            <HeroCard card={card3} variant="desktop" />
          </motion.div>

          {/* ─── Card 4 (Top of Stack) -> Morphs into Centered macOS Terminal Window (z-40) ─── */}
          <motion.div
            ref={card4Ref}
            style={{
              x: c4TranslateX,
              y: c4TranslateY,
              width: c4Width,
              height: c4Height,
              rotate: c4Rotate,
            }}
            className="absolute bottom-12 right-6 xl:right-12 rounded-2xl bg-[var(--surface)] border border-slate-200/90 shadow-2xl overflow-hidden flex flex-col z-40 will-change-transform pointer-events-auto"
          >
            {/* View A: Compact Card 4 Preview (Fades out as card expands) */}
            <motion.div
              style={{
                opacity: compactContentOpacity,
                pointerEvents: isHolding ? 'none' : 'auto',
              }}
              className="absolute inset-0 p-4 flex flex-col justify-between bg-[var(--surface)] z-10 select-none"
            >
              <a href="#about" className="flex flex-col justify-between h-full">
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

            {/* View B: Full macOS About Terminal (Fades in, centers, and holds in place) */}
            <motion.div
              style={{
                opacity: terminalContentOpacity,
                pointerEvents: isHolding ? 'auto' : 'none',
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
