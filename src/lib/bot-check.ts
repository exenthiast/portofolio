import type { TurnstileApi } from '../types/public-input'

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined
export const isPublicInputConfigured = Boolean(SITE_KEY)
let loading: Promise<TurnstileApi> | null = null

function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile)
  if (loading) return loading
  loading = new Promise<TurnstileApi>((resolve, reject) => {
    const script = document.createElement('script')
    const timer = window.setTimeout(fail, 15_000)
    function fail() {
      window.clearTimeout(timer)
      script.remove()
      reject(new Error('Verification unavailable'))
    }
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    script.async = true
    script.onerror = fail
    script.onload = () => {
      const api = window.turnstile
      if (!api) return fail()
      api.ready(() => { window.clearTimeout(timer); resolve(api) })
    }
    document.head.append(script)
  }).catch((error: unknown) => { loading = null; throw error })
  return loading
}

/** One-use token. Configure the site key as an Invisible Turnstile widget. */
export async function getBotToken(action: 'contact' | 'analytics'): Promise<string> {
  if (!SITE_KEY) throw new Error('Verification unavailable')
  const api = await loadTurnstile()
  return new Promise<string>((resolve, reject) => {
    const host = document.createElement('div')
    host.setAttribute('aria-hidden', 'true')
    document.body.append(host)
    let id: string | undefined
    let finished = false
    const finish = (token?: string) => {
      if (finished) return
      finished = true
      window.clearTimeout(timer)
      if (id) api.remove(id)
      host.remove()
      if (token) resolve(token)
      else reject(new Error('Verification unavailable'))
    }
    const timer = window.setTimeout(() => finish(), 15_000)
    try {
      id = api.render(host, {
        sitekey: SITE_KEY, size: 'invisible', execution: 'execute', action,
        callback: (token) => finish(token),
        'error-callback': () => finish(), 'expired-callback': () => finish(), 'timeout-callback': () => finish(),
      })
      api.execute(id)
    } catch { finish() }
  })
}
