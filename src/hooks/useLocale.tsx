import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Locale } from '../types/locale'
import { localeStorageKey, parseLocale } from '../data/localization'
import { getPublicContent } from '../data/public-content'

const LocaleContext = createContext<{ locale: Locale; toggleLocale: () => void; content: ReturnType<typeof getPublicContent> }>({ locale: 'en', toggleLocale: () => undefined, content: getPublicContent('en') })

function savedLocale(): Locale {
  if (typeof window === 'undefined') return 'en'
  try { return parseLocale(window.localStorage.getItem(localeStorageKey)) } catch { return 'en' }
}

export function LocaleProvider({ children, initialLocale }: { children: ReactNode; initialLocale?: Locale }) {
  const [locale, setLocale] = useState<Locale>(() => initialLocale ?? savedLocale())
  useEffect(() => {
    if (initialLocale) return // An embedded admin/test preview must not change the surrounding page.
    document.documentElement.lang = locale
    try { window.localStorage.setItem(localeStorageKey, locale) } catch { /* Preference still works in memory. */ }
  }, [locale, initialLocale])
  const value = useMemo(() => ({ locale, toggleLocale: () => setLocale((current) => current === 'en' ? 'id' : 'en'), content: getPublicContent(locale) }), [locale])
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

// oxlint-disable-next-line react/only-export-components
export function useLocale() { return useContext(LocaleContext) }

// oxlint-disable-next-line react/only-export-components
export function usePublicContent() {
  return useContext(LocaleContext).content
}
