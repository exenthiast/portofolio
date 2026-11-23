import { FileText } from 'lucide-react'
import { usePublicContent } from '../../hooks/useLocale'
import type { CredentialMediaProps } from '../../types'
import { SmartImage } from '../ui/SmartImage'

export function CredentialMedia({ credential, thumbnail = false }: CredentialMediaProps) {
  const { credentialsCopy } = usePublicContent()
  const certificate = credential.kind === 'certificate'
  if (credential.image?.src) {
    const className = thumbnail
      ? certificate ? 'aspect-[4/3] w-full bg-[var(--bg-subtle)] object-contain' : 'aspect-square w-full max-w-[120px] object-contain'
      : certificate ? 'w-full max-h-[55dvh] object-contain bg-[var(--bg-subtle)]' : 'h-40 w-40 object-contain'
    return <SmartImage key={credential.image.src} image={credential.image} fallbackLabel={credential.issuer || credentialsCopy.detailTitle} className={className} />
  }
  if (!certificate || !credential.pdfUrl) return null

  if (thumbnail) {
    return (
      <div className="aspect-[4/3] w-full flex flex-col items-center justify-center gap-3 bg-[var(--bg-subtle)] text-[var(--ink-secondary)]">
        <FileText aria-hidden="true" className="h-10 w-10" />
        <span className="text-[length:var(--step-small)]">{credentialsCopy.pdfLabel}</span>
      </div>
    )
  }

  return (
    <object data={credential.pdfUrl} type="application/pdf" aria-label={`${credential.title} — ${credentialsCopy.pdfPreview}`} className="h-[55dvh] min-h-80 w-full bg-[var(--bg-subtle)]">
      <p className="p-6 text-[length:var(--step-body)]">
        {credentialsCopy.pdfFallback}{' '}
        <a href={credential.pdfUrl} target="_blank" rel="noopener noreferrer" className="rounded underline underline-offset-4">{credentialsCopy.openPdf}</a>
      </p>
    </object>
  )
}
