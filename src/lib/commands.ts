import { profileData } from '../data/profile'
import { projectsData } from '../data/projects'
import { badgesData } from '../data/badges'
import { experienceData } from '../data/experience'
import { allPaths, closest, formatPath, resolvePath } from './vfs'
import type { CommandResult, OutputLine, OutputSegment, VFSDir } from '../types'

export interface ShellContext {
  root: VFSDir
  cwd: string[]
  history: string[]
  setCwd: (cwd: string[]) => void
  clear: () => void
}

type Handler = (args: string[], ctx: ShellContext) => CommandResult

const t = (text: string, tone?: 'default' | 'muted' | 'accent' | 'error'): OutputSegment => ({ kind: 'text', text, tone })
const cmd = (command: string, text = command): OutputSegment => ({ kind: 'command', text, command })
const lines = (text: string, tone?: 'default' | 'muted' | 'accent' | 'error'): OutputLine[] => text.split('\n').map((l) => [t(l, tone)])
const ok = (out: OutputLine[]): CommandResult => ({ lines: out, status: 'success' })
const err = (out: OutputLine[]): CommandResult => ({ lines: out, status: 'error' })

function notFound(ctx: ShellContext, command: string, target: string): CommandResult {
  const guess = closest(target.replace(/^~\/|^\.\//, ''), allPaths(ctx.root))
  const out: OutputLine[] = [[t(`${command}: ${target}: No such file or directory`, 'error')]]
  if (guess) out.push([t('Did you mean '), cmd(`${command} ~/${guess}`), t('?')])
  return err(out)
}

interface CommandSpec {
  usage: string
  summary: string
  run: Handler
  hidden?: boolean
}

const ls: Handler = (args, ctx) => {
  const long = args.some((a) => /^-\w*l/.test(a))
  const target = args.find((a) => !a.startsWith('-')) ?? '.'
  const { node, path } = resolvePath(ctx.root, ctx.cwd, target)
  if (!node) return notFound(ctx, 'ls', target)
  if (node.type === 'file') return ok([[t(node.name)]])
  const base = formatPath(path)
  const entries = Object.values(node.children).sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'dir' ? -1 : 1))
  if (long) {
    return ok([
      [t(`total ${entries.length}`, 'muted')],
      ...entries.map((e): OutputLine => [
        t(`${e.type === 'dir' ? 'drwxr-xr-x' : '-rw-r--r--'}  alfiz  staff  `, 'muted'),
        e.type === 'dir' ? cmd(`cd ${base}/${e.name}`, `${e.name}/`) : cmd(`cat ${base}/${e.name}`, e.name),
      ]),
    ])
  }
  return ok([
    entries.flatMap((e): OutputSegment[] => [
      e.type === 'dir' ? cmd(`cd ${base}/${e.name}`, `${e.name}/`) : cmd(`cat ${base}/${e.name}`, e.name),
      t('  '),
    ]),
  ])
}

const cat: Handler = (args, ctx) => {
  if (!args[0]) return err([[t('cat: missing file operand', 'error')]])
  const { node, path } = resolvePath(ctx.root, ctx.cwd, args[0])
  if (!node) return notFound(ctx, 'cat', args[0])
  if (node.type === 'dir') return err([[t(`cat: ${args[0]}: Is a directory. Try `, 'error'), cmd(`ls ${formatPath(path)}`)]])
  const out = lines(node.content)
  if (node.action) out.push([t('→ ', 'muted'), cmd(`open ${formatPath(path)}`)])
  return ok(out)
}

