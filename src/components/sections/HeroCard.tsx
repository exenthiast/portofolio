import { useState } from 'react'
import { motion, type Transition } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import type { HeroCardData } from '../../types'
import { TrafficLightDots } from '../ui/TrafficLightDots'

interface HeroCardProps {
  card: HeroCardData
  variant?: 'desktop' | 'mobile'
  className?: string
}

export function HeroCard({ card, variant = 'desktop', className = '' }: HeroCardProps) {
  const [hoveredStackIndex, setHoveredStackIndex] = useState<number | null>(null)
  const isDesktop = variant === 'desktop'

  // Spring physics from DESIGN.md: stiffness: 140, damping: 24
  const springTransition: Transition = {
    type: 'spring',
    stiffness: 140,
    damping: 24,
  }

  if (!isDesktop) {
    // Mobile 2x2 Bento card presentation
    return (
      <motion.a
        href={card.href}
        layoutId={card.isMorphTarget ? 'about-window-mobile' : undefined}
        whileTap={{ scale: 0.97 }}
        className={`group p-3.5 sm:p-4 rounded-xl bg-[var(--surface)] border border-slate-200/80 shadow-2xs hover:shadow-sm hover:border-[var(--accent)]/40 flex flex-col justify-between transition-all select-none ${className}`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] sm:text-xs font-mono text-[var(--ink-secondary)]">
            {card.path.replace('/2025-2026', '').replace('/2024-2026', '')}
          </span>
          <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[var(--accent)] transition-colors" />
        </div>

        <div className="mb-2.5">
          <p className="text-sm sm:text-base font-bold text-[var(--ink)] leading-snug tracking-tight">
            {card.metric}
          </p>
          <p className="text-[11px] text-[var(--ink-secondary)] line-clamp-1">
            {card.desc}
          </p>
        </div>

        <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1">
          {card.stack.slice(0, 2).map((item, idx) => (
            <span
              key={idx}
              className="text-[9px] sm:text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--bg-subtle)] text-[var(--accent)] font-medium"
            >
              {item}
            </span>
          ))}
          {card.stack.length > 2 && (
            <span className="text-[9px] font-mono text-[var(--ink-secondary)] self-center">
              +{card.stack.length - 2}
            </span>
          )}
        </div>
      </motion.a>
    )
  }

  // Desktop Angled Neofetch Card
  return (
    <motion.div
      layoutId={card.isMorphTarget ? 'about-window' : undefined}
      initial={{ opacity: 0, rotate: card.rotation, scale: 0.95 }}
      animate={{ opacity: 1, rotate: card.rotation, scale: 1 }}
      whileHover={{
        rotate: 0,
        scale: 1.03,
        y: -4,
        zIndex: 20,
        boxShadow:
          '0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
      }}
      transition={springTransition}
      className={`w-[290px] lg:w-[310px] p-4 rounded-xl bg-[var(--surface)] border border-slate-200/90 shadow-sm cursor-pointer select-none relative group transition-colors hover:border-slate-300 ${className}`}
    >
      <a href={card.href} className="block">
        {/* Card Header: Traffic Lights + Path */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <TrafficLightDots size="sm" />
            <span className="text-[11px] font-mono text-[var(--ink-secondary)] tracking-tight">
              {card.path}
            </span>
          </div>
          <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[var(--accent)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
        </div>

        {/* Metric & Description */}
        <div className="mb-3 space-y-0.5">
          <h3 className="text-xl font-bold tracking-tight text-[var(--ink)]">
            {card.metric}
          </h3>
          <p className="text-xs text-[var(--ink-secondary)] leading-relaxed">
            {card.desc}
          </p>
        </div>

        {/* Stack Box / Interactive Focus Box */}
        <div
          onMouseLeave={() => setHoveredStackIndex(null)}
          className="p-2 rounded-lg bg-[var(--bg-subtle)] border border-slate-200/60 transition-colors group-hover:border-[var(--accent)]/30"
        >
          <div className="flex flex-wrap items-center gap-1.5">
            {card.stack.map((item, index) => {
              const isHovered = hoveredStackIndex === index
              const isAnyHovered = hoveredStackIndex !== null

              let textColorClass = 'text-[var(--accent)] font-medium'
              if (isHovered) {
                textColorClass = 'text-[var(--ink)] font-bold'
              } else if (isAnyHovered) {
                textColorClass = 'text-slate-400 font-normal'
              } else {
                textColorClass = 'text-[var(--accent)] font-medium'
              }

              return (
                <span
                  key={index}
                  onMouseEnter={() => setHoveredStackIndex(index)}
                  onMouseLeave={() => setHoveredStackIndex(null)}
                  className={`text-[11px] font-mono transition-colors duration-150 inline-flex items-center gap-1 cursor-default ${textColorClass}`}
                >
                  {item}
                  {index < card.stack.length - 1 && (
                    <span className="text-slate-300 font-normal">·</span>
                  )}
                </span>
              )
            })}
          </div>
        </div>
      </a>
    </motion.div>
  )
}
