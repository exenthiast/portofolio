export type ExperienceCategory = 'organization' | 'committee' | 'training'

export interface Experience {
  id: string
  category: ExperienceCategory
  role: string
  organization: string
  period: string
  description: string
  division?: string
  skills?: string[]
  photoAsset?: string
}
