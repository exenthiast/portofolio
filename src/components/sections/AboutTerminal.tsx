import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Terminal, Clock, Sparkles } from 'lucide-react'
import { profileData } from '../../data/profile'
import { TrafficLightDots } from '../ui/TrafficLightDots'
import heroPhoto from '../../assets/hero.png'

interface AboutTerminalProps {
  className?: string
  isEmbedded?: boolean
}

export function AboutTerminal({ className = '', isEmbedded = false }: AboutTerminalProps) {
  const { about } = profileData
  const [timeString, setTimeString] = useState<string>('')

  // Live ticking clock for Asia/Jakarta (WIB, GMT+7)
  useEffect(() => {
    function updateClock() {
      const now = new Date()
      const formatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Jakarta',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      })
      setTimeString(`${formatter.format(now)} WIB`)
    }

    updateClock()
    const timer = setInterval(updateClock, 1000)
    return () => clearInterval(timer)
  }, [])

  const containerClasses = isEmbedded
    ? `w-full h-full bg-[var(--surface)] overflow-hidden flex flex-col ${className}`
    : `w-full max-w-6xl mx-auto rounded-2xl bg-[var(--surface)] border border-slate-200/90 shadow-lg overflow-hidden flex flex-col transition-all ${className}`

  return (
    <div className={containerClasses}>
      {/* ─── macOS Terminal Window Header ─── */}
      <div className="h-[52px] sm:h-14 px-5 sm:px-6 bg-slate-100/95 border-b border-slate-200/90 flex items-center justify-between select-none shrink-0">
        {/* Left: Traffic Light Dots */}
        <div className="flex items-center gap-2.5">
          <TrafficLightDots size="xl" />
        </div>

        {/* Center: Window Title with icon */}
        <div className="flex items-center gap-2 font-mono text-xs sm:text-sm text-slate-800 font-semibold tracking-tight">
          <Terminal className="w-4 h-4 text-[var(--accent)]" />
          <span>{about.terminalPath} — zsh</span>
        </div>

        {/* Right: Live Local Clock (WIB only) */}
        <div className="hidden sm:flex items-center gap-2 font-mono text-xs sm:text-[13px] text-slate-600 font-medium">
          <Clock className="w-4 h-4 text-slate-400" />
          <span>{timeString || '00:00:00 WIB'}</span>
        </div>
      </div>

      {/* ─── Terminal Body (Solid rendering with zero blitz/flicker) ─── */}
      {/* Tablet (md:max-lg:): compact 2-column layout to fit in a single page */}
      {/* Desktop (lg: & xl:): 100% original spacious dimensions preserved */}
      <div className="p-4 sm:p-5 md:p-5 lg:p-8 xl:p-9 flex flex-col md:flex-row gap-4 sm:gap-5 md:gap-5 lg:gap-10 overflow-y-auto">
        {/* ─── Left Column: Command prompt + Profile Portrait Card ─── */}
        <div className="w-full md:w-[240px] lg:w-[340px] xl:w-[360px] shrink-0 flex flex-col">
          {/* Shell command line */}
          <div className="font-mono text-xs md:text-xs lg:text-sm mb-3 md:mb-3 lg:mb-4 flex items-center gap-1.5 select-none bg-[var(--bg-subtle)] px-3 py-1.5 md:py-1.5 lg:py-2 rounded-lg border border-slate-200/60">
            <span className="text-[var(--accent)] font-semibold">alfizdesta:~$</span>
            <span className="text-[var(--ink)] font-medium">cat ./about.md</span>
          </div>

          {/* Profile Card Container */}
          <div className="rounded-xl bg-[var(--bg-subtle)] border border-slate-200/80 p-3.5 sm:p-4 md:p-3.5 lg:p-4 xl:p-5 flex flex-col shadow-2xs group">
            {/* Portrait Image with interactive 'goyang' wobble on hover */}
            <motion.div
              whileHover={{
                rotate: [-2, 2, -1.5, 1.5, 0],
                transition: { duration: 0.45, ease: 'easeInOut' },
              }}
              whileTap={{ scale: 0.98 }}
              className="w-full aspect-[4/3] sm:aspect-square md:aspect-[4/3] lg:aspect-square max-h-[220px] md:max-h-[190px] lg:max-h-none rounded-lg overflow-hidden bg-slate-200/60 border border-slate-200/80 relative cursor-pointer"
            >
              <img
                src={heroPhoto}
                alt={about.photo.imageAlt}
                className="w-full h-full object-cover object-top select-none group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-[10px] font-mono text-white flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
                <span>active</span>
              </div>
            </motion.div>

            {/* Profile Meta Below Image */}
            <div className="mt-3 md:mt-2.5 lg:mt-4 space-y-0.5 md:space-y-0.5 lg:space-y-1">
              <h3 className="font-bold text-base md:text-base lg:text-lg text-[var(--ink)] tracking-tight">
                {about.photo.name}
              </h3>
              <p className="text-xs md:text-[11px] lg:text-xs text-[var(--ink-secondary)] leading-relaxed">
                {about.photo.location}
              </p>
              <p className="text-xs md:text-[11px] lg:text-xs font-mono text-[var(--accent)] font-medium pt-0.5 lg:pt-1">
                {about.photo.tag}
              </p>
            </div>
          </div>
        </div>

        {/* ─── Right Column: Headline, Bio & System Specifications Matrix ─── */}
        <div className="flex-1 flex flex-col justify-between">
          <div>
            {/* Headline clamped to max 2 lines */}
            <h2 className="text-xl sm:text-2xl md:text-xl lg:text-[2.25rem] font-bold tracking-tight text-[var(--ink)] leading-snug">
              {about.headline}
            </h2>

            {/* Sub-headline */}
            <p className="text-xs sm:text-sm md:text-xs lg:text-base font-medium text-[var(--accent)] mt-1 lg:mt-1.5 mb-2 md:mb-2 lg:mb-4">
              {about.subHeadline}
            </p>

            {/* Bio text */}
            <p className="text-xs sm:text-sm md:text-xs lg:text-base text-[var(--ink-secondary)] leading-relaxed mb-3 sm:mb-4 md:mb-3 lg:mb-8">
              {about.bio}
            </p>
          </div>

          {/* Neofetch System Specifications & Tech Matrix Box */}
          <div className="rounded-xl bg-[var(--bg-subtle)] border border-slate-200/80 p-3 sm:p-4 md:p-3 lg:p-5 font-mono shadow-2xs">
            <div className="flex items-center gap-2 pb-2 md:pb-2 lg:pb-3 mb-2 md:mb-2 lg:mb-3 border-b border-slate-200/70">
              <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
              <h4 className="text-[10px] sm:text-[11px] md:text-[10px] lg:text-xs font-bold tracking-wider text-[var(--ink)] uppercase">
                {about.specsHeader}
              </h4>
            </div>

            <div className="space-y-1.5 md:space-y-1 lg:space-y-2 text-xs md:text-[11px] lg:text-[13px] leading-relaxed">
              {about.specs.map((spec, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row sm:items-baseline gap-1 md:gap-1.5 lg:gap-3 group/item hover:bg-slate-200/40 p-1 rounded transition-colors"
                >
                  <span className="w-28 md:w-24 lg:w-32 shrink-0 font-medium text-[var(--ink)]">
                    {spec.category}:
                  </span>
                  <span className="text-[var(--ink-secondary)] group-hover/item:text-[var(--accent)] transition-colors">
                    {spec.items}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
