import { ArrowUpRight } from 'lucide-react'
import { usePublicContent } from '../../hooks/useLocale'
import type { Credential } from '../../types'
import { CredentialMedia } from './CredentialMedia'

export function CredentialDetail({ credential }: { credential: Credential }) {
  const { credentialsCopy } = usePublicContent()
  const certificate = credential.kind === 'certificate'
  const verificationUrl = certificate ? credential.verificationUrl : credential.credlyUrl

  return (
    <div className={`mt-6 grid gap-6 ${certificate ? '' : 'sm:grid-cols-[160px_minmax(0,1fr)]'}`}>
      <CredentialMedia credential={credential} />
      <div className="min-w-0 flex flex-col gap-5">
        {credential.description && <p className="text-[length:var(--step-body)] leading-relaxed text-[var(--ink)]">{credential.description}</p>}
        <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-6 gap-y-2 text-[length:var(--step-small)]">
          {credentialsCopy.metadata.map(({ key, label }) => {
            const value = key === 'expiryDate' ? credential[key] || credentialsCopy.noExpiry : credential[key]
            return value ? (
              <div key={key} className="contents">
                <dt className="text-[var(--ink-secondary)]">{label}</dt>
                <dd className="font-medium break-words">{value}</dd>
              </div>
            ) : null
          })}
        </dl>
        {(credential.skills?.length ?? 0) > 0 && (
          <ul className="flex flex-wrap gap-2" aria-label={credentialsCopy.skillsLabel}>
            {credential.skills.map((skill) => <li key={skill} className="rounded-full bg-[var(--bg-subtle)] px-3 py-1 text-[length:var(--step-small)]">{skill}</li>)}
          </ul>
        )}
        <div className="flex flex-wrap gap-3">
          {certificate && credential.pdfUrl && (
            <a href={credential.pdfUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[var(--ink)] px-5 text-[length:var(--step-small)] font-medium text-[var(--surface)]">
              {credentialsCopy.openPdf} <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </a>
          )}
          {verificationUrl && (
            <a href={verificationUrl} target="_blank" rel="noopener noreferrer" className={`inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-[length:var(--step-small)] font-medium ${certificate ? 'bg-[var(--bg-subtle)] text-[var(--ink)] hover:bg-[var(--surface-raised)]' : 'bg-[var(--ink)] text-[var(--surface)]'}`}>
              {certificate ? credentialsCopy.verifyCertificate : credentialsCopy.verifyBadge} <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
