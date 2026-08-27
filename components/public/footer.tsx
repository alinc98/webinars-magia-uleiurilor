import Link from 'next/link'

const LINK =
  'min-h-touch inline-flex items-center underline hover:text-primary-800'

export function FooterPublic() {
  return (
    <footer className="border-brand-border text-text-muted text-body-sm border-t px-5 py-6">
      <div className="mx-auto flex max-w-[var(--container-content)] flex-wrap items-center gap-x-5 gap-y-1">
        <span className="min-h-touch inline-flex items-center">
          Magia Uleiurilor Esențiale
        </span>
        <Link href="/confidentialitate" className={LINK}>
          Confidențialitate
        </Link>
        <Link href="/cookies" className={LINK}>
          Cookie-uri
        </Link>
        <a href="mailto:contact@magia-uleiurilor.ro" className={LINK}>
          Contact
        </a>
        <a href="https://anpc.ro" className={LINK} rel="noopener noreferrer">
          ANPC
        </a>
        <a href="https://ec.europa.eu/consumers/odr" className={LINK} rel="noopener noreferrer">
          SOL
        </a>
      </div>
    </footer>
  )
}
