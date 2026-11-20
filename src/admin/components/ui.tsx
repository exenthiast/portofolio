import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent'

const variants: Record<Variant, string> = {
  primary: 'bg-[var(--surface-terminal)] text-white hover:bg-[#1f2029]',
  secondary: 'bg-[var(--surface-raised)] text-[var(--ink)] hover:bg-[var(--bg-subtle)]',
  ghost: 'text-[var(--ink-secondary)] hover:text-[var(--ink)] hover:bg-[var(--surface-raised)]',
  danger: 'text-[#b42318] hover:bg-[#fef3f2]',
  accent: 'bg-[var(--accent)] text-[var(--accent-ink)] hover:bg-[#047857]',
}

export function Btn({ variant = 'secondary', className = '', children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; children: ReactNode }) {
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex h-9 items-center justify-center gap-2 rounded-full px-4 text-sm font-medium transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl bg-[var(--surface)] p-5 ${className}`}>{children}</div>
}

export function PageHeader({ title, path, actions }: { title: string; path: string; actions?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="font-mono text-xs text-[var(--ink-secondary)]">
          <span className="text-[var(--accent)]">alfizdesta</span>:{path}$
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  )
}

export function StatusPill({ status }: { status: 'draft' | 'published' }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${status === 'published' ? 'bg-[#ecfdf3] text-[#067647]' : 'bg-[var(--surface-raised)] text-[var(--ink-secondary)]'}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${status === 'published' ? 'bg-[var(--accent)]' : 'bg-[var(--ink-secondary)]'}`} aria-hidden="true" />
      {status}
    </span>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="rounded-2xl bg-[var(--surface)] p-10 text-center text-sm text-[var(--ink-secondary)]">{children}</div>
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-xl bg-[var(--surface-raised)] ${className}`} />
}

export function ErrorNote({ error }: { error: string }) {
  return (
    <div role="alert" data-ui="terminal" className="rounded-xl bg-[var(--surface-terminal)] p-4 font-mono text-sm text-[var(--mac-close)]">
      ✗ {error}
    </div>
  )
}
