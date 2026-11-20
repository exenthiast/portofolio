import type { Badge } from '../schemas/content.ts'
import type { Certificate, Credential, CredentialKind } from '../types/credential.ts'

export function splitCredentials(items: Credential[]) {
  return {
    badges: items.filter((item): item is Badge => item.kind !== 'certificate'),
    certificates: items.filter((item): item is Certificate => item.kind === 'certificate'),
  }
}

export const credentialTabs: { id: CredentialKind; label: string }[] = [
  { id: 'badge', label: 'Credly badges' },
  { id: 'certificate', label: 'Certificates' },
]

export const credentialsCopy = {
  heading: 'Credentials',
  tabsLabel: 'Credential category',
  credlyLabel: 'See all on Credly',
  credlyUrl: 'https://www.credly.com/users/alfiz-desta',
  emptyBadges: 'No Credly badges published yet.',
  emptyCertificates: 'No certificates published yet.',
  detailTitle: 'Credential',
  openPdf: 'Open PDF',
  pdfLabel: 'PDF certificate',
  pdfPreview: 'Certificate PDF preview',
  pdfFallback: 'Open the PDF to view this certificate.',
  verifyCertificate: 'Verify credential',
  verifyBadge: 'Verify on Credly',
  skillsLabel: 'Skills',
  noExpiry: 'No expiry',
  metadata: [
    { key: 'issuer', label: 'Issuer' },
    { key: 'issueDate', label: 'Issued' },
    { key: 'expiryDate', label: 'Expires' },
    { key: 'credentialId', label: 'Credential ID' },
  ] as const,
}
