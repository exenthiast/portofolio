import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { usePublicContent } from '../../hooks/useLocale'

interface ModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
  /** Visually hide the title (still announced to screen readers). */
  hideTitle?: boolean
  className?: string
}

/** Centered dialog. The only resting-state shadow is allowed here because it physically floats. */
export function Modal({ open, onOpenChange, title, description, children, hideTitle, className = '' }: ModalProps) {
  const { copy } = usePublicContent()
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[90] bg-[#09090b]/55 data-[state=open]:animate-[fade-in_200ms_ease-out]" />
        <Dialog.Content
          data-lenis-prevent
          className={`fixed z-[100] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100vw-2rem)] max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl bg-[var(--surface)] shadow-2xl focus:outline-none data-[state=open]:animate-[pop-in_220ms_cubic-bezier(0.16,1,0.3,1)] ${className}`}
        >
          <Dialog.Title className={hideTitle ? 'sr-only' : 'pr-10 text-[length:var(--step-lead)] font-semibold tracking-tight line-clamp-2'}>
            {title}
          </Dialog.Title>
          {description ? (
            <Dialog.Description className="sr-only">{description}</Dialog.Description>
          ) : (
            <Dialog.Description className="sr-only">{title}</Dialog.Description>
          )}
          {children}
          <Dialog.Close
            aria-label={copy.close}
            className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--surface-raised)] text-[var(--ink)] cursor-pointer hover:bg-[var(--bg-subtle)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
