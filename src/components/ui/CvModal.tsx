import { useEffect, useState } from 'react'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { track } from '../../lib/analytics'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Download } from 'lucide-react'
import { usePublicContent } from '../../hooks/useLocale'
import { getCvDocuments } from '../../data/cv'
import type { CvLanguage } from '../../types/profile'
import { TrafficLightDots } from './TrafficLightDots'

interface CvModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function CvModal({ isOpen, onClose }: CvModalProps) {
  const { profileData, cvContent } = usePublicContent()
  // Mobile Safari/Chrome render embedded PDFs poorly (first page only / blank) → offer open/download instead.
  const canEmbedPdf = useMediaQuery('(min-width: 768px) and (pointer: fine)')
  const reduceMotion = useReducedMotion()
  const [language, setLanguage] = useState<CvLanguage>('id')
  const documents = getCvDocuments(profileData)
  const selected = documents.find((cv) => cv.language === language) ?? documents[0]!

  useEffect(() => {
    if (isOpen) track('cv_open')
  }, [isOpen])

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
          aria-label={cvContent.viewerLabel}
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
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 16 }}
            transition={{ type: 'spring', stiffness: 140, damping: 24 }}
            className="relative z-10 w-full max-w-4xl h-[85vh] bg-[var(--surface)] border border-slate-200/90 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Modal Header Bar */}
            <div className="px-4 py-3 bg-[var(--surface-raised)] border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="group flex items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-[var(--accent)] rounded p-1 -m-1 cursor-pointer"
                  aria-label={cvContent.close}
                  title={cvContent.closeHint}
                >
                  <TrafficLightDots size="sm" />
                </button>
                <span className="max-w-48 truncate text-xs text-[var(--ink-secondary)] hidden sm:inline">
                  {cvContent.pathPrefix}{selected.url.split('/').pop()?.split(/[?#]/)[0]}
                </span>
              </div>

              <span className="text-xs font-medium text-[var(--ink)] tracking-tight truncate max-w-[200px] sm:max-w-none">
                {profileData.firstName} {profileData.lastName} — CV
              </span>

              <div className="flex items-center gap-2">
                <a
                  href={selected.url}
                  download={selected.downloadName}
                  onClick={() => track('cv_download')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--ink)] bg-[var(--surface)] hover:bg-slate-100 rounded-full border border-slate-200/80 transition-colors shadow-2xs focus-visible:outline-2 focus-visible:outline-[var(--accent)] cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-[var(--accent)]" />
                  <span>{cvContent.download}</span>
                </a>
              </div>
            </div>

            {documents.length > 1 && (
              <div role="group" aria-label={cvContent.languageLabel} className="flex shrink-0 flex-wrap items-center gap-2 px-4 py-2">
                <span className="mr-1 text-sm text-[var(--ink-secondary)]">{cvContent.languageLabel}</span>
                {documents.map((cv) => (
                  <button key={cv.language} type="button" aria-pressed={selected.language === cv.language} onClick={() => setLanguage(cv.language)} className={`min-h-11 rounded-full px-4 text-sm font-medium cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${selected.language === cv.language ? 'bg-[var(--ink)] text-[var(--surface)]' : 'bg-[var(--bg-subtle)] text-[var(--ink)]'}`}>
                    {cv.label}
                  </button>
                ))}
              </div>
            )}

            {/* Modal Body: Embedded PDF In-Page Preview */}
            <div className="min-h-0 flex-1 w-full bg-slate-100 relative">
              {canEmbedPdf ? (
                <iframe
                  key={selected.language}
                  src={`${selected.url.split('#')[0]}#toolbar=0&navpanes=0`}
                  title={`${cvContent.heading} — ${profileData.firstName} ${profileData.lastName} (${selected.label})`}
                  className="w-full h-full border-none"
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
                  <p className="text-[length:var(--step-body)] text-[var(--ink-secondary)]">{cvContent.mobileHint}</p>
                  <a
                    href={selected.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => track('cv_download')}
                    className="inline-flex h-12 items-center gap-2 rounded-full bg-[var(--surface-terminal)] px-6 font-medium text-white"
                  >
                    {cvContent.open}
                  </a>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
