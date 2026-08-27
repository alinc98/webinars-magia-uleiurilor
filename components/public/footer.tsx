import { LINKURI } from '@/lib/linkuri'

const LINK =
  'min-h-touch inline-flex items-center underline hover:text-primary-800'

export function FooterPublic() {
  return (
    <footer className="border-brand-border text-text-muted text-body-sm border-t px-5 py-6">
      <div className="mx-auto flex max-w-[var(--container-content)] flex-wrap items-center gap-x-5 gap-y-1">
        <span className="min-h-touch inline-flex items-center">
          Magia Uleiurilor Esențiale
        </span>
        {/* Documentele legale sunt pe site-ul principal, ca să existe într-un
            singur loc (vezi lib/linkuri.ts). */}
        <a href={LINKURI.termeni} className={LINK} rel="noopener noreferrer">
          Termeni și condiții
        </a>
        <a href={LINKURI.confidentialitate} className={LINK} rel="noopener noreferrer">
          Confidențialitate
        </a>
        <a href={LINKURI.cookies} className={LINK} rel="noopener noreferrer">
          Cookie-uri
        </a>
        <a href={LINKURI.contact} className={LINK}>
          Contact
        </a>
        <a href={LINKURI.anpc} className={LINK} rel="noopener noreferrer">
          ANPC
        </a>
        <a href={LINKURI.sol} className={LINK} rel="noopener noreferrer">
          SOL
        </a>
      </div>
    </footer>
  )
}
