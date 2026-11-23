import { usePublicContent } from '../../hooks/useLocale'

const YEAR = new Date().getFullYear()

export function Footer() {
  const { profileData, copy } = usePublicContent()
  return (
    <footer className="bg-[var(--surface)] px-4 sm:px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 text-[length:var(--step-small)] sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-semibold text-[var(--ink)]">{profileData.firstName} {profileData.lastName}</p>
          <p className="text-[var(--ink-secondary)]">{copy.footerStudy}</p>
        </div>
        <p className="text-[var(--ink-secondary)]">© {YEAR} {profileData.firstName}. {copy.rights}</p>
      </div>
    </footer>
  )
}
