import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { content as bundled } from '../../data/content'
import { diffContent, type Change } from './diff'
import { repo, type PublishEntry } from './repo'
import type { Content } from '../../schemas/content'

interface PendingState {
  changes: Change[]
  /** What is live: last publish snapshot, or the snapshot bundled in this build. */
  live: Content
  next: Content | null
  lastPublish: PublishEntry | null
  loading: boolean
  refresh: () => Promise<void>
}

const PendingContext = createContext<PendingState | null>(null)

export function PendingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Omit<PendingState, 'refresh'>>({ changes: [], live: bundled, next: null, lastPublish: null, loading: true })

  const refresh = useCallback(async () => {
    try {
      const [next, lastPublish] = await Promise.all([repo.currentPublished(), repo.lastPublish()])
      const live = lastPublish?.snapshot ?? bundled
      setState({ changes: next ? diffContent(live, next) : [], live, next, lastPublish, loading: false })
    } catch {
      setState((s) => ({ ...s, loading: false }))
    }
  }, [])

  useEffect(() => {
    // Sync with an external system (Supabase); state is only set after the request resolves.
    // oxlint-disable-next-line react/set-state-in-effect
    void refresh()
  }, [refresh])

  const value = useMemo(() => ({ ...state, refresh }), [state, refresh])
  return <PendingContext.Provider value={value}>{children}</PendingContext.Provider>
}

// eslint-disable-next-line react/only-export-components
export function usePending(): PendingState {
  const ctx = useContext(PendingContext)
  if (!ctx) throw new Error('usePending must be used inside <PendingProvider>')
  return ctx
}
