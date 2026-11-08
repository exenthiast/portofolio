import { motion } from 'framer-motion'
import { Terminal, Shield, FolderGit2, Award, ArrowUpRight } from 'lucide-react'
import { useLenis } from './hooks/useLenis'

export default function App() {
  useLenis()

  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col items-center justify-center px-6 py-20 relative selection:bg-accent selection:text-white">
      {/* Top Coordinate Bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface border border-slate-200/60 shadow-xs mb-8"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
        </span>
        <span className="text-xs font-medium text-ink-secondary tracking-tight">
          Available for work / Yogyakarta, ID
        </span>
      </motion.div>

      {/* Hero Headline */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="text-center max-w-3xl mb-10"
      >
        <h1 className="text-4xl md:text-7xl font-bold tracking-tight text-ink leading-tight mb-4">
          Alfiz Desta <br />
          <span className="text-slate-500 font-medium">Ariant Permana</span>
        </h1>
        <p className="text-base md:text-lg text-ink-secondary max-w-xl mx-auto leading-relaxed">
          Software Engineering at Universitas Gadjah Mada (UGM). Crafting robust backend architectures, distributed APIs, and developer-native web experiences.
        </p>
      </motion.div>

      {/* Initial Quad Preview Badges */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl w-full mb-12"
      >
        <div className="p-4 rounded-xl bg-surface border border-slate-200/60 flex flex-col justify-between">
          <FolderGit2 className="w-5 h-5 text-accent mb-3" />
          <div>
            <span className="text-xs font-mono text-ink-secondary">~/projects</span>
            <p className="text-sm font-semibold text-ink">3 Case Studies</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-slate-200/60 flex flex-col justify-between">
          <Award className="w-5 h-5 text-accent mb-3" />
          <div>
            <span className="text-xs font-mono text-ink-secondary">~/badges</span>
            <p className="text-sm font-semibold text-ink">10 Credly Badges</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-slate-200/60 flex flex-col justify-between">
          <Shield className="w-5 h-5 text-accent mb-3" />
          <div>
            <span className="text-xs font-mono text-ink-secondary">~/experience</span>
            <p className="text-sm font-semibold text-ink">UGM & Community</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-surface-terminal border border-surface-terminal-header text-ink-terminal flex flex-col justify-between">
          <Terminal className="w-5 h-5 text-accent mb-3" />
          <div>
            <span className="text-xs font-mono text-ink-terminal-muted">~/terminal</span>
            <p className="text-sm font-mono font-semibold text-accent">./boot --portfolio</p>
          </div>
        </div>
      </motion.div>

      {/* Minimal Terminal Mockup Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="w-full max-w-xl rounded-xl bg-surface-terminal border border-surface-terminal-header overflow-hidden shadow-lg"
      >
        <div className="px-4 py-2.5 bg-surface-terminal-header flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-mac-close"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-mac-minimize"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-mac-maximize"></div>
          </div>
          <span className="text-xs font-mono text-ink-terminal-muted">alfizdesta — ~/welcome — zsh</span>
          <div className="w-8"></div>
        </div>
        <div className="p-5 font-mono text-xs md:text-sm text-ink-terminal leading-relaxed space-y-2">
          <p className="text-ink-terminal-muted">$ cat ./spec.json</p>
          <p className="text-emerald-400">
            {JSON.stringify(
              {
                status: "Project Initialized",
                stack: ["React 19", "Vite", "Tailwind CSS v4", "Framer Motion", "Lenis"],
                owner: "Alfiz Desta Ariant Permana",
                phase: "Design & Scaffolding Complete"
              },
              null,
              2
            )}
          </p>
          <div className="flex items-center gap-1 pt-2 text-ink-terminal">
            <span className="text-accent font-bold">alfizdesta:~$</span>
            <span className="inline-block w-2 h-4 bg-accent animate-pulse"></span>
          </div>
        </div>
      </motion.div>

      {/* Footer minimal info */}
      <footer className="mt-16 text-center text-xs text-ink-secondary font-mono flex items-center gap-4">
        <span>alfizdesta.com</span>
        <span>•</span>
        <a
          href="https://github.com/exenthiast"
          target="_blank"
          rel="noreferrer"
          className="hover:text-ink inline-flex items-center gap-0.5 underline underline-offset-4"
        >
          github/exenthiast <ArrowUpRight className="w-3 h-3" />
        </a>
      </footer>
    </div>
  )
}
