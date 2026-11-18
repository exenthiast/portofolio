import type { Profile, SocialLink } from '../types'
import { content } from './content'

const { socialLinks, ...identity } = content.profile
const projects = content.projects
const badges = content.badges
const experiences = content.experiences

const toLink = (id: string): SocialLink => {
  const link = socialLinks.find((s) => s.id === id)
  return link
    ? { name: link.name, label: `${link.name} ↗`, url: link.url, handle: link.handle }
    : { name: id, label: id, url: '#' }
}

const organizationNames = experiences
  .filter((e) => e.category !== 'training')
  .map((e) => e.organization.replace(/\s*\(.*\)$/, '').replace(/\s+UGM$/, ''))

export const profileData: Profile = {
  ...identity,
  socialLinks: {
    github: toLink('github'),
    linkedin: toLink('linkedin'),
    instagram: toLink('instagram'),
  },
  socialLinkList: socialLinks.map((s) => toLink(s.id)),
  navLinks: [
    { label: 'Overview', href: '#overview' },
    { label: 'About', href: '#about' },
    { label: 'Projects', href: '#projects' },
    { label: 'Experience', href: '#experience' },
    { label: 'Badges', href: '#badges' },
    { label: 'Contact', href: '#contact' },
  ],
  // Metrics are derived from content so the hero never contradicts the sections below.
  heroCards: [
    {
      id: 'card-projects',
      path: '~/project/2025-2026',
      metric: `${projects.length} Active Projects`,
      desc: 'Backend & Fullstack Architecture',
      stack: projects.map((p) => p.title),
      rotation: -4,
      href: '#projects',
    },
    {
      id: 'card-badges',
      path: '~/badges/alfiz',
      metric: `${badges.length} Credly Badges`,
      desc: `${[...new Set(badges.map((b) => b.issuer))].join(' & ')} Verified`,
      stack: [...new Set(badges.flatMap((b) => b.skills))].slice(0, 4),
      rotation: 4,
      href: '#badges',
    },
    {
      id: 'card-experience',
      path: '~/experience/2024-2026',
      metric: `${experiences.length} Experiences`,
      desc: 'Organizations, Committees & Training',
      stack: [...new Set(organizationNames)].slice(0, 4),
      rotation: -3,
      href: '#experience',
    },
    {
      id: 'card-portfolio',
      path: '~/alfiz/portfolio',
      metric: identity.title,
      desc: identity.affiliation,
      stack: ['Backend Systems', 'AI', 'DevOps'],
      rotation: 3,
      href: '#about',
      isMorphTarget: true,
    },
  ],
  about: {
    terminalPath: '~/alfiz/about',
    command: 'alfizdesta:~$ cat ./about.md',
    headline: `Hi, I'm ${identity.firstName} ${identity.lastName}`,
    subHeadline: `${identity.title} @ ${identity.affiliation}`,
    bio: identity.bio,
    photo: {
      name: `${identity.firstName} ${identity.lastName}`,
      location: `📍 ${identity.location} · ${identity.affiliation}`,
      tag: '@exenthiast · Software Engineering 2024-2028',
      imageAlt: `${identity.firstName} ${identity.lastName} Portrait`,
    },
    specsHeader: 'SYSTEM SPECIFICATIONS & TECH MATRIX',
    specs: [
      { category: 'Languages', items: 'TypeScript, PHP 8.3, Python 3.12, SQL, Go' },
      { category: 'Frameworks', items: 'Laravel 13, Next.js, Express, Vue 3 + Vite' },
      { category: 'Databases', items: 'PostgreSQL, Redis (Caching), MySQL' },
      { category: 'Architecture', items: 'Clean Architecture, RESTful API, Concurrency' },
      { category: 'DevOps & Tools', items: 'Docker, Postman, Git, CI/CD Actions, Linux' },
      { category: 'Interests', items: 'DevOps Automation, Computer Vision' },
      { category: 'Availability', items: identity.statusText },
    ],
  },
}
