import { useState } from 'react'
import type { Translations } from '../../schemas/content'
import type { Locale } from '../../types/locale'
import { publicCopy } from '../../data/public-copy'
import { preparedTranslations, translationFields, translateText } from '../../data/localization'
import { Btn } from './ui'
import { TextArea } from './Fields'

export function TranslationFields({ document, value = {}, onChange, onLocaleChange }: { document: unknown; value?: Translations; onChange: (value: Translations) => void; onLocaleChange?: (locale: Locale) => void }) {
  const [locale, setLocale] = useState<Locale>('id')
  const fields = translationFields(document)
  return (
    <details className="flex min-w-0 flex-col rounded-xl bg-[var(--bg-subtle)] p-4">
      <summary className="min-h-11 cursor-pointer text-sm font-semibold">{publicCopy.translationsHeading}</summary>
      <div className="mt-4 flex min-w-0 flex-col gap-4">
        <p className="text-sm text-[var(--ink-secondary)]">{publicCopy.translationsHint}</p>
        <div className="flex flex-wrap gap-2">
          <Btn aria-pressed={locale === 'en'} onClick={() => { setLocale('en'); onLocaleChange?.('en') }}>EN</Btn>
          <Btn aria-pressed={locale === 'id'} onClick={() => { setLocale('id'); onLocaleChange?.('id') }}>ID</Btn>
          <Btn onClick={() => onChange(preparedTranslations(document, value))}>{publicCopy.prepareTranslations}</Btn>
        </div>
        {fields.map(({ path, source }) => {
          const entry = value[path]?.source === source ? value[path] : undefined
          return (
            <TextArea key={path} label={`${locale.toUpperCase()} · ${path}`} hint={`${publicCopy.translationSource}: ${source}`} rows={source.length > 150 ? 5 : 2} value={entry?.[locale] ?? translateText(source, locale)} onChange={(text) => {
              const next = { ...entry, source }
              if (text.trim()) next[locale] = text
              else delete next[locale]
              onChange({ ...value, [path]: next })
            }} />
          )
        })}
      </div>
    </details>
  )
}
