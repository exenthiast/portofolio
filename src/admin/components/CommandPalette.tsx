import * as Dialog from '@radix-ui/react-dialog'
import { useEffect, useMemo, useState, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router'

export interface PaletteItem {
  id: string
  label: string
  hint: string
  run: () => void
}

export function CommandPalette({ items }: { items: PaletteItem[] }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const results = useMemo(() => {
    const q = query.toLowerCase().trim()
    return q ? items.filter((i) => `${i.label} ${i.hint}`.toLowerCase().includes(q)) : items
  }, [items, query])

  const choose = (item: PaletteItem | undefined) => {
    if (!item) return
    setOpen(false)
    setQuery('')
    item.run()
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(results.length - 1, a + 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)) }
    if (e.key === 'Enter') choose(results[active])
  }

  return (
    <Dialog.Root open={open} onOpenChange={(o) => { setOpen(o); setActive(0) }}>
      <Dialog.Trigger className="hidden h-9 items-center gap-3 rounded-full bg-[var(--bg-subtle)] pl-4 pr-2 text-sm text-[var(--ink-secondary)] hover:bg-[var(--surface-raised)] cursor-pointer sm:inline-flex">
        Jump to…
        <kbd className="rounded-md bg-[var(--surface)] px-1.5 py-0.5 font-mono text-[11px]">⌘K</kbd>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[200] bg-[#09090b]/40" />
        <Dialog.Content data-ui="terminal" className="fixed left-1/2 top-[15dvh] z-[210] w-[calc(100vw-2rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-2xl bg-[var(--surface-terminal)] font-mono text-[var(--ink-terminal)] shadow-2xl">
          <Dialog.Title className="sr-only">Command palette</Dialog.Title>
          <Dialog.Description className="sr-only">Type to filter, arrows to move, Enter to run.</Dialog.Description>
          <div className="flex items-center gap-2 bg-[var(--surface-terminal-header)] px-4">
            <span className="text-[var(--accent)]">❯</span>
            <input
              autoFocus
              value={query}
              onChange={(e) => { setQuery(e.target.value); setActive(0) }}
              onKeyDown={onKeyDown}
              placeholder="cd projects, new badge, publish…"
              aria-label="Search commands"
              className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--ink-terminal-muted)]"
            />
          </div>
          <ul role="listbox" aria-label="Commands" className="max-h-80 overflow-y-auto p-2">
            {results.map((item, i) => (
              <li key={item.id} role="option" aria-selected={i === active}>
                <button
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onClick={() => choose(item)}
                  className={`flex w-full items-center justify-between gap-4 rounded-lg px-3 py-2 text-left text-sm cursor-pointer ${i === active ? 'bg-[var(--surface-terminal-header)] text-white' : ''}`}
                >
                  <span>{item.label}</span>
                  <span className="text-xs text-[var(--ink-terminal-muted)]">{item.hint}</span>
                </button>
              </li>
            ))}
            {results.length === 0 && <li className="px-3 py-2 text-sm text-[var(--ink-terminal-muted)]">zsh: no matches found</li>}
          </ul>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

// eslint-disable-next-line react/only-export-components
export function useNavItems(onPublish: () => void): PaletteItem[] {
  const navigate = useNavigate()
  return useMemo(
    () => [
      { id: 'overview', label: 'cd ~/admin', hint: 'Overview', run: () => navigate('/') },
      { id: 'projects', label: 'cd projects', hint: 'Projects', run: () => navigate('/projects') },
      { id: 'badges', label: 'cd badges', hint: 'Badges', run: () => navigate('/badges') },
      { id: 'experiences', label: 'cd experience', hint: 'Experience', run: () => navigate('/experiences') },
      { id: 'profile', label: 'vim profile', hint: 'Profile & CV', run: () => navigate('/profile') },
      { id: 'media', label: 'ls media', hint: 'Media library', run: () => navigate('/media') },
      { id: 'inbox', label: 'mail', hint: 'Inbox', run: () => navigate('/inbox') },
      { id: 'analytics', label: 'htop', hint: 'Analytics', run: () => navigate('/analytics') },
      { id: 'activity', label: 'git log', hint: 'Activity', run: () => navigate('/activity') },
      { id: 'new-project', label: 'touch projects/new', hint: 'New project', run: () => navigate('/projects/new') },
      { id: 'new-badge', label: 'touch badges/new', hint: 'New badge', run: () => navigate('/badges/new') },
      { id: 'new-exp', label: 'touch experience/new', hint: 'New experience', run: () => navigate('/experiences/new') },
      { id: 'publish', label: 'git push origin main', hint: 'Review & publish', run: onPublish },
      { id: 'site', label: 'open alfizdesta.com', hint: 'View live site', run: () => window.open('/', '_blank', 'noopener') },
    ],
    [navigate, onPublish],
  )
}