const specs: Record<string, CommandSpec> = {
  help: {
    usage: 'help [command]',
    summary: 'List commands or show usage',
    run: (args) => {
      if (args[0]) {
        const spec = specs[args[0]]
        return spec ? ok([[t(spec.usage, 'accent')], [t(spec.summary)]]) : err([[t(`help: no help topics match '${args[0]}'`, 'error')]])
      }
      return ok([
        [t('Available commands (click to run):', 'muted')],
        ...Object.entries(specs)
          .filter(([, s]) => !s.hidden)
          .map(([name, s]): OutputLine => [cmd(name, name.padEnd(10)), t(` ${s.summary}`, 'muted')]),
      ])
    },
  },
  ls: { usage: 'ls [-l] [path]', summary: 'List directory contents', run: ls },
  ll: { usage: 'll [path]', summary: 'Alias for ls -l', run: (a, c) => ls(['-l', ...a], c), hidden: true },
  dir: { usage: 'dir [path]', summary: 'Alias for ls', run: ls, hidden: true },
  cd: {
    usage: 'cd <dir>',
    summary: 'Change directory',
    run: (args, ctx) => {
      const target = args[0] ?? '~'
      const { node, path } = resolvePath(ctx.root, ctx.cwd, target)
      if (!node) return notFound(ctx, 'cd', target)
      if (node.type !== 'dir') return err([[t(`cd: not a directory: ${target}`, 'error')]])
      ctx.setCwd(path)
      return ok([])
    },
  },
  pwd: { usage: 'pwd', summary: 'Print working directory', run: (_a, ctx) => ok([[t(formatPath(ctx.cwd).replace('~', '/home/alfiz'))]]) },
  cat: { usage: 'cat <file>', summary: 'Print a file', run: cat },
  less: { usage: 'less <file>', summary: 'Alias for cat', run: cat, hidden: true },
  more: { usage: 'more <file>', summary: 'Alias for cat', run: cat, hidden: true },
  tail: {
    usage: 'tail [-f] [file]',
    summary: 'Latest journey entries',
    run: (args, ctx) => {
      const target = args.find((a) => !a.startsWith('-')) ?? '~/experience.log'
      const { node } = resolvePath(ctx.root, ctx.cwd, target)
      if (!node) return notFound(ctx, 'tail', target)
      if (node.type === 'dir') return err([[t(`tail: ${target}: Is a directory`, 'error')]])
      const out = lines(node.content).slice(-5)
      if (args.includes('-f')) out.push([t('— following… new entries ship with every publish ✦', 'muted')])
      return ok(out)
    },
  },
  grep: {
    usage: 'grep [-r] <pattern>',
    summary: 'Search projects, badges & journey',
    run: (args, ctx) => {
      const pattern = args.filter((a) => !a.startsWith('-')).join(' ')
      if (!pattern) return err([[t('usage: grep [-r] <pattern>', 'error')]])
      const needle = pattern.toLowerCase()
      const hits: OutputLine[] = []
      const walk = (node: VFSDir, path: string[]) => {
        for (const child of Object.values(node.children)) {
          const childPath = [...path, child.name]
          if (child.type === 'dir') walk(child, childPath)
          else
            child.content.split('\n').forEach((line) => {
              if (line.toLowerCase().includes(needle)) hits.push([cmd(`cat ${formatPath(childPath)}`, `${childPath.join('/')}:`), t(` ${line.trim()}`)])
            })
        }
      }
      walk(ctx.root, [])
      return hits.length ? ok(hits.slice(0, 20)) : err([[t(`grep: no matches for '${pattern}'`, 'error')]])
    },
  },
  open: {
    usage: 'open <path>',
    summary: 'Jump to a section / open a project, badge or the CV',
    run: (args, ctx) => {
      const target = args[0] ?? '.'
      const { node, path } = resolvePath(ctx.root, ctx.cwd, target)
      if (!node) return notFound(ctx, 'open', target)
      if (!node.action) return err([[t(`open: nothing to open at ${formatPath(path)}`, 'error')]])
      node.action()
      return ok([[t(`opening ${formatPath(path)}…`, 'accent')]])
    },
  },
  whoami: {
    usage: 'whoami [--stats]',
    summary: 'Who is behind this shell',
    run: (args) => {
      const p = profileData
      if (args.includes('--stats')) {
        return ok([
          [t('projects   ', 'muted'), t(String(projectsData.length))],
          [t('badges     ', 'muted'), t(String(badgesData.length))],
          [t('experience ', 'muted'), t(String(experienceData.length))],
          [t('status     ', 'muted'), t(p.availableForWork ? 'available for work' : 'busy', p.availableForWork ? 'accent' : 'default')],
        ])
      }
      return ok([[t(`${p.firstName} ${p.lastName}`, 'accent')], [t(`${p.title} · ${p.affiliation}`)], [t('try '), cmd('whoami --stats')]])
    },
  },
  neofetch: {
    usage: 'neofetch',
    summary: 'System summary',
    run: () => {
      const p = profileData
      const stacks = [...new Set(projectsData.flatMap((pr) => pr.techStack))].slice(0, 8).join(', ')
      return ok([
        [t('alfiz@portfolio', 'accent')],
        [t('---------------', 'muted')],
        [t('OS:        ', 'muted'), t('alfizdesta.dev (React 19 + Vite)')],
        [t('Host:      ', 'muted'), t(p.affiliation)],
        [t('Role:      ', 'muted'), t(p.title)],
        [t('Location:  ', 'muted'), t(`${p.location} (GMT+7)`)],
        [t('Stack:     ', 'muted'), t(stacks)],
        [t('Projects:  ', 'muted'), t(String(projectsData.length))],
        [t('Badges:    ', 'muted'), t(String(badgesData.length))],
      ])
    },
  },
  contact: {
    usage: 'contact [--open-channel]',
    summary: 'How to reach me',
    run: (args, ctx) => {
      if (args.includes('--open-channel')) specs.open.run(['~/contact.txt'], ctx)
      return ok([
        [t('email     ', 'muted'), { kind: 'link', text: profileData.email, href: `mailto:${profileData.email}` }],
        ...profileData.socialLinkList.map((s): OutputLine => [t(s.name.toLowerCase().padEnd(10), 'muted'), { kind: 'link', text: s.url, href: s.url }]),
      ])
    },
  },
  history: {
    usage: 'history',
    summary: 'Commands run this session',
    run: (_a, ctx) => ok(ctx.history.map((h, i): OutputLine => [t(`${String(i + 1).padStart(4)}  `, 'muted'), cmd(h)])),
  },
  echo: { usage: 'echo <text>', summary: 'Print text', run: (args) => ok([[t(args.join(' '))]]) },
  date: {
    usage: 'date',
    summary: 'Current date & time (WIB)',
    run: () => ok([[t(new Date().toLocaleString('en-GB', { timeZone: 'Asia/Jakarta', dateStyle: 'full', timeStyle: 'long' }))]]),
  },
  clear: {
    usage: 'clear',
    summary: 'Clear the screen (Ctrl+L)',
    run: (_a, ctx) => {
      ctx.clear()
      return ok([])
    },
  },
  cls: { usage: 'cls', summary: 'Alias for clear', run: (a, c) => specs.clear.run(a, c), hidden: true },
  sudo: {
    usage: 'sudo <cmd>',
    summary: 'Nice try',
    hidden: true,
    run: () => err([[t('visitor is not in the sudoers file. This incident will be reported.', 'error')]]),
  },
  exit: {
    usage: 'exit',
    summary: 'Leave the shell',
    hidden: true,
    run: () => ok([[t("logout — just kidding, there's no escape. Try "), cmd('contact'), t(' instead.')]]),
  },
}

