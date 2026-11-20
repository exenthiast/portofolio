import { motion } from 'framer-motion'
import { TerminalWindow, Prompt } from '../../components/ui/TerminalWindow'
import { useAuth } from '../lib/auth'

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.7z" />
      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.3a12 12 0 0 0 0 10.8l4-3.1z" />
      <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9z" />
    </svg>
  )
}

export function Login() {
  const { state, signIn, signOut } = useAuth()
  const denied = state.status === 'denied'

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[var(--bg)] px-4">
      <h1 className="sr-only">Admin sign in</h1>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 140, damping: 24 }} className="w-full max-w-lg">
        <TerminalWindow title="alfizdesta — ~/admin — zsh" showClock bodyClassName="flex flex-col gap-3 p-6 sm:p-8 text-[var(--step-small)]">
          <Prompt>sudo login --provider google</Prompt>
          {state.status === 'loading' && <p className="text-[var(--ink-terminal-muted)]">checking session…</p>}
          {denied ? (
            <>
              <p className="text-[var(--ink-terminal-muted)]">[sudo] authenticated as {state.email}</p>
              <p className="text-[var(--mac-close)]">{state.email.split('@')[0]} is not in the sudoers file. This incident will be reported.</p>
              <div className="pt-2">
                <button type="button" onClick={() => void signOut()} className="h-10 rounded-full bg-white px-4 font-sans text-sm font-medium text-[var(--ink)] cursor-pointer">
                  Try another account
                </button>
              </div>
            </>
          ) : (
            state.status === 'signed-out' && (
              <>
                <p className="text-[var(--ink-terminal-muted)]">Password: <span className="text-[var(--ink-terminal)]">use your Google account instead</span></p>
                <div className="pt-3">
                  <button type="button" onClick={() => void signIn()} className="inline-flex h-11 items-center gap-3 rounded-full bg-white px-5 font-sans text-sm font-semibold text-[var(--ink)] hover:bg-[var(--surface-raised)] cursor-pointer">
                    <GoogleMark /> Continue with Google
                  </button>
                </div>
                <p className="pt-2 text-xs text-[var(--ink-terminal-muted)]">Only allow-listed accounts get a shell. Everyone else bounces.</p>
              </>
            )
          )}
          <p className="pt-2"><a href="/" className="text-[var(--ink-terminal-muted)] underline underline-offset-4 hover:text-[var(--accent)]">cd ~ (back to portfolio)</a></p>
        </TerminalWindow>
      </motion.div>
    </main>
  )
}

export function SetupGuide() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[var(--bg)] px-4 py-10">
      <h1 className="sr-only">Admin setup required</h1>
      <TerminalWindow title="~/admin/SETUP.md" className="w-full max-w-2xl" bodyClassName="flex flex-col gap-3 p-6 text-[var(--step-small)] leading-relaxed">
        <Prompt>cat SETUP.md</Prompt>
        <p className="text-[var(--mac-close)]">Supabase is not configured for this build.</p>
        <ol className="list-decimal space-y-1 pl-5 text-[var(--ink-terminal)]">
          <li>Create a Supabase project and run <code>supabase/migrations/*.sql</code> then <code>supabase/seed.sql</code>.</li>
          <li>Add your email: <code>insert into admins values ('you@gmail.com');</code></li>
          <li>Enable the Google provider (Auth → Providers) with an OAuth client from Google Cloud Console.</li>
          <li>Set <code>VITE_SUPABASE_URL</code> + <code>VITE_SUPABASE_ANON_KEY</code> (see <code>.env.example</code>) and rebuild.</li>
        </ol>
        <p className="text-[var(--ink-terminal-muted)]">Full guide: docs/ADMIN.md</p>
      </TerminalWindow>
    </main>
  )
}
