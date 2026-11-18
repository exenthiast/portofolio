import type { Experience, ExperienceCategory } from '../types'
import { content } from './content'

export const experienceData: Experience[] = content.experiences

export const experienceCategories: { id: ExperienceCategory; label: string }[] = [
  { id: 'organization', label: 'Organizations' },
  { id: 'committee', label: 'Committees & Events' },
  { id: 'training', label: 'Training' },
]
