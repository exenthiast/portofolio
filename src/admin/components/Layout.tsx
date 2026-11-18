import { useCallback } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router'
import { ExternalLink, LogOut, Upload } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { usePending } from '../lib/pending'
import { CommandPalette, useNavItems } from './CommandPalette'

const tree: { to: string; label: string; depth: number; end?: boolean }[] = [
  { to: '/', label: '~/admin', depth: 0, end: true },
  { to: '/projects', label: 'projects/', depth: 1 },
  { to: '/badges', label: 'badges/', depth: 1 },
  { to: '/experiences', label: 'experience/', depth: 1 },
  { to: '/profile', label: 'profile.md', depth: 1 },
  { to: '/media', label: 'media/', depth: 1 },
  { to: '/inbox', label: 'inbox/', depth: 1 },
  { to: '/analytics', label: 'analytics.log', depth: 1 },
  { to: '/activity', label: '.git/log', depth: 1 },
]

export function Layout() {
  const { state, signOut } = useAuth()
  const { changes } = usePending()
  const navigate = useNavigate()
  const goPublish = useCallback(() => navigate('/publish'), [navigate])
  const items = useNavItems(goPublish)
  const email = state.status === 'admin' ? state.email : ''

  const linkCls = ({ isActive }: { isActive: boolean }) =>
    `block rounded-lg px-3 py-1.5 font-mono text-[13px] transition-colors ${isActive ? 'bg-[var(--surface-terminal)] text-white' : 'text-[var(--ink-secondary)] hover:bg-[var(--surface-raised)] hover:text-[var(--ink)]'}`

  return (
    <div className="min-h-dvh bg-[var(--bg)] text-[var(--ink)] lg:grid lg:grid-cols-[240px_1fr]">
      <a href="#admin-main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[300] focus:rounded-full focus:bg-[var(--surface-terminal)] focus:px-4 focus:py-2 focus:text-white">Skip to content</a>

      {/* Sidebar: the admin as a file tree */}
      <aside className="hidden flex-col gap-6 bg-[var(--surface)] p-4 lg:sticky lg:top-0 lg:flex lg:h-dvh">
        <a href="/" className="flex items-center gap-2.5 px-2 pt-1">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--surface-terminal)] text-xs font-bold text-white">AD</span>
          <span className="text-sm font-semibold">Alfiz Desta<span className="text-[var(--accent)]">.</span> <span className="font-normal text-[var(--ink-secondary)]">admin</span></span>
        </a>
        <nav aria-label="Admin sections" className="flex flex-col gap-0.5">
          {tree.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={linkCls} style={{ marginLeft: n.depth * 14 }}>
              {n.depth > 0 && <span aria-hidden="true" className="opacity-40">├─ </span>}
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-1 border-0">
          <p className="truncate px-2 text-xs text-[var(--ink-secondary)]" title={email}>{email}</p>
          <button type="button" onClick={() => void signOut()} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-[var(--ink-secondary)] hover:bg-[var(--surface-raised)] hover:text-[var(--ink)] cursor-pointer">
            <LogOut className="h-4 w-4" /> exit
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-40 flex items-center gap-3 bg-[var(--bg)]/95 px-4 py-3 sm:px-8">
          <CommandPalette items={items} />
          <div className="ml-auto flex items-center gap-2">
            <a href="/" target="_blank" rel="noopener noreferrer" className="hidden h-9 items-center gap-1.5 rounded-full px-3 text-sm text-[var(--ink-secondary)] hover:text-[var(--ink)] sm:inline-flex">
              View site <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <NavLink to="/publish" className={`inline-flex h-9 items-center gap-2 rounded-full px-4 text-sm font-medium ${changes.length ? 'bg-[var(--accent)] text-white' : 'bg-[var(--surface-raised)] text-[var(--ink-secondary)]'}`}>
              <Upload className="h-4 w-4" />
              {changes.length ? `Publish · ${changes.length} change${changes.length > 1 ? 's' : ''}` : 'Up to date'}
            </NavLink>
            <button type="button" onClick={() => void signOut()} aria-label="Sign out" className="rounded-full p-2 text-[var(--ink-secondary)] hover:bg-[var(--surface-raised)] lg:hidden cursor-pointer">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>
        {/* Mobile nav: horizontal file tabs */}
        <nav aria-label="Admin sections" className="flex gap-1 overflow-x-auto px-4 pb-2 lg:hidden">
          {tree.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={(a) => `${linkCls(a)} shrink-0`}>{n.label}</NavLink>
          ))}
        </nav>
        <main id="admin-main" className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 pt-4 sm:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