export const commandNames = Object.keys(specs)

/** Split respecting simple "double quoted" args. */
export function tokenize(input: string): string[] {
  return (input.match(/"[^"]*"|\S+/g) ?? []).map((s) => s.replace(/^"|"$/g, ''))
}

export function execute(input: string, ctx: ShellContext): CommandResult {
  const [name, ...args] = tokenize(input)
  if (!name) return ok([])
  const spec = specs[name]
  if (!spec) {
    const guess = closest(name, commandNames, 2)
    return err([
      [t(`zsh: command not found: ${name}`, 'error')],
      guess ? [t('Did you mean '), cmd([guess, ...args].join(' ')), t('?')] : [t('Type '), cmd('help'), t(' to see what I can do.')],
    ])
  }
  return spec.run(args, ctx)
}

/** Tab completion: commands for the first word, VFS paths afterwards. */
export function complete(input: string, ctx: ShellContext): string {
  const parts = input.split(' ')
  const last = parts[parts.length - 1]
  const pool = parts.length === 1 ? commandNames : allPaths(ctx.root, []).map((p) => `~/${p}`).concat(allPaths(ctx.root))
  const matches = pool.filter((c) => c.startsWith(last))
  if (matches.length !== 1) return input
  parts[parts.length - 1] = matches[0]
  return parts.join(' ') + (parts.length === 1 ? ' ' : '')
}
