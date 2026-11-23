import { useState, type FormEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Mail } from 'lucide-react'
import { usePublicContent } from '../../hooks/useLocale'
import { track } from '../../lib/analytics'
import { getBotToken, isPublicInputConfigured } from '../../lib/bot-check'
import { TerminalWindow, Prompt } from '../ui/TerminalWindow'

type SendState = 'idle' | 'sending' | 'sent' | 'error'

function MessageForm() {
  const { contactFormContent, copy } = usePublicContent()
  const [state, setState] = useState<SendState>('idle')
  const [errorMessage, setErrorMessage] = useState<'error' | 'verification' | 'limited'>('error')

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const element = e.currentTarget
    const form = new FormData(element)
    // Honeypot: real people never see or fill this field.
    if (String(form.get('website') ?? '')) return setState('sent')
    setState('sending')
    setErrorMessage('error')
    let botToken: string
    try { botToken = await getBotToken('contact') }
    catch { setErrorMessage('verification'); setState('error'); return }
    try {
      const response = await fetch('/api/contact', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: String(form.get('name') ?? ''), email: String(form.get('email') ?? ''), body: String(form.get('body') ?? ''), botToken }),
      })
      if (!response.ok) {
        if (response.status === 429) setErrorMessage('limited')
        setState('error')
        return
      }
      const receipt: unknown = await response.json()
      if (!receipt || typeof receipt !== 'object' || !('ok' in receipt) || receipt.ok !== true) throw new Error('Message not accepted')
      element.reset()
      setState('sent')
    } catch { setState('error') }
  }

  const field = 'w-full rounded-lg bg-[var(--surface-terminal-header)] px-3 py-2.5 text-[var(--ink-terminal)] placeholder:text-[var(--ink-terminal-muted)]/60 outline-none focus-visible:outline-2 focus-visible:outline-[var(--accent)]'

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <Prompt>./send-message</Prompt>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-xs text-[var(--ink-terminal-muted)]">
          --name
          <input name="name" required maxLength={120} autoComplete="name" className={field} placeholder={copy.namePlaceholder} />
        </label>
        <label className="flex flex-col gap-1.5 text-xs text-[var(--ink-terminal-muted)]">
          --email
          <input name="email" type="email" required maxLength={200} autoComplete="email" className={field} placeholder={copy.emailPlaceholder} />
        </label>
      </div>
      <label className="flex flex-col gap-1.5 text-xs text-[var(--ink-terminal-muted)]">
        --body
        <textarea name="body" required minLength={10} maxLength={4000} rows={4} className={`${field} resize-y`} placeholder={copy.messagePlaceholder} />
      </label>
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
      <div className="flex items-center gap-4">
        <button type="submit" disabled={state === 'sending'} className="h-10 shrink-0 whitespace-nowrap rounded-full bg-[var(--accent)] px-5 text-sm font-medium text-[var(--accent-ink)] cursor-pointer disabled:opacity-60">
          {state === 'sending' ? contactFormContent.sending : contactFormContent.send}
        </button>
        <span aria-live="polite" className="text-xs">
          {state === 'sent' && <span className="text-[var(--accent)]">{contactFormContent.sent}</span>}
          {state === 'error' && <span className="text-[var(--mac-close)]">{contactFormContent[errorMessage]}</span>}
        </span>
      </div>
      <p className="text-xs text-[var(--ink-terminal-muted)]">
        {contactFormContent.privacy}{' '}
        <a href={contactFormContent.privacyLink.href} target="_blank" rel="noopener noreferrer" className="underline">{contactFormContent.privacyLink.label}</a>{' · '}
        <a href={contactFormContent.termsLink.href} target="_blank" rel="noopener noreferrer" className="underline">{contactFormContent.termsLink.label}</a>
      </p>
    </form>
  )
}

export function Contact() {
  const { profileData, copy } = usePublicContent()
  const [copied, setCopied] = useState(false)

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(profileData.email)
      setCopied(true)
      track('contact_copy_email')
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      window.location.href = `mailto:${profileData.email}`
    }
  }

  return (
    <section id="contact" aria-labelledby="contact-heading" className="px-4 sm:px-6 py-24 sm:py-32">
      <div className="mx-auto flex max-w-4xl flex-col gap-10">
        <h2 id="contact-heading" className="text-center text-[length:var(--step-head)] font-bold leading-[1.05] tracking-[-0.03em]">
          {copy.contactHeading}
        </h2>
        <TerminalWindow title="alfizdesta — ~/contact — zsh" bodyClassName="flex flex-col gap-6 p-5 sm:p-8 text-[length:var(--step-small)]">
          <Prompt>./contact</Prompt>
          <div className="flex flex-col gap-3">
            <p className="text-[var(--ink-terminal-muted)]">email:</p>
            <motion.button
              type="button"
              onClick={copyEmail}
              whileHover={{ x: 4 }}
              className="w-fit text-left text-[clamp(1.1rem,0.8rem+1.6vw,2rem)] font-semibold text-white underline decoration-[var(--accent)] decoration-2 underline-offset-8 cursor-copy"
              aria-label={`${copy.copyEmail} ${profileData.email}`}
            >
              {profileData.email}
            </motion.button>
            <div className="flex flex-wrap items-center gap-4">
              <a href={`mailto:${profileData.email}`} className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 font-sans text-sm font-medium text-[var(--ink)] hover:bg-[var(--surface-raised)]">
                <Mail className="h-4 w-4" aria-hidden="true" /> {copy.emailApp}
              </a>
              <span className="text-[var(--ink-terminal-muted)]" aria-live="polite">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span key={copied ? 'c' : 'i'} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}>
                    {copied ? <span className="text-[var(--accent)]">{copy.copySuccess}</span> : copy.copyHint}
                  </motion.span>
                </AnimatePresence>
              </span>
            </div>
          </div>
          <ul className="flex flex-col gap-2">
            {profileData.socialLinkList.map((s) => (
              <li key={s.name} className="flex gap-4">
                <span className="w-24 shrink-0 text-[var(--ink-terminal-muted)]">{s.name.toLowerCase()}:</span>
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-[var(--ink-terminal)] hover:text-[var(--accent)] hover:underline underline-offset-4">
                  {s.handle ?? s.url}
                </a>
              </li>
            ))}
          </ul>
          {isPublicInputConfigured && <MessageForm />}
          <Prompt>exit</Prompt>
        </TerminalWindow>
      </div>
    </section>
  )
}
