import { useRef, useState, useEffect } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowDown, ArrowUpRight } from 'lucide-react'
import { profileData } from '../../data/profile'
import { Button } from '../ui/Button'
import { HeroCard } from './HeroCard'

interface HeroProps {
  onOpenCv?: () => void
}

/** Position delta between elements measured via static layout offset */
interface PositionDelta {
  x: number
  y: number
}

// Stacking starts right as user scrolls down and completes by 35% of Hero section scroll
const STACK_START = 0.0
const STACK_END = 0.35

export function Hero({ onOpenCv }: HeroProps) {
  const [card1, card2, card3, card4] = profileData.heroCards

  // ─── Refs for scroll-linked card stacking (desktop only) ───
  const sectionRef = useRef<HTMLElement>(null)
  const card1Ref = useRef<HTMLDivElement>(null)
  const card2Ref = useRef<HTMLDivElement>(null)
  const card3Ref = useRef<HTMLDivElement>(null)
  const card4Ref = useRef<HTMLDivElement>(null)

  // Track section scroll progress: 0 = top of section at viewport top, 1 = bottom of section at viewport top
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  })

  // ─── Measure static layout position deltas from each card to card4 (target) ───
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
    function measure() {
      const c1 = card1Ref.current
      const c2 = card2Ref.current
      const c3 = card3Ref.current
      const c4 = card4Ref.current
      if (!c1 || !c2 || !c3 || !c4) return

      // offsetLeft / offsetTop are static CSSOM metrics independent of CSS transforms or scroll
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

    measure()
    const raf = requestAnimationFrame(measure)
    const timer1 = setTimeout(measure, 150)
    const timer2 = setTimeout(measure, 500)

    window.addEventListener('resize', measure)
    window.addEventListener('load', measure)

    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(timer1)
      clearTimeout(timer2)
      window.removeEventListener('resize', measure)
      window.removeEventListener('load', measure)
    }
  }, [])

  // ─── Scroll-linked card deck stacking transforms ───
  // Card 1 (top-left: ~/project/2025-2026) -> stacks at bottom of deck, peeking top-left
  const c1X = useTransform(scrollYProgress, [STACK_START, STACK_END], [0, deltas.card1.x - 14])
  const c1Y = useTransform(scrollYProgress, [STACK_START, STACK_END], [0, deltas.card1.y - 18])
  const c1Scale = useTransform(scrollYProgress, [STACK_START, STACK_END], [1, 0.94])
  const c1Rotate = useTransform(scrollYProgress, [STACK_START, STACK_END], [0, -3])

  // Card 2 (top-right: ~/badges/alfiz) -> stacks middle-layer, peeking top-right
  const c2X = useTransform(scrollYProgress, [STACK_START, STACK_END], [0, deltas.card2.x + 10])
  const c2Y = useTransform(scrollYProgress, [STACK_START, STACK_END], [0, deltas.card2.y - 12])
  const c2Scale = useTransform(scrollYProgress, [STACK_START, STACK_END], [1, 0.96])
  const c2Rotate = useTransform(scrollYProgress, [STACK_START, STACK_END], [0, 2])

  // Card 3 (bottom-left: ~/experience/2024-2026) -> stacks just under Card 4, peeking slightly left
  const c3X = useTransform(scrollYProgress, [STACK_START, STACK_END], [0, deltas.card3.x - 6])
  const c3Y = useTransform(scrollYProgress, [STACK_START, STACK_END], [0, deltas.card3.y - 6])
  const c3Scale = useTransform(scrollYProgress, [STACK_START, STACK_END], [1, 0.98])
  const c3Rotate = useTransform(scrollYProgress, [STACK_START, STACK_END], [0, -1])

  // Card 4 (bottom-right: ~/alfiz/portfolio) -> target, on top of deck (z-40) with enhanced shadow
  const c4Scale = useTransform(scrollYProgress, [STACK_START, STACK_END], [1, 1.02])
  const c4Filter = useTransform(
    scrollYProgress,
    [STACK_START, STACK_END],
    [
      'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.03))',
      'drop-shadow(0 20px 25px rgba(15, 23, 42, 0.16))',
    ]
  )

  return (
    <section
      ref={sectionRef}
      id="overview"
      className="relative min-h-[calc(100vh-5rem)] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-16 lg:pb-20 overflow-hidden bg-transparent"
    >
      {/* ======================================================== */}
      {/* DESKTOP QUAD NEOFETCH CARDS (Absolute 4-Corners)         */}
      {/* Cards converge onto card4 position on scroll             */}
      {/* ======================================================== */}
      <div className="hidden lg:block absolute inset-0 max-w-[1440px] mx-auto pointer-events-none">
        {/* Top Left Card - Projects (z-10: bottom of stack) */}
        <motion.div
          ref={card1Ref}
          style={{ x: c1X, y: c1Y, scale: c1Scale, rotate: c1Rotate }}
          className="absolute top-24 left-6 xl:left-12 pointer-events-auto z-10"
        >
          <HeroCard card={card1} variant="desktop" />
        </motion.div>

        {/* Top Right Card - Badges (z-20: middle layer) */}
        <motion.div
          ref={card2Ref}
          style={{ x: c2X, y: c2Y, scale: c2Scale, rotate: c2Rotate }}
          className="absolute top-24 right-6 xl:right-12 pointer-events-auto z-20"
        >
          <HeroCard card={card2} variant="desktop" />
        </motion.div>

        {/* Bottom Left Card - Experience (z-30: just under top card) */}
        <motion.div
          ref={card3Ref}
          style={{ x: c3X, y: c3Y, scale: c3Scale, rotate: c3Rotate }}
          className="absolute bottom-12 left-6 xl:left-12 pointer-events-auto z-30"
        >
          <HeroCard card={card3} variant="desktop" />
        </motion.div>

        {/* Bottom Right Card - Portfolio (z-40: TOP of stack) */}
        <motion.div
          ref={card4Ref}
          style={{ scale: c4Scale, filter: c4Filter }}
          className="absolute bottom-12 right-6 xl:right-12 pointer-events-auto z-40"
        >
          <HeroCard card={card4} variant="desktop" />
        </motion.div>
      </div>

      {/* ======================================================== */}
      {/* CENTER DOMINANT CONTENT (All Viewports)                   */}
      {/* ======================================================== */}
      <div className="relative z-10 max-w-2xl sm:max-w-3xl mx-auto text-center flex flex-col items-center">
        {/* Status Pill: Location & Availability Beacon */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[var(--surface)] border border-slate-200/80 shadow-2xs mb-6 sm:mb-8"
        >
          <span className="relative flex h-2 w-2" aria-hidden="true">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent)] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--accent)]" />
          </span>
          <span className="text-xs font-medium text-[var(--ink)] tracking-tight">
            {profileData.statusText}
          </span>
        </motion.div>

        {/* Display Typography: 2-line Dominant Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-6 sm:mb-8"
        >
          <h1 className="text-5xl sm:text-7xl lg:text-[5.5rem] font-bold tracking-tight text-[var(--ink)] leading-[0.95] select-none">
            {profileData.firstName}
            <br />
            <span className="text-slate-800">{profileData.lastName}</span>
          </h1>
        </motion.div>

        {/* Lead Subtitle: Max 2 lines */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-sm sm:text-base md:text-lg text-[var(--ink-secondary)] max-w-xl mx-auto leading-relaxed mb-8 sm:mb-10 font-normal"
        >
          {profileData.subtitle}
        </motion.p>

        {/* Action Buttons CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full sm:w-auto"
        >
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
        </motion.div>

        {/* ======================================================== */}
        {/* MOBILE & TABLET 2x2 BENTO GRID (< 1024px)                */}
        {/* ======================================================== */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="lg:hidden grid grid-cols-2 gap-2.5 sm:gap-3.5 w-full max-w-lg mt-10 sm:mt-12"
        >
          {profileData.heroCards.map((card) => (
            <HeroCard key={card.id} card={card} variant="mobile" />
          ))}
        </motion.div>
      </div>
    </section>
  )
}
