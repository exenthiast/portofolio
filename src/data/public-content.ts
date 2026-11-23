import type { Content } from '../schemas/content.ts'
import type { Locale } from '../types/locale.ts'
import { content } from './content.ts'
import { profileData as baseProfile } from './profile.ts'
import { experienceCategories } from './experience.ts'
import { credentialTabs, credentialsCopy, splitCredentials } from './credentials.ts'
import { contactFormContent } from './contact.ts'
import { cvContent } from './cv.ts'
import { publicCopy } from './public-copy.ts'
import { formatCredentialDate, localizeCopy, localizeDocument, translateText } from './localization.ts'

export function getPublicContent(locale: Locale, source: Content = content) {
  const profile = localizeDocument(source.profile, locale)
  const projectsData = source.projects.map((project) => localizeDocument(project, locale))
  const experienceData = source.experiences.map((experience) => {
    const localized = localizeDocument(experience, locale)
    const months = locale === 'en' ? { Okt: 'Oct', Des: 'Dec', Sekarang: 'Present' } : { Oct: 'Okt', Dec: 'Des', May: 'Mei', Aug: 'Agu', Apr: 'Apr', Present: 'Sekarang' }
    return { ...localized, period: localized.period.replace(/\b(?:Okt|Des|Sekarang|Oct|Dec|May|Aug|Present)\b/g, (word) => months[word as keyof typeof months] ?? word) }
  })
  const { badges: badgesData, certificates: certificatesData } = splitCredentials(source.badges.map((badge) => ({ ...localizeDocument(badge, locale), issueDate: formatCredentialDate(badge.issueDate, locale), ...(badge.expiryDate ? { expiryDate: formatCredentialDate(badge.expiryDate, locale) } : {}) })))
  const copy = localizeCopy(publicCopy, locale)
  const profileData = {
    ...baseProfile, ...profile,
    socialLinks: baseProfile.socialLinks,
    socialLinkList: baseProfile.socialLinkList,
    navLinks: baseProfile.navLinks.map((link) => ({ ...link, label: translateText(link.label, locale) })),
    heroCards: baseProfile.heroCards.map((card) => ({ ...card, metric: translateText(card.metric, locale), desc: translateText(card.desc, locale) })),
    about: {
      ...baseProfile.about,
      headline: `${copy.hello} ${profile.firstName}`,
      subHeadline: profile.title,
      bio: profile.aboutBio ?? translateText(baseProfile.about.bio, locale),
      photo: { ...baseProfile.about.photo, image: profile.photo, location: profile.location },
      projectsLink: { ...baseProfile.about.projectsLink, label: copy.explore },
    },
  }
  return {
    profileData, projectsData, experienceData, badgesData, certificatesData, copy,
    experienceCategories: localizeCopy(experienceCategories, locale),
    credentialTabs: localizeCopy(credentialTabs, locale),
    credentialsCopy: localizeCopy(credentialsCopy, locale),
    contactFormContent: localizeCopy(contactFormContent, locale),
    cvContent: localizeCopy(cvContent, locale),
  }
}
