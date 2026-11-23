import { getPublicContent } from '../data/public-content'
import { emit, scrollToSection } from './events'
import type { VFSDir, VFSFile, VFSNode } from '../types'

const file = (name: string, content: string, action?: () => void): VFSFile => ({ type: 'file', name, content, action })
const dir = (name: string, nodes: VFSNode[], action?: () => void): VFSDir => ({
  type: 'dir',
  name,
  children: Object.fromEntries(nodes.map((n) => [n.name, n])),
  action,
})

/** The VFS is generated from src/data so terminal and page can never disagree. */
export function buildVfs(content = getPublicContent('en')): VFSDir {
  const { profileData, projectsData, badgesData, certificatesData, experienceData } = content
  const p = profileData

  const projects = projectsData.map((pr) =>
    file(
      `${pr.slug}.md`,
      [
        `# ${pr.title}`,
        `${pr.category} · ${pr.role}`,
        '',
        pr.description,
        '',
        `stack: ${pr.techStack.join(', ')}`,
        pr.githubUrl ? `repo:  ${pr.githubUrl}` : '',
        pr.liveDemoUrl ? `live:  ${pr.liveDemoUrl}` : '',
        ...(pr.keyFeatures ?? []).map((f) => `- ${f}`),
      ]
        .filter((l, i, arr) => l !== '' || arr[i - 1] !== '')
        .join('\n'),
      () => emit('open-project', { slug: pr.slug }),
    ),
  )

  const badges = badgesData.map((b) =>
    file(
      `${b.id}.txt`,
      `${b.title}\nissuer: ${b.issuer} (${b.issueDate})\nskills: ${b.skills.join(', ')}\nverify: ${b.credlyUrl}`,
      () => emit('open-badge', { id: b.id }),
    ),
  )

  const log = experienceData
    .map((e) => `[${e.period}] ${e.category.toUpperCase().padEnd(12)} ${e.role} @ ${e.organization}`)
    .join('\n')

  const certificates = certificatesData.map((certificate) => file(
    `${certificate.id}.txt`,
    [certificate.title, `issuer: ${certificate.issuer} (${certificate.issueDate})`, certificate.description,
      certificate.pdfUrl ? `pdf: ${certificate.pdfUrl}` : '',
      certificate.verificationUrl ? `verify: ${certificate.verificationUrl}` : ''].filter(Boolean).join('\n'),
    () => emit('open-certificate', { id: certificate.id }),
  ))

  return dir('~', [
    file('about.md', `# ${p.firstName} ${p.lastName}\n${p.title} · ${p.affiliation} · ${p.location}\n\n${p.about.bio}`, () => scrollToSection('about')),
    file(
      'contact.txt',
      [`email:     ${p.email}`, ...p.socialLinkList.map((s) => `${s.name.toLowerCase().padEnd(10)} ${s.url}`)].join('\n'),
      () => scrollToSection('contact'),
    ),
    file('experience.log', log, () => scrollToSection('experience')),
    file('cv.pdf', '%PDF-1.7 — binary file. Try: open cv.pdf', () => emit('open-cv', undefined)),
    dir('projects', projects, () => scrollToSection('projects')),
    dir('badges', badges, () => scrollToSection('badges')),
    dir('certificates', certificates, () => { emit('open-certificate', {}); scrollToSection('badges') }),
  ])
}

/** Resolve a path relative to cwd. Supports `~`, `.`, `..`, `./x`, trailing slashes. */
export function resolvePath(root: VFSDir, cwd: string[], raw: string): { node: VFSNode | null; path: string[] } {
  const input = raw.trim()
  const parts = input.startsWith('~') ? input.slice(1).split('/') : [...cwd, ...input.split('/')]
  const stack: string[] = []
  for (const part of parts) {
    if (part === '' || part === '.') continue
    if (part === '..') stack.pop()
    else stack.push(part)
  }
  let node: VFSNode = root
  for (const part of stack) {
    if (node.type !== 'dir') return { node: null, path: stack }
    const next: VFSNode | undefined = node.children[part]
    if (!next) return { node: null, path: stack }
    node = next
  }
  return { node, path: stack }
}

export const formatPath = (path: string[]) => (path.length ? `~/${path.join('/')}` : '~')

/** Every path in the tree, for "did you mean" suggestions. */
export function allPaths(root: VFSDir, prefix: string[] = []): string[] {
  return Object.values(root.children).flatMap((n) => {
    const here = [...prefix, n.name].join('/')
    return n.type === 'dir' ? [here, ...allPaths(n, [...prefix, n.name])] : [here]
  })
}

export function levenshtein(a: string, b: string): number {
  const dp = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0]
    dp[0] = i
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j]
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1))
      prev = tmp
    }
  }
  return dp[b.length]
}

export function closest(input: string, candidates: string[], maxDistance = 3): string | null {
  let best: string | null = null
  let bestScore = Infinity
  for (const c of candidates) {
    const tail = c.split('/').pop() ?? c
    const score = Math.min(levenshtein(input, c), levenshtein(input, tail))
    if (score < bestScore) {
      best = c
      bestScore = score
    }
  }
  return bestScore <= maxDistance ? best : null
}
