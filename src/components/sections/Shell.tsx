import { lazy, Suspense } from 'react'

const Terminal = lazy(() => import('../terminal/Terminal'))

/** The One Live Thing: an interactive shell over the whole portfolio. */
export function Shell() {
  return (
    <section id="shell" aria-labelledby="shell-heading" className="px-4 sm:px-6 py-16 sm:py-24">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[minmax(0,340px)_1fr] lg:items-center">
        <div className="flex flex-col gap-4">
          <h2 id="shell-heading" className="text-[length:var(--step-head)] font-bold leading-[1.05] tracking-[-0.03em]">
            Prefer a shell?
          </h2>
          <p className="text-[length:var(--step-body)] leading-relaxed text-[var(--ink-secondary)]">
            Every project, badge and journey entry lives in a virtual file system. Type commands, press Tab to
            autocomplete, or just tap the pills.
          </p>
        </div>
        <Suspense fallback={<div className="h-[478px] rounded-2xl bg-[var(--surface-terminal)]" aria-hidden="true" />}>
          <Terminal />
        </Suspense>
      </div>
    </section>
  )
}
