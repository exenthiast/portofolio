import { useLenis } from './hooks/useLenis'
import { Navbar } from './components/sections/Navbar'
import { Hero } from './components/sections/Hero'
import { GithubContributionCursor } from './components/ui/GithubContributionCursor'

export default function App() {
  useLenis()

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] flex flex-col font-sans selection:bg-[var(--accent)] selection:text-white">
      {/* GitHub Contribution Squares Cursor Follower */}
      <GithubContributionCursor />

      {/* Top Navbar */}
      <Navbar />

      {/* Main Content Areas */}
      <main className="flex-1 flex flex-col">
        {/* Phase 4: Hero Section & Quad Neofetch Cards */}
        <Hero />

        {/* Section Anchors for Next Phases */}
        <section id="about" className="py-28 px-6 max-w-5xl mx-auto w-full min-h-[60vh] flex flex-col justify-center">
          <div className="p-8 rounded-2xl bg-[var(--surface-terminal)] text-[var(--ink-terminal)] border border-[var(--surface-terminal-header)]">
            <span className="text-xs font-mono text-[var(--ink-terminal-muted)]">
              ~/alfiz/about — coming in Phase 5
            </span>
          </div>
        </section>

        <section id="projects" className="py-28 px-6 max-w-5xl mx-auto w-full min-h-[60vh] flex flex-col justify-center">
          <div className="p-8 rounded-2xl bg-[var(--surface)] border border-slate-200">
            <span className="text-xs font-mono text-[var(--ink-secondary)]">
              ~/projects — coming in Phase 6
            </span>
          </div>
        </section>

        <section id="experience" className="py-28 px-6 max-w-5xl mx-auto w-full min-h-[60vh] flex flex-col justify-center">
          <div className="p-8 rounded-2xl bg-[var(--surface)] border border-slate-200">
            <span className="text-xs font-mono text-[var(--ink-secondary)]">
              ~/experience — coming in Phase 7
            </span>
          </div>
        </section>

        <section id="badges" className="py-28 px-6 max-w-5xl mx-auto w-full min-h-[60vh] flex flex-col justify-center">
          <div className="p-8 rounded-2xl bg-[var(--surface)] border border-slate-200">
            <span className="text-xs font-mono text-[var(--ink-secondary)]">
              ~/badges — coming in Phase 7
            </span>
          </div>
        </section>

        <section id="contact" className="py-28 px-6 max-w-5xl mx-auto w-full min-h-[60vh] flex flex-col justify-center">
          <div className="p-8 rounded-2xl bg-[var(--surface-terminal)] text-[var(--ink-terminal)] border border-[var(--surface-terminal-header)]">
            <span className="text-xs font-mono text-[var(--ink-terminal-muted)]">
              ~/contact — coming in Phase 8
            </span>
          </div>
        </section>
      </main>

      {/* Footer Minimal */}
      <footer className="py-8 text-center text-xs text-[var(--ink-secondary)] font-mono border-t border-slate-200/60 bg-[var(--surface)]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Alfiz Desta Ariant Permana · Universitas Gadjah Mada</span>
          <span>© 2026 Alfiz Desta. All rights reserved.</span>
        </div>
      </footer>
    </div>
  )
}
