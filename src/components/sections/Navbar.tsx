import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUpRight, Menu, X } from 'lucide-react'
import { profileData } from '../../data/profile'
import { Button } from '../ui/Button'

interface NavbarProps {
  onOpenCv?: () => void
}

export function Navbar({ onOpenCv }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [activeSection, setActiveSection] = useState('#overview')

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      setIsScrolled(scrollY > 20)

      // Active section detection by offset
      const sectionIds = ['contact', 'badges', 'experience', 'projects', 'about', 'overview']
      if (scrollY < 120) {
        setActiveSection('#overview')
        return
      }

      for (const id of sectionIds) {
        const el = document.getElementById(id)
        if (el) {
          const top = el.offsetTop - 180
          if (scrollY >= top) {
            setActiveSection(`#${id}`)
            break
          }
        }
      }
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className={`fixed inset-x-0 z-50 flex flex-col items-center pointer-events-none transition-all duration-300 ease-out ${
        isScrolled ? 'top-3 sm:top-4 px-4' : 'top-0 px-0'
      }`}
    >
      <div
        className={`pointer-events-auto flex items-center justify-between transition-all duration-300 ease-out ${
          isScrolled
            ? 'max-w-4xl lg:max-w-5xl w-full bg-[#ffffff]/70 backdrop-blur-md border border-slate-200/90 shadow-md shadow-slate-900/5 rounded-full h-14 sm:h-16 px-4 sm:px-6'
            : 'w-full max-w-none bg-[#ffffff] border-b border-slate-200/80 rounded-none shadow-none h-16 sm:h-20 px-6 sm:px-12 lg:px-16'
        }`}
      >
        {/* Left: Brand Identity */}
        <a
          href="#overview"
          onClick={() => setActiveSection('#overview')}
          className="flex items-center gap-2.5 sm:gap-3 group focus-visible:outline-2 focus-visible:outline-[var(--accent)] rounded-lg p-1 -m-1"
          aria-label="Alfiz Desta Home"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[var(--surface-terminal)] text-white font-mono font-bold flex items-center justify-center text-xs sm:text-sm shadow-xs border border-white/10 group-hover:border-[var(--accent)] transition-colors">
            AD
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-xs sm:text-sm tracking-tight text-[var(--ink)] flex items-center gap-0.5">
              {profileData.firstName}
              <span className="text-[var(--accent)]">.</span>
            </span>
            <span className="text-[10px] sm:text-xs text-[var(--ink-secondary)] font-normal -mt-0.5 hidden xs:inline">
              {profileData.title}
            </span>
          </div>
        </a>

        {/* Center: Navigation Links with Active Gray Capsule */}
        <nav
          className="hidden md:flex items-center gap-1 p-1 rounded-full"
          aria-label="Main Navigation"
        >
          {profileData.navLinks.map((link) => {
            const isActive = activeSection === link.href

            return (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setActiveSection(link.href)}
                className={`relative px-3.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-[var(--accent)] rounded-full ${
                  isActive
                    ? 'text-[var(--ink)] font-semibold'
                    : 'text-[var(--ink-secondary)] hover:text-[var(--ink)]'
                }`}
              >
                {/* Active Gray Capsule Indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeNavPill"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    className="absolute inset-0 rounded-full bg-slate-100 border border-slate-200/80 -z-10 shadow-2xs"
                  />
                )}
                <span className="relative z-10">{link.label}</span>
              </a>
            )
          })}
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

          {/* LinkedIn Button: Black with white text */}
          <Button
            variant="primary"
            size="sm"
            href={profileData.socialLinks.linkedin.url}
            target="_blank"
            iconRight={<ArrowUpRight className="w-3.5 h-3.5" />}
          >
            LinkedIn
          </Button>
        </div>

        {/* Mobile Right: CV Quick Button + Menu Toggle */}
        <div className="flex sm:hidden items-center gap-1.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={onOpenCv}
            href={onOpenCv ? undefined : profileData.resumeUrl}
            target={onOpenCv ? undefined : '_blank'}
            iconRight={<ArrowUpRight className="w-3 h-3" />}
          >
            CV
          </Button>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 text-[var(--ink)] hover:bg-slate-100 rounded-lg focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
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
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className={`pointer-events-auto sm:hidden bg-[#ffffff]/95 backdrop-blur-md border border-slate-200/80 shadow-lg px-5 py-4 space-y-2 w-full ${
              isScrolled
                ? 'max-w-sm mx-auto mt-2 rounded-2xl'
                : 'border-t-0 border-x-0 border-b border-slate-200/80'
            }`}
          >
            <div className="flex flex-col space-y-1">
              {profileData.navLinks.map((link) => {
                const isActive = activeSection === link.href

                return (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => {
                      setActiveSection(link.href)
                      setMobileMenuOpen(false)
                    }}
                    className={`px-3 py-2 text-sm rounded-lg transition-colors flex items-center justify-between ${
                      isActive
                        ? 'bg-slate-100 text-[var(--ink)] font-semibold border border-slate-200/70'
                        : 'text-[var(--ink-secondary)] hover:text-[var(--ink)] hover:bg-slate-50'
                    }`}
                  >
                    <span>{link.label}</span>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
                    )}
                  </a>
                )
              })}
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
                variant="primary"
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
