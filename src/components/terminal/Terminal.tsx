import { useEffect, useRef, type KeyboardEvent } from 'react'
import { useTerminal } from '../../hooks/useTerminal'
import { TerminalWindow } from '../ui/TerminalWindow'
import type { OutputLine } from '../../types'

const toneClass = {
  default: 'text-[var(--ink-terminal)]',
  muted: 'text-[var(--ink-terminal-muted)]',
  accent: 'text-[var(--accent)]',
  error: 'text-[var(--mac-close)]',
} as const

const PILLS = ['help', 'ls -l', 'cat about.md', 'ls projects', 'whoami --stats', 'neofetch', 'tail -f experience.log', 'contact', 'clear']

function Line({ line, onRun }: { line: OutputLine; onRun: (cmd: string) => void }) {
  return (
    <div className="min-h-[1.5em] whitespace-pre-wrap break-words">
      {line.map((seg, i) => {
        if (seg.kind === 'command')
          return (
            <button key={i} type="button" onClick={() => onRun(seg.command)} className="rounded bg-[var(--surface-terminal-header)] px-1.5 text-[var(--ink-terminal)] underline-offset-2 hover:text-[var(--accent)] hover:underline cursor-pointer">
              {seg.text}
            </button>
          )
        if (seg.kind === 'link')
          return (
            <a key={i} href={seg.href} target={seg.href.startsWith('mailto:') ? undefined : '_blank'} rel="noopener noreferrer" className="text-[var(--ink-terminal)] underline underline-offset-2 hover:text-[var(--accent)]">
              {seg.text}
            </a>
          )
        return <span key={i} className={toneClass[seg.tone ?? 'default']}>{seg.text}</span>
      })}
    </div>
  )
}

export default function Terminal() {
  const { items, input, setInput, run, historyUp, historyDown, tab, clear, cwd } = useTerminal()
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [items])

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') run(input)
    else if (e.key === 'ArrowUp') { e.preventDefault(); historyUp() }
    else if (e.key === 'ArrowDown') { e.preventDefault(); historyDown() }
    else if (e.key === 'Tab') { e.preventDefault(); tab() }
    else if (e.key.toLowerCase() === 'l' && e.ctrlKey) { e.preventDefault(); clear() }
    else if (e.key.toLowerCase() === 'c' && e.ctrlKey) { e.preventDefault(); setInput('') }
  }

  const runPill = (cmd: string) => {
    run(cmd)
    inputRef.current?.focus({ preventScroll: true })
  }

  return (
    <TerminalWindow title="alfizdesta — ~ — zsh" headerRight={<span className="hidden sm:inline">{cwd}</span>}>
      {/* Click anywhere in the body to focus the prompt, like a real terminal. */}
      <div
        ref={scrollRef}
        data-lenis-prevent
        onClick={() => window.getSelection()?.toString() || inputRef.current?.focus({ preventScroll: true })}
        className="h-[420px] overflow-y-auto p-4 sm:p-6 text-[13px] leading-relaxed sm:text-sm"
        role="log"
        aria-live="polite"
        aria-label="Terminal output"
      >
        {items.map((item) => (
          <div key={item.id} className="mb-2">
            {item.command !== 'neofetch --short' && (
              <div className="whitespace-pre-wrap break-words">
                <span className="text-[var(--accent)]">alfizdesta</span>
                <span className="text-[var(--ink-terminal-muted)]">:{item.cwd}$ </span>
                <span>{item.command}</span>
              </div>
            )}
            {item.result.lines.map((line, i) => <Line key={i} line={line} onRun={runPill} />)}
          </div>
        ))}
        <label className="flex items-baseline">
          <span className="sr-only">Terminal command</span>
          <span aria-hidden="true" className="shrink-0">
            <span className="text-[var(--accent)]">alfizdesta</span>
            <span className="text-[var(--ink-terminal-muted)]">:{cwd}$&nbsp;</span>
          </span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="go"
            className="min-w-0 flex-1 bg-transparent text-[var(--ink-terminal)] caret-[var(--accent)] outline-none focus-visible:outline-none"
          />
        </label>
      </div>
      <div className="flex gap-2 overflow-x-auto bg-[var(--surface-terminal-header)] px-4 py-3" aria-label="Quick commands">
        {PILLS.map((p) => (
          <button key={p} type="button" onClick={() => runPill(p)} className="shrink-0 rounded-full bg-[var(--surface-terminal)] px-3 py-1.5 text-xs text-[var(--ink-terminal)] hover:text-[var(--accent)] cursor-pointer">
            {p}
          </button>
        ))}
      </div>
    </TerminalWindow>
  )
}
