import type { Profile, SocialLink } from '../types'
import { content } from './content'
import { aboutContent } from './about'
import { badgesData } from './badges'

const { socialLinks, ...identity } = content.profile
const projects = content.projects
const badges = badgesData
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
    { label: 'Credentials', href: '#badges' },
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
    prompt: 'alfizdesta:~$',
    command: 'cat ./about.md',
    headline: `Hi, I'm ${identity.firstName}`,
    subHeadline: identity.title,
    bio: identity.aboutBio ?? aboutContent.defaultBio,
    photo: {
      name: `${identity.firstName} ${identity.lastName}`,
      location: identity.location,
      image: identity.photo,
    },
    projectsLink: aboutContent.projectsLink,
  },
}
