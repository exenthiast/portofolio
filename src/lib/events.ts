/**
 * Tiny typed event bus so the terminal (and deep links) can drive other sections
 * without prop-drilling through App.
 */
export interface PortfolioEvents {
  'open-project': { slug: string }
  'open-badge': { id: string }
  'open-certificate': { id?: string }
  'open-cv': undefined
}

type EventName = keyof PortfolioEvents

export function emit<K extends EventName>(name: K, detail: PortfolioEvents[K]): void {
  window.dispatchEvent(new CustomEvent(`portfolio:${name}`, { detail }))
}

export function on<K extends EventName>(name: K, handler: (detail: PortfolioEvents[K]) => void): () => void {
  const listener = (e: Event) => handler((e as CustomEvent<PortfolioEvents[K]>).detail)
  window.addEventListener(`portfolio:${name}`, listener)
  return () => window.removeEventListener(`portfolio:${name}`, listener)
}

export function scrollToSection(id: string): void {
  const el = document.getElementById(id)
  if (!el) return
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
}
