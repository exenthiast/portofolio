import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import { usePublicContent } from '../../hooks/useLocale'
import { on } from '../../lib/events'
import { track } from '../../lib/analytics'
import { Modal } from '../ui/Modal'
import { CredentialDetail } from './CredentialDetail'
import { CredentialMedia } from './CredentialMedia'
import type { Badge, Credential, CredentialKind } from '../../types'

export function BadgeDetail({ badge }: { badge: Badge }) {
  return <CredentialDetail credential={badge} />
}

export function Badges() {
  const { badgesData, certificatesData, credentialTabs, credentialsCopy } = usePublicContent()
  const [active, setActive] = useState<CredentialKind>('badge')
  const [selected, setSelected] = useState<Credential | null>(null)
  const reduce = useReducedMotion()
  const baseId = useId()
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const items = active === 'badge' ? badgesData : certificatesData
  const counts = { badge: badgesData.length, certificate: certificatesData.length }
  const selectedCredential = selected ? [...badgesData, ...certificatesData].find((item) => item.id === selected.id) ?? selected : null

  const open = (credential: Credential) => {
    setSelected(credential)
    if (credential.kind !== 'certificate') track('badge_open', credential.id)
  }

  useEffect(() => {
    const offBadge = on('open-badge', ({ id }) => {
      const badge = badgesData.find((item) => item.id === id)
      if (badge) { setActive('badge'); setSelected(badge) }
    })
    const offCertificate = on('open-certificate', ({ id }) => {
      setActive('certificate')
      const certificate = certificatesData.find((item) => item.id === id)
      if (certificate) setSelected(certificate)
    })
    return () => { offBadge(); offCertificate() }
  }, [badgesData, certificatesData])

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = credentialTabs.findIndex((tab) => tab.id === active)
    let next = index
    if (event.key === 'ArrowRight') next = (index + 1) % credentialTabs.length
    else if (event.key === 'ArrowLeft') next = (index - 1 + credentialTabs.length) % credentialTabs.length
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = credentialTabs.length - 1
    else return
    event.preventDefault()
    setActive(credentialTabs[next].id)
    tabRefs.current[next]?.focus()
  }

  return (
    <section id="badges" aria-labelledby="badges-heading" className="px-4 sm:px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <h2 id="badges-heading" className="text-[length:var(--step-head)] font-bold leading-[1.15] tracking-[-0.03em]">
            {credentialsCopy.heading}
          </h2>
          <a href={credentialsCopy.credlyUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 self-start rounded text-[length:var(--step-body)] font-medium hover:text-[var(--accent)]">
            {credentialsCopy.credlyLabel} <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>

        <div role="tablist" aria-label={credentialsCopy.tabsLabel} onKeyDown={onKeyDown} className="mb-8 inline-flex max-w-full rounded-full bg-[var(--bg-subtle)] p-1">
          {credentialTabs.map((tab, index) => (
            <button
              key={tab.id}
              ref={(element) => { tabRefs.current[index] = element }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${tab.id}`}
              aria-controls={`${baseId}-panel`}
              aria-selected={active === tab.id}
              tabIndex={active === tab.id ? 0 : -1}
              onClick={() => setActive(tab.id)}
              className={`min-h-11 rounded-full px-4 text-[length:var(--step-small)] font-medium cursor-pointer transition-colors ${active === tab.id ? 'bg-[var(--ink)] text-[var(--surface)]' : 'text-[var(--ink-secondary)] hover:text-[var(--ink)]'}`}
            >
              {tab.label} <span className="ml-1 tabular-nums">{counts[tab.id]}</span>
            </button>
          ))}
        </div>

        <div role="tabpanel" id={`${baseId}-panel`} aria-labelledby={`${baseId}-tab-${active}`} tabIndex={0} className="rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]">
          {items.length === 0 ? (
            <p className="bg-[var(--bg-subtle)] px-6 py-10 text-[length:var(--step-body)] text-[var(--ink-secondary)]">
              {active === 'badge' ? credentialsCopy.emptyBadges : credentialsCopy.emptyCertificates}
            </p>
          ) : (
            <ul key={active} className={`grid gap-4 ${active === 'badge' ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
              {items.map((credential, index) => (
                <motion.li
                  key={credential.id}
                  initial={reduce ? false : { opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.3, delay: (index % 5) * 0.04 }}
                >
                  <button type="button" onClick={() => open(credential)} className={`group flex h-full w-full flex-col gap-4 bg-[var(--surface)] p-4 transition-colors hover:bg-[var(--surface-raised)] cursor-pointer ${active === 'badge' ? 'items-center text-center rounded-2xl' : 'items-start text-left'}`}>
                    <CredentialMedia credential={credential} thumbnail />
                    <span className="text-[length:var(--step-body)] font-semibold leading-snug line-clamp-2">{credential.title}</span>
                    <span className="mt-auto text-[length:var(--step-small)] text-[var(--ink-secondary)]">{credential.issuer} · {credential.issueDate}</span>
                  </button>
                </motion.li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <Modal open={selectedCredential !== null} onOpenChange={(isOpen) => !isOpen && setSelected(null)} title={selectedCredential?.title ?? credentialsCopy.detailTitle} className={`${selectedCredential?.kind === 'certificate' ? 'max-w-4xl' : 'max-w-2xl'} p-6 sm:p-8`}>
        {selectedCredential && <CredentialDetail credential={selectedCredential} />}
      </Modal>
    </section>
  )
}
