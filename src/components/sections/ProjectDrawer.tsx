import { Drawer } from 'vaul'
import { ArrowUpRight, Check, FolderGit2 as Github, Link2, X } from 'lucide-react'
import { useState } from 'react'
import type { Project } from '../../types'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { SmartImage } from '../ui/SmartImage'
import { TerminalWindow, Prompt } from '../ui/TerminalWindow'

interface ProjectDrawerProps {
  project: Project
  onClose: () => void
  /** Render inline (no portal/overlay) — used by the admin live preview. */
  inline?: boolean
}

export function ProjectCaseStudy({ project }: { project: Project }) {
  const [copied, setCopied] = useState(false)

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/#projects/${project.slug}`)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  return (
    <article className="flex flex-col gap-8">
      <header className="flex flex-col gap-3 pr-10">
        <p className="text-[length:var(--step-small)] text-[var(--ink-secondary)]">
          {project.category} · {project.role}
        </p>
        <h2 className="text-[length:var(--step-head)] font-bold leading-[1.05] tracking-[-0.03em]">{project.title}</h2>
        <p className="text-[length:var(--step-body)] leading-relaxed text-[var(--ink-secondary)]">{project.description}</p>
        <div className="flex flex-wrap gap-2 pt-2">
          {project.liveDemoUrl && (
            <a href={project.liveDemoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center gap-2 rounded-full bg-[var(--surface-terminal)] px-4 text-sm font-medium text-white hover:bg-[#1f2029]">
              Live demo <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </a>
          )}
          {project.githubUrl && (
            <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center gap-2 rounded-full bg-[var(--surface-raised)] px-4 text-sm font-medium hover:bg-[var(--bg-subtle)]">
              <Github className="h-4 w-4" aria-hidden="true" /> Repository
            </a>
          )}
          <button type="button" onClick={copyLink} className="inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium text-[var(--ink-secondary)] hover:text-[var(--ink)] cursor-pointer">
            {copied ? <Check className="h-4 w-4 text-[var(--accent)]" aria-hidden="true" /> : <Link2 className="h-4 w-4" aria-hidden="true" />}
            <span aria-live="polite">{copied ? 'Link copied' : 'Copy link'}</span>
          </button>
        </div>
      </header>

      {project.preview && (
        <SmartImage image={project.preview} fallbackLabel={project.title} className="w-full rounded-xl object-cover" />
      )}

      <section aria-labelledby="stack-h" className="flex flex-col gap-3">
        <h3 id="stack-h" className="text-[length:var(--step-lead)] font-semibold tracking-tight">Tech stack</h3>
        <ul className="flex flex-wrap gap-1.5">
          {project.techStack.map((t) => (
            <li key={t} className="rounded-full bg-[var(--surface-raised)] px-3 py-1 text-sm font-medium">{t}</li>
          ))}
        </ul>
      </section>

      {project.architecture && (
        <section aria-labelledby="arch-h" className="flex flex-col gap-3">
          <h3 id="arch-h" className="text-[length:var(--step-lead)] font-semibold tracking-tight">Architecture</h3>
          <TerminalWindow title={`~/projects/${project.slug}/ARCHITECTURE.md`} bodyClassName="p-5 flex flex-col gap-3">
            <Prompt>cat ARCHITECTURE.md</Prompt>
            <p className="text-[length:var(--step-small)] leading-relaxed text-[var(--ink-terminal)]">{project.architecture.overview}</p>
            <ul className="flex flex-col gap-2 text-[length:var(--step-small)] leading-relaxed text-[var(--ink-terminal-muted)]">
              {/* Admin previews may have an overview before the decisions field is filled. */}
              {project.architecture.keyDecisions?.map((d) => (
                <li key={d} className="flex gap-2"><span className="text-[var(--accent)]">→</span><span>{d}</span></li>
              ))}
            </ul>
            {project.architecture.apiEndpoints && project.architecture.apiEndpoints.length > 0 && (
              <pre className="overflow-x-auto rounded-lg bg-[var(--surface-terminal-header)] p-3 text-xs">{project.architecture.apiEndpoints.join('\n')}</pre>
            )}
            {project.architecture.databaseSchema && (
              <pre className="overflow-x-auto rounded-lg bg-[var(--surface-terminal-header)] p-3 text-xs">{project.architecture.databaseSchema}</pre>
            )}
          </TerminalWindow>
        </section>
      )}

      {project.keyFeatures && project.keyFeatures.length > 0 && (
        <section aria-labelledby="feat-h" className="flex flex-col gap-3">
          <h3 id="feat-h" className="text-[length:var(--step-lead)] font-semibold tracking-tight">Key features</h3>
          <ol className="flex flex-col gap-3">
            {project.keyFeatures.map((f, i) => (
              <li key={f} className="flex gap-4 rounded-xl bg-[var(--surface-raised)] p-4 text-[length:var(--step-body)] leading-relaxed">
                <span className="font-semibold tabular-nums text-[var(--ink-secondary)]">{String(i + 1).padStart(2, '0')}</span>
                <span>{f}</span>
              </li>
            ))}
          </ol>
        </section>
      )}
    </article>
  )
}

/** Slide-over from the right on desktop, bottom sheet on mobile (Vaul). Page behind stays put. */
export default function ProjectDrawer({ project, onClose }: ProjectDrawerProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)')

  return (
    <Drawer.Root open onOpenChange={(o) => !o && onClose()} direction={isDesktop ? 'right' : 'bottom'}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-[90] bg-[#09090b]/55" />
        <Drawer.Content
          data-lenis-prevent
          aria-describedby={undefined}
          className={
            isDesktop
              ? 'fixed right-0 top-0 bottom-0 z-[100] flex w-[min(720px,92vw)] flex-col bg-[var(--surface)] shadow-2xl outline-none'
              : 'fixed inset-x-0 bottom-0 z-[100] flex max-h-[92dvh] flex-col rounded-t-2xl bg-[var(--surface)] shadow-2xl outline-none'
          }
        >
          {!isDesktop && <div aria-hidden="true" className="mx-auto mt-3 h-1.5 w-12 shrink-0 rounded-full bg-[var(--surface-raised)]" />}
          <Drawer.Title className="sr-only">{project.title} case study</Drawer.Title>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close case study"
            className="absolute right-4 top-4 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--surface-raised)] cursor-pointer hover:bg-[var(--bg-subtle)]"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
          <div className="overflow-y-auto p-6 sm:p-10">
            <ProjectCaseStudy project={project} />
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
