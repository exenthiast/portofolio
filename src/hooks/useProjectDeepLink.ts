import { useCallback, useEffect, useState } from 'react'
import { projectsData } from '../data/projects'
import { usePublicContent } from './useLocale'
import { on } from '../lib/events'
import { track } from '../lib/analytics'

const PREFIX = '#projects/'

function slugFromHash(): string | null {
  const { hash } = window.location
  if (!hash.startsWith(PREFIX)) return null
  const slug = decodeURIComponent(hash.slice(PREFIX.length))
  return projectsData.some((p) => p.slug === slug) ? slug : null
}

/**
 * Shareable project links: `/#projects/<slug>` opens the drawer without reload.
 * Back button closes the drawer; closing restores `#projects` without adding history.
 */
export function useProjectDeepLink() {
  const { projectsData: localizedProjects } = usePublicContent()
  const [slug, setSlug] = useState<string | null>(() => (typeof window === 'undefined' ? null : slugFromHash()))

  useEffect(() => {
    const sync = () => setSlug(slugFromHash())
    window.addEventListener('hashchange', sync)
    window.addEventListener('popstate', sync)
    return () => {
      window.removeEventListener('hashchange', sync)
      window.removeEventListener('popstate', sync)
    }
  }, [])

  const open = useCallback((next: string) => {
    window.history.pushState({ projectDrawer: true }, '', `${PREFIX}${encodeURIComponent(next)}`)
    setSlug(next)
    track('project_open', next)
  }, [])

  const close = useCallback(() => {
    const state: unknown = window.history.state
    if (state && typeof state === 'object' && 'projectDrawer' in state) {
      window.history.back()
    } else {
      window.history.replaceState(null, '', '#projects')
    }
    setSlug(null)
  }, [])

  useEffect(() => on('open-project', ({ slug: s }) => open(s)), [open])

  // When landing directly on a deep link, bring the section into view.
  useEffect(() => {
    if (slugFromHash()) document.getElementById('projects')?.scrollIntoView({ block: 'start' })
  }, [])

  const project = slug ? (localizedProjects.find((p) => p.slug === slug) ?? null) : null
  return { project, open, close }
}
