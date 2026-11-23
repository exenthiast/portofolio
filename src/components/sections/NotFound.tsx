import { TerminalWindow, Prompt } from '../ui/TerminalWindow'
import { usePublicContent } from '../../hooks/useLocale'

export function NotFound() {
  const { copy } = usePublicContent()
  const path = window.location.pathname
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-4">
      <h1 className="sr-only">{copy.notFound}</h1>
      <TerminalWindow title="alfizdesta — 404 — zsh" className="w-full max-w-xl" bodyClassName="flex flex-col gap-2 p-6 text-[length:var(--step-small)]">
        <Prompt>cd {path}</Prompt>
        <p className="text-[var(--mac-close)]">zsh: no such file or directory: {path}</p>
        <Prompt>
          <a href="/" className="underline underline-offset-4 hover:text-[var(--accent)]">cd ~</a>
          <span aria-hidden="true" className="caret ml-1 inline-block h-4 w-2 translate-y-0.5 bg-[var(--ink-terminal)]" />
        </Prompt>
      </TerminalWindow>
    </main>
  )
}
