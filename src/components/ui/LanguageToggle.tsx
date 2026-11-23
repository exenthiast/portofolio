import { useLocale, usePublicContent } from '../../hooks/useLocale'

export function LanguageToggle() {
  const { locale, toggleLocale } = useLocale()
  const { copy } = usePublicContent()
  return (
    <button type="button" onClick={toggleLocale} aria-label={locale === 'en' ? copy.switchToIndonesian : copy.switchToEnglish} className="inline-flex min-h-11 min-w-16 shrink-0 items-center justify-center gap-1 rounded-full bg-[var(--bg-subtle)] px-3 text-sm font-medium text-[var(--ink)] cursor-pointer hover:bg-[var(--surface-raised)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]">
      <span lang="en" className={locale === 'en' ? 'font-bold' : 'text-[var(--ink-secondary)]'}>EN</span>
      <span aria-hidden="true" className="text-[var(--ink-secondary)]">/</span>
      <span lang="id" className={locale === 'id' ? 'font-bold' : 'text-[var(--ink-secondary)]'}>ID</span>
    </button>
  )
}
