export interface Badge {
  id: string
  title: string
  issuer: string
  issueDate: string
  expiryDate?: string
  credentialId?: string
  credlyUrl: string
  imageAsset: string
  skills: string[]
  description?: string
}
