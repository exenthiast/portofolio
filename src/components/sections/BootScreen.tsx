import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { usePublicContent } from '../../hooks/useLocale'

const STEPS = [
  './boot --portfolio',
  '[ ok ] mounting /home/alfiz',
  '[ ok ] loading projects, badges, journey',
  '[ ok ] starting interactive shell',
  'alfizdesta. ready',
]
const KEY = 'alfizdesta:booted'

function shouldBoot(): boolean {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
  if (window.location.hash.length > 1) return false // deep links go straight to content
  try {
    return sessionStorage.getItem(KEY) !== '1'
  } catch {
    return true
  }
}

/** First-visit boot sequence (< 2s). Skipped on repeat visits within a session and for reduced motion. */
export function BootScreen() {
  const { copy } = usePublicContent()
  const [visible, setVisible] = useState(shouldBoot)
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (!visible) return
    try {
      sessionStorage.setItem(KEY, '1')
    } catch {
      /* storage unavailable: boot will just show again */
    }
    const tick = window.setInterval(() => setStep((s) => s + 1), 280)
    const done = window.setTimeout(() => setVisible(false), 1700)
    const skip = () => setVisible(false)
    window.addEventListener('keydown', skip)
    window.addEventListener('pointerdown', skip)
    return () => {
      window.clearInterval(tick)
      window.clearTimeout(done)
      window.removeEventListener('keydown', skip)
      window.removeEventListener('pointerdown', skip)
    }
  }, [visible])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          data-ui="terminal"
          role="status"
          aria-label={copy.loading}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-[var(--bg)] px-6 font-mono"
        >
          <div className="w-full max-w-md text-sm">
            {STEPS.slice(0, step + 1).map((line, i) => (
              <p key={line} className={i === 0 ? 'text-[var(--ink)]' : i === STEPS.length - 1 ? 'mt-2 font-semibold text-[var(--accent)]' : 'text-[var(--ink-secondary)]'}>
                {i === 0 && <span className="text-[var(--accent)]">$ </span>}
                {line}
              </p>
            ))}
            <span aria-hidden="true" className="caret mt-1 inline-block h-4 w-2 bg-[var(--ink)]" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
