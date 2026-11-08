import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Transition } from 'framer-motion'
import { ArrowUpRight, Menu, X } from 'lucide-react'
import { profileData } from '../../data/profile'
import { Button } from '../ui/Button'

interface NavbarProps {
  onOpenCv?: () => void
}

const navbarSpring: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
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

  // Animated style values driven by isScrolled state
  const headerAnimateValues = useMemo(() => ({
    top: isScrolled ? 14 : 0,
    paddingLeft: isScrolled ? 16 : 0,
    paddingRight: isScrolled ? 16 : 0,
  }), [isScrolled])

  const navbarAnimateValues = useMemo(() =>
    isScrolled
      ? {
          borderRadius: 9999,
          maxWidth: 1024,
          height: 56,
          paddingLeft: 24,
          paddingRight: 24,
          backgroundColor: 'rgba(255, 255, 255, 0.70)',
          boxShadow: '0 4px 6px -1px rgba(15, 23, 42, 0.05), 0 2px 4px -2px rgba(15, 23, 42, 0.05)',
          borderColor: 'rgba(226, 232, 240, 0.9)',
          borderWidth: 1,
        }
      : {
          borderRadius: 0,
          maxWidth: 9999,
          height: 72,
          paddingLeft: 48,
          paddingRight: 48,
          backgroundColor: 'rgba(255, 255, 255, 1)',
          boxShadow: '0 0px 0px 0px rgba(0, 0, 0, 0)',
          borderColor: 'rgba(241, 242, 248, 0.8)',
          borderWidth: 0,
        },
  [isScrolled])

  return (
    <motion.header
      animate={headerAnimateValues}
      transition={navbarSpring}
      className="fixed inset-x-0 z-50 flex flex-col items-center pointer-events-none"
    >
      <motion.div
        animate={navbarAnimateValues}
        transition={navbarSpring}
        className={`pointer-events-auto flex items-center justify-between w-full ${
          isScrolled ? 'backdrop-blur-md' : ''
        }`}
        style={{
          borderStyle: 'solid',
          borderBottomWidth: isScrolled ? undefined : 1,
          borderBottomColor: isScrolled ? undefined : 'rgba(241, 242, 248, 0.8)',
        }}
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
      </motion.div>

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
    </motion.header>
  )
}
