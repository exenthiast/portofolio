import type { Transition } from 'framer-motion'

/** Physics tokens from DESIGN.md §6.1 */
export const springPhysics = {
  tactile: { type: 'spring', stiffness: 260, damping: 20 },
  morph: { type: 'spring', stiffness: 140, damping: 24, mass: 0.8 },
  smooth: { duration: 0.25, ease: [0.16, 1, 0.3, 1] },
} satisfies Record<string, Transition>
