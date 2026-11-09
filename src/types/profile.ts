export interface SocialLink {
  name: string
  label: string
  url: string
  handle?: string
}

export interface NavLink {
  label: string
  href: string
}

export interface HeroCardData {
  id: string
  path: string
  metric: string
  desc: string
  stack: string[]
  rotation: number // degrees (e.g. -4, +4, -3, +3)
  href: string
  isMorphTarget?: boolean
}

export interface TechSpecItem {
  category: string
  items: string
}

export interface AboutData {
  terminalPath: string
  command: string
  headline: string
  subHeadline: string
  bio: string
  photo: {
    name: string
    location: string
    tag: string
    imageAlt: string
  }
  specsHeader: string
  specs: TechSpecItem[]
}

export interface Profile {
  firstName: string
  lastName: string
  title: string
  subtitle: string
  bio: string
  affiliation: string
  location: string
  availableForWork: boolean
  statusText: string
  email: string
  resumeUrl: string
  socialLinks: {
    github: SocialLink
    linkedin: SocialLink
    instagram: SocialLink
  }
  navLinks: NavLink[]
  heroCards: HeroCardData[]
  about: AboutData
}
