import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download } from 'lucide-react'
import { profileData } from '../../data/profile'
import { TrafficLightDots } from './TrafficLightDots'

interface CvModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CvModal({ isOpen, onClose }: CvModalProps) {
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    document.body.style.overflow = 'hidden'
    document.documentElement.classList.add('lenis-stopped')
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = ''
      document.documentElement.classList.remove('lenis-stopped')
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Curriculum Vitae Viewer"
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6"
        >
          {/* Backdrop with smooth blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm cursor-pointer"
          />

          {/* Modal Container: macOS Terminal Window Frame */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ type: 'spring', stiffness: 140, damping: 24 }}
            className="relative z-10 w-full max-w-4xl h-[85vh] bg-[var(--surface)] border border-slate-200/90 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Modal Header Bar */}
            <div className="px-4 py-3 bg-[var(--surface-raised)] border-b border-slate-200/80 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="group flex items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-[var(--accent)] rounded p-1 -m-1 cursor-pointer"
                  aria-label="Close CV Modal"
                  title="Close (Esc)"
                >
                  <TrafficLightDots size="sm" />
                </button>
                <span className="text-xs font-mono text-[var(--ink-secondary)] hidden sm:inline">
                  ~/cv/CV-ALFIZ REAL.pdf
                </span>
              </div>

              <span className="text-xs font-medium text-[var(--ink)] tracking-tight truncate max-w-[200px] sm:max-w-none">
                {profileData.firstName} {profileData.lastName} — CV
              </span>

              <div className="flex items-center gap-2">
                <a
                  href={profileData.resumeUrl}
                  download="CV-Alfiz-Desta-Ariant-Permana.pdf"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--ink)] bg-[var(--surface)] hover:bg-slate-100 rounded-full border border-slate-200/80 transition-colors shadow-2xs focus-visible:outline-2 focus-visible:outline-[var(--accent)] cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-[var(--accent)]" />
                  <span>Download PDF</span>
                </a>
              </div>
            </div>

            {/* Modal Body: Embedded PDF In-Page Preview */}
            <div className="flex-1 w-full h-full bg-slate-100 relative">
              <iframe
                src={`${profileData.resumeUrl}#toolbar=0&navpanes=0`}
                title="Curriculum Vitae Alfiz Desta Ariant Permana"
                className="w-full h-full border-none"
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
