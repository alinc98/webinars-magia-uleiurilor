import Link from 'next/link'

export function FooterPublic() {
  return (
    <footer className="text-muted-foreground mt-16 border-t px-6 py-8 text-sm">
      <div className="mx-auto flex max-w-[760px] flex-wrap items-center gap-x-4 gap-y-2">
        <span>Magia Uleiurilor Esențiale</span>
        <Link href="/confidentialitate" className="underline">
          Confidențialitate
        </Link>
        <Link href="/cookies" className="underline">
          Cookie-uri
        </Link>
        <a href="mailto:contact@magia-uleiurilor.ro" className="underline">
          Contact
        </a>
        <a href="https://anpc.ro" className="underline" rel="noopener noreferrer">
          ANPC
        </a>
        <a
          href="https://ec.europa.eu/consumers/odr"
          className="underline"
          rel="noopener noreferrer"
        >
          SOL
        </a>
      </div>
    </footer>
  )
}
