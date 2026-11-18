import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'

type AuthState =
  | { status: 'loading' }
  | { status: 'signed-out' }
  | { status: 'denied'; email: string }
  | { status: 'admin'; session: Session; email: string }

interface AuthContextValue {
  state: AuthState
  signIn: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: supabase ? 'loading' : 'signed-out' })

  const evaluate = useCallback(async (session: Session | null) => {
    if (!supabase || !session) return setState({ status: 'signed-out' })
    const email = session.user.email ?? 'unknown'
    // The allowlist lives in Postgres; RLS enforces it again on every query.
    const { data, error } = await supabase.rpc('is_admin')
    setState(!error && data === true ? { status: 'admin', session, email } : { status: 'denied', email })
  }, [])

  useEffect(() => {
    if (!supabase) return
    void supabase.auth.getSession().then(({ data }) => evaluate(data.session))
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') void evaluate(session)
      if (event === 'TOKEN_REFRESHED' && session)
        setState((prev) => (prev.status === 'admin' ? { ...prev, session } : prev))
    })
    return () => data.subscription.unsubscribe()
  }, [evaluate])

  const signIn = useCallback(async () => {
    if (!supabase) return
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/admin`, queryParams: { prompt: 'select_account' } },
    })
  }, [])

  const signOut = useCallback(async () => {
    await supabase?.auth.signOut()
    setState({ status: 'signed-out' })
  }, [])

  const value = useMemo(() => ({ state, signIn, signOut }), [state, signIn, signOut])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

/** Access token for calling our own /api functions. */
// eslint-disable-next-line react/only-export-components
export function useAccessToken(): string | null {
  const { state } = useAuth()
  return state.status === 'admin' ? state.session.access_token : null
}
