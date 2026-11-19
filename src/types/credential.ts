import type { Credential, ImageAsset } from '../schemas/content.ts'

export type { Certificate, Credential } from '../schemas/content.ts'
export type CredentialKind = 'badge' | 'certificate'

export interface CertificateFileValue {
  image?: ImageAsset
  pdfUrl?: string
}

export interface CredentialMediaProps {
  credential: Credential
  thumbnail?: boolean
}
