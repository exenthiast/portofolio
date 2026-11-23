/**
 * Content schemas — the single contract shared by:
 *  - the public site (src/data/*.ts parses the generated snapshot),
 *  - the admin dashboard (form validation),
 *  - build scripts (scripts/pull-content.ts validates Supabase rows).
 *
 * This file must only import `zod` so Node can run it directly (type stripping).
 */
import { z } from 'zod'

const url = z.string().trim().url()
export const translationsSchema = z.record(z.string(), z.object({
  source: z.string(),
  en: z.string().trim().min(1).optional(),
  id: z.string().trim().min(1).optional(),
}))
export type Translations = z.infer<typeof translationsSchema>
/** Site-relative path ("/badges/x.webp") or absolute URL (Supabase Storage). */
const assetPath = z
  .string()
  .trim()
  .min(1)
  .refine((v) => v.startsWith('/') || /^https?:\/\//.test(v), 'Must be a /path or http(s) URL')

export const imageSchema = z.object({
  src: assetPath,
  alt: z.string().trim().min(1, 'Alt text is required'),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
})

export const socialLinkSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1),
  url,
  handle: z.string().trim().optional(),
})

export const profileSchema = z.object({
  translations: translationsSchema.optional(),
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  title: z.string().trim().min(1),
  subtitle: z.string().trim().min(1),
  bio: z.string().trim().min(1),
  aboutBio: z.string().trim().min(1).optional(),
  affiliation: z.string().trim().min(1),
  location: z.string().trim().min(1),
  availableForWork: z.boolean(),
  statusText: z.string().trim().min(1),
  email: z.string().trim().email(),
  resumeUrl: assetPath,
  resumeEnglishUrl: assetPath.refine((value) => /\.pdf(?:[?#]|$)/i.test(value), 'Choose a PDF for the English CV').optional(),
  photo: imageSchema.optional(),
  navbarLogo: imageSchema.extend({
    src: assetPath.refine((value) => /\.(?:webp|svg)(?:[?#]|$)/i.test(value), 'Choose a WebP or SVG logo, or upload a PNG/JPEG for automatic conversion'),
  }).optional(),
  socialLinks: z.array(socialLinkSchema),
})

export const projectSchema = z.object({
  translations: translationsSchema.optional(),
  id: z.string().trim().min(1),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase-kebab-case'),
  title: z.string().trim().min(1),
  category: z.string().trim().min(1),
  role: z.string().trim().min(1),
  description: z.string().trim().min(1),
  techStack: z.array(z.string().trim().min(1)),
  liveDemoUrl: url.optional(),
  githubUrl: url.optional(),
  preview: imageSchema.optional(),
  architecture: z
    .object({
      overview: z.string().trim().min(1),
      keyDecisions: z.array(z.string().trim().min(1)),
      databaseSchema: z.string().optional(),
      apiEndpoints: z.array(z.string()).optional(),
    })
    .optional(),
  keyFeatures: z.array(z.string().trim().min(1)).optional(),
})

export const badgeSchema = z.object({
  translations: translationsSchema.optional(),
  // Existing Credly rows have no kind; they remain valid without a data migration.
  kind: z.literal('badge').optional(),
  id: z.string().trim().min(1),
  title: z.string().trim().min(1),
  issuer: z.string().trim().min(1),
  issueDate: z.string().trim().min(1),
  expiryDate: z.string().trim().optional(),
  credentialId: z.string().trim().optional(),
  credlyUrl: url,
  image: imageSchema,
  skills: z.array(z.string().trim().min(1)),
  description: z.string().trim().optional(),
})

export const certificateSchema = badgeSchema.omit({ kind: true, credlyUrl: true }).extend({
  kind: z.literal('certificate'),
  image: imageSchema.optional(),
  pdfUrl: assetPath.optional(),
  verificationUrl: url.refine((value) => /^https?:\/\//.test(value), 'Use an http(s) verification URL').optional(),
}).refine((certificate) => Boolean(certificate.image || certificate.pdfUrl), {
  path: ['image'],
  message: 'Choose a certificate image or PDF',
})

export const credentialSchema = z.discriminatedUnion('kind', [badgeSchema, certificateSchema])

export const experienceCategorySchema = z.enum(['organization', 'committee', 'training'])

export const experiencePhotoSchema = imageSchema.extend({
  caption: z.string().trim().optional(),
  year: z.string().trim().optional(),
})

export const experienceSchema = z.object({
  translations: translationsSchema.optional(),
  id: z.string().trim().min(1),
  category: experienceCategorySchema,
  role: z.string().trim().min(1),
  organization: z.string().trim().min(1),
  period: z.string().trim().min(1),
  logo: imageSchema.optional(),
  description: z.string().trim().min(1),
  division: z.string().trim().optional(),
  skills: z.array(z.string().trim().min(1)).optional(),
  photos: z.array(experiencePhotoSchema),
})

export const contentSchema = z.object({
  profile: profileSchema,
  projects: z.array(projectSchema),
  badges: z.array(credentialSchema),
  experiences: z.array(experienceSchema),
})

export type ImageAsset = z.infer<typeof imageSchema>
export type SocialLinkContent = z.infer<typeof socialLinkSchema>
export type ProfileContent = z.infer<typeof profileSchema>
export type Project = z.infer<typeof projectSchema>
export type Badge = z.infer<typeof badgeSchema>
export type Certificate = z.infer<typeof certificateSchema>
export type Credential = z.infer<typeof credentialSchema>
export type ExperienceCategory = z.infer<typeof experienceCategorySchema>
export type ExperiencePhoto = z.infer<typeof experiencePhotoSchema>
export type Experience = z.infer<typeof experienceSchema>
export type Content = z.infer<typeof contentSchema>
