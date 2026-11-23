import { lazy, Suspense } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowUpRight, FolderGit2 as Github } from 'lucide-react'
import { usePublicContent } from '../../hooks/useLocale'
import { useProjectDeepLink } from '../../hooks/useProjectDeepLink'
import { springPhysics } from '../../lib/motion'
import { SmartImage } from '../ui/SmartImage'
import type { Project } from '../../types'

const ProjectDrawer = lazy(() => import('./ProjectDrawer'))

// Deterministic "dealt card" offsets — cards start stacked on the right and scatter into place.
const scatter = [
  { x: 120, y: -60, rotate: 6 },
  { x: 60, y: -140, rotate: -4 },
  { x: 160, y: -220, rotate: 3 },
  { x: 80, y: -300, rotate: -5 },
]

function ProjectCard({ project, index, onOpen }: { project: Project; index: number; onOpen: (slug: string) => void }) {
  const { copy } = usePublicContent()
  const reduce = useReducedMotion()
  const from = scatter[index % scatter.length]

  return (
    <motion.li
      initial={reduce ? false : { opacity: 0, ...from }}
      whileInView={{ opacity: 1, x: 0, y: 0, rotate: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={reduce ? { duration: 0 } : { ...springPhysics.morph, delay: index * 0.08 }}
      className="group relative rounded-2xl bg-[var(--surface)] transition-colors hover:bg-[var(--surface-raised)]"
    >
      <div className="grid gap-6 p-5 sm:p-7 md:grid-cols-[1fr_minmax(0,320px)] md:gap-10">
        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex items-baseline gap-4">
            <span className="text-[length:var(--step-small)] font-semibold tabular-nums text-[var(--ink-secondary)]">
              {String(index + 1).padStart(2, '0')}
            </span>
            <h3 className="text-[length:var(--step-lead)] font-semibold leading-tight tracking-tight">
              {/* The title button stretches over the whole card (accessible click target). */}
              <button
                type="button"
                onClick={() => onOpen(project.slug)}
                className="text-left cursor-pointer after:absolute after:inset-0 after:rounded-2xl after:content-[''] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-[var(--accent)]"
              >
                {project.title}
              </button>
            </h3>
          </div>
          <p className="text-[length:var(--step-small)] text-[var(--ink-secondary)]">
            {copy.webApp} · {project.role} · {project.category}
          </p>
          <p className="text-[length:var(--step-body)] leading-relaxed text-[var(--ink)] line-clamp-3">{project.description}</p>
          <ul className="flex flex-wrap gap-1.5" aria-label={copy.stack}>
            {project.techStack.map((t) => (
              <li key={t} className="rounded-full bg-[var(--bg-subtle)] px-2.5 py-1 text-xs font-medium text-[var(--ink-secondary)] group-hover:bg-[var(--surface)]">
                {t}
              </li>
            ))}
          </ul>
          <div className="relative z-10 mt-auto flex flex-wrap gap-4 pt-2 text-[length:var(--step-small)] font-medium">
            {project.githubUrl && (
              <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded hover:text-[var(--accent)]">
                <Github className="h-4 w-4" aria-hidden="true" /> {copy.repository}
              </a>
            )}
            {project.liveDemoUrl && (
              <a href={project.liveDemoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded hover:text-[var(--accent)]">
                {copy.demo} <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </a>
            )}
            <span className="ml-auto hidden text-[var(--ink-secondary)] sm:inline">{copy.caseStudy}</span>
          </div>
        </div>
        {project.preview && (
          <SmartImage
            image={project.preview}
            fallbackLabel={project.title}
            className="w-full rounded-xl object-cover transition-transform duration-300 group-hover:-translate-y-1"
          />
        )}
      </div>
    </motion.li>
  )
}

export function Projects() {
  const { projectsData, copy } = usePublicContent()
  const { project, open, close } = useProjectDeepLink()

  return (
    <section id="projects" aria-labelledby="projects-heading" className="px-4 sm:px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 flex flex-col gap-4 sm:mb-16 md:flex-row md:items-end md:justify-between">
          <h2 id="projects-heading" className="max-w-2xl text-[length:var(--step-head)] font-bold leading-[1.05] tracking-[-0.03em]">
            {copy.projectsHeading}
          </h2>
          <p className="max-w-md text-[length:var(--step-body)] text-[var(--ink-secondary)]">
            {copy.projectsIntro}
          </p>
        </div>
        <ol className="flex flex-col gap-4">
          {projectsData.map((p, i) => (
            <ProjectCard key={p.id} project={p} index={i} onOpen={open} />
          ))}
        </ol>
      </div>
      <Suspense fallback={null}>{project && <ProjectDrawer project={project} onClose={close} />}</Suspense>
    </section>
  )
}
