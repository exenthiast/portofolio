import { useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

// Authentic GitHub Contribution Graph Green Palette
const COMMIT_SQUARES = [
  { id: 'sq-1', color: '#216e39', borderColor: '#19532b', col: 0, row: 0 }, // Level 4 - Darkest Green
  { id: 'sq-2', color: '#30a14e', borderColor: '#26813e', col: 1, row: 0 }, // Level 3 - Vibrant Green
  { id: 'sq-3', color: '#40c463', borderColor: '#339e4f', col: 2, row: 0 }, // Level 2 - Medium Green
  { id: 'sq-4', color: '#059669', borderColor: '#047857', col: 0, row: 1 }, // Brand Accent Emerald
  { id: 'sq-5', color: '#34d399', borderColor: '#10b981', col: 1, row: 1 }, // Soft Mint
  { id: 'sq-6', color: '#9be9a8', borderColor: '#7bc98a', col: 2, row: 1 }, // Level 1 - Light Green
]

export function GithubContributionCursor() {
  const [isSupported] = useState(() => {
    if (typeof window === 'undefined') return false
    const hasFinePointer = window.matchMedia('(pointer: fine)').matches
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    return hasFinePointer && !prefersReducedMotion
  })

  const [isVisible, setIsVisible] = useState(false)
  const [isHoveringInteractive, setIsHoveringInteractive] = useState(false)

  // Raw mouse coordinates
  const rawX = useMotionValue(-100)
  const rawY = useMotionValue(-100)

  // Staggered physics springs for trailing effect
  const spring0X = useSpring(rawX, { stiffness: 450, damping: 28, mass: 0.5 })
  const spring0Y = useSpring(rawY, { stiffness: 450, damping: 28, mass: 0.5 })

  const spring1X = useSpring(rawX, { stiffness: 380, damping: 26, mass: 0.6 })
  const spring1Y = useSpring(rawY, { stiffness: 380, damping: 26, mass: 0.6 })

  const spring2X = useSpring(rawX, { stiffness: 310, damping: 25, mass: 0.7 })
  const spring2Y = useSpring(rawY, { stiffness: 310, damping: 25, mass: 0.7 })

  const spring3X = useSpring(rawX, { stiffness: 250, damping: 24, mass: 0.8 })
  const spring3Y = useSpring(rawY, { stiffness: 250, damping: 24, mass: 0.8 })

  const spring4X = useSpring(rawX, { stiffness: 200, damping: 23, mass: 0.9 })
  const spring4Y = useSpring(rawY, { stiffness: 200, damping: 23, mass: 0.9 })

  const spring5X = useSpring(rawX, { stiffness: 150, damping: 22, mass: 1.0 })
  const spring5Y = useSpring(rawY, { stiffness: 150, damping: 22, mass: 1.0 })

  const springs = [
    { x: spring0X, y: spring0Y },
    { x: spring1X, y: spring1Y },
    { x: spring2X, y: spring2Y },
    { x: spring3X, y: spring3Y },
    { x: spring4X, y: spring4Y },
    { x: spring5X, y: spring5Y },
  ]

  useEffect(() => {
    if (!isSupported) return

    const handleMouseMove = (e: MouseEvent) => {
      setIsVisible(true)
      // Offset slightly to bottom-right of pointer arrow tip
      rawX.set(e.clientX + 16)
      rawY.set(e.clientY + 16)
    }

    const handleMouseLeave = () => {
      setIsVisible(false)
    }

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null
      const isInteractive = Boolean(
        target?.closest('a, button, [role="button"], input, textarea, [data-interactive]')
      )
      setIsHoveringInteractive(isInteractive)
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    document.addEventListener('mouseleave', handleMouseLeave)
    window.addEventListener('mouseover', handleMouseOver, { passive: true })

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseleave', handleMouseLeave)
      window.removeEventListener('mouseover', handleMouseOver)
    }
  }, [isSupported, rawX, rawY])

  if (!isSupported) return null

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 pointer-events-none z-[9999] transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {COMMIT_SQUARES.map((square, index) => {
        const spring = springs[index]

        return (
          <motion.div
            key={square.id}
            style={{
              x: spring.x,
              y: spring.y,
            }}
            animate={
              isHoveringInteractive
                ? {
                    // Snaps into a tactile 3x2 mini GitHub commit heatmap grid on hover!
                    translateX: square.col * 14,
                    translateY: square.row * 14,
                    scale: 1.1,
                    rotate: 0,
                  }
                : {
                    // Organic trailing snake layout when gliding freely
                    translateX: index * 2.5,
                    translateY: index * 2.5,
                    scale: 1,
                    rotate: index % 2 === 0 ? 3 : -3,
                  }
            }
            transition={{
              type: 'spring',
              stiffness: 350,
              damping: 25,
            }}
            className="absolute top-0 left-0 w-3 h-3 rounded-[2.5px] shadow-xs select-none"
          >
            <div
              className="w-full h-full rounded-[2.5px] border transition-transform duration-150"
              style={{
                backgroundColor: square.color,
                borderColor: square.borderColor,
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.12)',
              }}
            />
          </motion.div>
        )
      })}
    </div>
  )
}
