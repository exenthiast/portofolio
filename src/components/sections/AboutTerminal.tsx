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
    : `w-full max-w-5xl xl:max-w-6xl mx-auto rounded-2xl bg-[var(--surface)] border border-slate-200/90 shadow-lg overflow-hidden flex flex-col transition-all ${className}`

  return (
    <div className={containerClasses}>
      {/* ─── macOS Terminal Window Header ─── */}
      <div className="h-[52px] sm:h-14 px-4 sm:px-6 bg-slate-100/95 border-b border-slate-200/90 flex items-center justify-between select-none shrink-0">
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
      <div className="p-4 sm:p-5 md:p-6 lg:p-7 xl:p-8 flex flex-col md:flex-row gap-4 sm:gap-5 md:gap-6 lg:gap-8 overflow-y-auto">
        {/* ─── Left Column: Command prompt + Profile Portrait Card ─── */}
        <div className="w-full md:w-[240px] lg:w-[280px] xl:w-[320px] shrink-0 flex flex-col">
          {/* Shell command line */}
          <div className="font-mono text-xs mb-3 sm:mb-3.5 flex items-center gap-1.5 select-none bg-[var(--bg-subtle)] px-3 py-1.5 sm:py-2 rounded-lg border border-slate-200/60">
            <span className="text-[var(--accent)] font-semibold">alfizdesta:~$</span>
            <span className="text-[var(--ink)] font-medium">cat ./about.md</span>
          </div>

          {/* Profile Card Container */}
          <div className="rounded-xl bg-[var(--bg-subtle)] border border-slate-200/80 p-3 sm:p-3.5 md:p-3.5 lg:p-4 flex flex-row sm:flex-col items-center sm:items-stretch gap-3 sm:gap-0 shadow-2xs group">
            {/* Portrait Image with interactive 'goyang' wobble on hover */}
            <motion.div
              whileHover={{
                rotate: [-2, 2, -1.5, 1.5, 0],
                transition: { duration: 0.45, ease: 'easeInOut' },
              }}
              whileTap={{ scale: 0.98 }}
              className="w-20 h-20 sm:w-full sm:aspect-[4/3] md:aspect-[4/3] lg:aspect-square max-h-[170px] sm:max-h-[180px] md:max-h-[190px] lg:max-h-[220px] xl:max-h-[250px] shrink-0 rounded-lg overflow-hidden bg-slate-200/60 border border-slate-200/80 relative cursor-pointer"
            >
              <img
                src={heroPhoto}
                alt={about.photo.imageAlt}
                className="w-full h-full object-cover object-top select-none group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 px-1.5 sm:px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-[9px] sm:text-[10px] font-mono text-white flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
                <span>active</span>
              </div>
            </motion.div>

            {/* Profile Meta Below Image */}
            <div className="mt-0 sm:mt-3 space-y-0.5 sm:space-y-1">
              <h3 className="font-bold text-sm sm:text-base md:text-base lg:text-lg text-[var(--ink)] tracking-tight">
                {about.photo.name}
              </h3>
              <p className="text-[11px] sm:text-xs text-[var(--ink-secondary)] leading-relaxed">
                {about.photo.location}
              </p>
              <p className="text-[10px] sm:text-xs font-mono text-[var(--accent)] font-medium pt-0.5">
                {about.photo.tag}
              </p>
            </div>
          </div>
        </div>

        {/* ─── Right Column: Headline, Bio & System Specifications Matrix ─── */}
        <div className="flex-1 flex flex-col justify-between">
          <div>
            {/* Headline clamped to max 2 lines */}
            <h2 className="text-xl sm:text-2xl md:text-2xl lg:text-[1.85rem] xl:text-3xl font-bold tracking-tight text-[var(--ink)] leading-snug">
              {about.headline}
            </h2>

            {/* Sub-headline */}
            <p className="text-xs sm:text-sm md:text-sm lg:text-base font-medium text-[var(--accent)] mt-1 sm:mt-1.5 mb-2 sm:mb-2.5 md:mb-3">
              {about.subHeadline}
            </p>

            {/* Bio text */}
            <p className="text-xs sm:text-sm md:text-sm lg:text-[15px] text-[var(--ink-secondary)] leading-relaxed mb-3 sm:mb-4 md:mb-4 lg:mb-5">
              {about.bio}
            </p>
          </div>

          {/* Neofetch System Specifications & Tech Matrix Box */}
          <div className="rounded-xl bg-[var(--bg-subtle)] border border-slate-200/80 p-3 sm:p-3.5 md:p-3.5 lg:p-4 font-mono shadow-2xs">
            <div className="flex items-center gap-2 pb-2 sm:pb-2.5 mb-2 sm:mb-2.5 border-b border-slate-200/70">
              <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
              <h4 className="text-[10px] sm:text-[11px] md:text-xs font-bold tracking-wider text-[var(--ink)] uppercase">
                {about.specsHeader}
              </h4>
            </div>

            <div className="space-y-1 sm:space-y-1.5 text-[11px] sm:text-xs md:text-xs lg:text-[13px] leading-relaxed">
              {about.specs.map((spec, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-2.5 group/item hover:bg-slate-200/40 p-1 rounded transition-colors"
                >
                  <span className="w-24 sm:w-28 md:w-28 lg:w-32 shrink-0 font-medium text-[var(--ink)]">
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
