export interface Project {
  id: string
  slug: string
  title: string
  category: string
  role: string
  description: string
  techStack: string[]
  liveDemoUrl?: string
  githubUrl?: string
  previewAsset: string
  architecture?: {
    overview: string
    keyDecisions: string[]
    databaseSchema?: string
    apiEndpoints?: string[]
  }
  keyFeatures?: string[]
}
