import type { z } from 'zod'
import type { analyticsNameSchema } from '../schemas/public-input'

export type AnalyticsEvent = z.infer<typeof analyticsNameSchema>

export interface TurnstileApi {
  ready(callback: () => void): void
  render(container: HTMLElement, options: {
    sitekey: string
    size: 'invisible'
    execution: 'execute'
    action: 'contact' | 'analytics'
    callback: (token: string) => void
    'error-callback': () => void
    'expired-callback': () => void
    'timeout-callback': () => void
  }): string
  execute(id: string): void
  remove(id: string): void
}

declare global {
  interface Window { turnstile?: TurnstileApi }
}
