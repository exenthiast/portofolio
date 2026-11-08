import { motion } from 'framer-motion'
import { ArrowDown, ArrowUpRight } from 'lucide-react'
import { profileData } from '../../data/profile'
import { Button } from '../ui/Button'
import { HeroCard } from './HeroCard'

interface HeroProps {
  onOpenCv?: () => void
}

export function Hero({ onOpenCv }: HeroProps) {
  const [card1, card2, card3, card4] = profileData.heroCards

  return (
    <section
      id="overview"
      className="relative min-h-[calc(100vh-5rem)] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-16 lg:pb-20 overflow-hidden bg-transparent"
    >
      {/* ======================================================== */}
      {/* DESKTOP QUAD NEOFETCH CARDS (Absolute 4-Corners)         */}
      {/* ======================================================== */}
      <div className="hidden lg:block absolute inset-0 max-w-[1440px] mx-auto pointer-events-none">
        {/* Top Left Card - Projects */}
        <div className="absolute top-24 left-6 xl:left-12 pointer-events-auto">
          <HeroCard card={card1} variant="desktop" />
        </div>

        {/* Top Right Card - Badges */}
        <div className="absolute top-24 right-6 xl:right-12 pointer-events-auto">
          <HeroCard card={card2} variant="desktop" />
        </div>

        {/* Bottom Left Card - Experience */}
        <div className="absolute bottom-12 left-6 xl:left-12 pointer-events-auto">
          <HeroCard card={card3} variant="desktop" />
        </div>

        {/* Bottom Right Card - Portfolio (Morph target) */}
        <div className="absolute bottom-12 right-6 xl:right-12 pointer-events-auto">
          <HeroCard card={card4} variant="desktop" />
        </div>
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
