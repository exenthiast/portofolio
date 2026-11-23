import type { ProfileContent } from '../schemas/content.ts'
import type { CvDocument, CvLanguage } from '../types/profile.ts'

export const cvLanguages: { id: CvLanguage; label: string }[] = [
  { id: 'id', label: 'Indonesia' },
  { id: 'en', label: 'English' },
]

export const cvContent = {
  heading: 'Curriculum vitae',
  languageLabel: 'CV language',
  choose: 'Choose or upload PDF',
  removeEnglish: 'Remove English version',
  missingEnglish: 'No English CV selected.',
  saveHint: 'Choose a PDF for each language, then Save profile and Publish. CV files are managed independently of the page language.',
  history: 'Previous PDF files',
  useFor: 'Use for',
  pdfRequired: 'Choose a PDF for the CV.',
  viewerLabel: 'Curriculum vitae viewer',
  close: 'Close CV viewer',
  closeHint: 'Close (Esc)',
  download: 'Download PDF',
  open: 'Open CV (PDF)',
  mobileHint: 'PDF preview works best on a larger screen.',
  pathPrefix: '~/cv/',
  filePrefix: 'CV-Alfiz-Desta-Ariant-Permana',
}

/** Keep the existing Indonesian PDF as the fallback; never invent a translated file. */
export function getCvDocuments(profile: Pick<ProfileContent, 'resumeUrl' | 'resumeEnglishUrl'>): CvDocument[] {
  return cvLanguages.flatMap(({ id, label }) => {
    const url = id === 'id' ? profile.resumeUrl : profile.resumeEnglishUrl
    return url ? [{ language: id, label, url, downloadName: `${cvContent.filePrefix}-${id.toUpperCase()}.pdf` }] : []
  })
}
