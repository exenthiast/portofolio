import { useEffect, useState, type ReactNode } from 'react'
import { TrafficLightDots } from './TrafficLightDots'

interface TerminalWindowProps {
  title: string
  children: ReactNode
  /** Show a live HH:MM:SS clock (Asia/Jakarta) in the header. */
  showClock?: boolean
  headerRight?: ReactNode
  className?: string
  bodyClassName?: string
  onClose?: () => void
}

function LiveClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [])
  return (
    <time dateTime={now.toISOString()} className="tabular-nums">
      {now.toLocaleTimeString('en-GB', { timeZone: 'Asia/Jakarta' })} WIB
    </time>
  )
}

/** macOS terminal frame — the only place monospace is allowed (data-ui="terminal"). */
export function TerminalWindow({
  title,
  children,
  showClock = false,
  headerRight,
  className = '',
  bodyClassName = '',
  onClose,
}: TerminalWindowProps) {
  return (
    <div
      data-ui="terminal"
      className={`rounded-2xl overflow-hidden bg-[var(--surface-terminal)] text-[var(--ink-terminal)] font-mono ${className}`}
    >
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 h-10 bg-[var(--surface-terminal-header)] text-[length:var(--step-small)] text-[var(--ink-terminal-muted)]">
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close window"
            className="justify-self-start rounded p-1 -m-1 cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
          >
            <TrafficLightDots size="md" />
          </button>
        ) : (
          <TrafficLightDots size="md" className="justify-self-start" />
        )}
        <span className="truncate text-center">{title}</span>
        <span className="justify-self-end truncate">{headerRight ?? (showClock ? <LiveClock /> : null)}</span>
      </div>
      <div className={bodyClassName}>{children}</div>
    </div>
  )
}

/** `alfizdesta:~$ <command>` prompt line. */
export function Prompt({ children, cwd = '~' }: { children?: ReactNode; cwd?: string }) {
  return (
    <p className="text-[length:var(--step-small)] leading-relaxed break-words">
      <span className="text-[var(--accent)]">alfizdesta</span>
      <span className="text-[var(--ink-terminal-muted)]">:{cwd}$ </span>
      <span className="text-[var(--ink-terminal)]">{children}</span>
    </p>
  )
}
