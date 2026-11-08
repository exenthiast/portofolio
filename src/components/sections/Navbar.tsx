import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUpRight, Menu, X } from 'lucide-react'
import { profileData } from '../../data/profile'
import { Button } from '../ui/Button'

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[var(--bg)]/80 backdrop-blur-md border-b border-slate-200/50 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
        {/* Left: Brand Identity */}
        <a
          href="#overview"
          className="flex items-center gap-3 group focus-visible:outline-2 focus-visible:outline-[var(--accent)] rounded-lg p-1 -m-1"
          aria-label="Alfiz Desta Home"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-[var(--surface-terminal)] text-white font-mono font-bold flex items-center justify-center text-sm shadow-xs border border-white/10 group-hover:border-[var(--accent)] transition-colors">
            AD
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm sm:text-base tracking-tight text-[var(--ink)] flex items-center gap-0.5">
              {profileData.firstName}
              <span className="text-[var(--accent)]">.</span>
            </span>
            <span className="text-xs text-[var(--ink-secondary)] font-normal -mt-0.5">
              {profileData.title}
            </span>
          </div>
        </a>

        {/* Center: Desktop Navigation Links */}
        <nav
          className="hidden md:flex items-center gap-1 lg:gap-2 px-3 py-1.5 rounded-full bg-[var(--surface)] border border-slate-200/60 shadow-2xs"
          aria-label="Main Navigation"
        >
          {profileData.navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="px-3.5 py-1.5 text-xs font-medium text-[var(--ink-secondary)] hover:text-[var(--ink)] hover:bg-slate-100/60 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right: Quick Action CTAs (Desktop) */}
        <div className="hidden sm:flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            href={profileData.socialLinks.github.url}
            target="_blank"
            iconRight={<ArrowUpRight className="w-3.5 h-3.5" />}
          >
            GitHub
          </Button>

          <Button
            variant="secondary"
            size="sm"
            href={profileData.socialLinks.linkedin.url}
            target="_blank"
            iconRight={<ArrowUpRight className="w-3.5 h-3.5" />}
          >
            LinkedIn
          </Button>
        </div>

        {/* Mobile Right: CV Quick Button + Menu Toggle */}
        <div className="flex sm:hidden items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            href={profileData.resumeUrl}
            target="_blank"
            iconRight={<ArrowUpRight className="w-3 h-3" />}
          >
            CV
          </Button>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-[var(--ink)] hover:bg-slate-100 rounded-lg focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
            aria-label={mobileMenuOpen ? 'Close Menu' : 'Open Menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="sm:hidden border-b border-slate-200/80 bg-[var(--surface)] px-5 py-4 space-y-2 shadow-lg"
          >
            <div className="flex flex-col space-y-1">
              {profileData.navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 text-sm font-medium text-[var(--ink)] hover:bg-slate-100 rounded-lg transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-200/60 flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                href={profileData.socialLinks.github.url}
                target="_blank"
                className="flex-1"
                iconRight={<ArrowUpRight className="w-3.5 h-3.5" />}
              >
                GitHub
              </Button>
              <Button
                variant="outline"
                size="sm"
                href={profileData.socialLinks.linkedin.url}
                target="_blank"
                className="flex-1"
                iconRight={<ArrowUpRight className="w-3.5 h-3.5" />}
              >
                LinkedIn
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
