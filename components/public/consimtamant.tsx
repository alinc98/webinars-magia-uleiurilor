'use client'

import { createContext, useContext, useSyncExternalStore } from 'react'

import {
  citesteConsimtamant,
  COOKIE_CONSIMTAMANT,
  scrieConsimtamant,
  type StareConsimtamant,
} from '@/lib/consent'

const Context = createContext<StareConsimtamant | null>(null)

export const useConsimtamant = () => useContext(Context)

/*
 * Cookie-ul e o sursă externă de adevăr, nu stare React — de aceea
 * `useSyncExternalStore` și nu `useState` + `useEffect`. Rezultatul e memoizat
 * pe șirul brut, altfel fiecare randare ar produce un obiect nou și ar
 * declanșa o buclă.
 */
let memorat: { brut: string; stare: StareConsimtamant | null } = { brut: '', stare: null }
const abonati = new Set<() => void>()

function citesteDinCookie(): StareConsimtamant | null {
  const brut =
    document.cookie.split('; ').find((c) => c.startsWith(`${COOKIE_CONSIMTAMANT}=`)) ?? ''

  if (brut !== memorat.brut) {
    memorat = { brut, stare: citesteConsimtamant(brut.split('=')[1]) }
  }
  return memorat.stare
}

function aboneaza(reactualizeaza: () => void) {
  abonati.add(reactualizeaza)
  return () => {
    abonati.delete(reactualizeaza)
  }
}

function anunta() {
  for (const reactualizeaza of abonati) reactualizeaza()
}

const nimic = () => () => {}

/**
 * Bannerul de cookie-uri.
 *
 * Nimic care urmărește nu se încarcă înainte de acceptare — pixelul e montat
 * de `MetaPixel`, care citește starea de aici. Refuzul e la fel de ușor ca
 * acceptarea: două butoane de aceeași greutate, fără „dark pattern".
 */
export function FurnizorConsimtamant({ children }: { children: React.ReactNode }) {
  const stare = useSyncExternalStore(aboneaza, citesteDinCookie, () => null)
  // Pe server nu există cookie-uri, deci bannerul s-ar randa mereu în HTML-ul
  // trimis. Îl afișăm abia după hidratare, ca să nu clipească pentru cine a
  // răspuns deja.
  const hidratat = useSyncExternalStore(
    nimic,
    () => true,
    () => false
  )

  function raspunde(marketing: boolean) {
    scrieConsimtamant({ analiza: marketing, marketing })
    anunta()
  }

  return (
    <Context.Provider value={stare}>
      {children}
      {hidratat && !stare && (
        <div
          role="dialog"
          aria-label="Preferințe privind cookie-urile"
          className="bg-background fixed inset-x-0 bottom-0 z-50 border-t p-4 shadow-lg"
        >
          <div className="mx-auto flex max-w-[760px] flex-col gap-3 sm:flex-row sm:items-center">
            <p className="flex-1 text-sm">
              Folosim cookie-uri ca să înțelegem ce reclame aduc oameni aici.
              Fără acceptul tău nu se încarcă niciunul.{' '}
              <a href="/cookies" className="underline">
                Detalii
              </a>
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => raspunde(false)}
                className="border-border min-h-[44px] flex-1 rounded-lg border px-4 text-sm font-medium sm:flex-none"
              >
                Refuz
              </button>
              <button
                type="button"
                onClick={() => raspunde(true)}
                className="bg-primary text-primary-foreground min-h-[44px] flex-1 rounded-lg px-4 text-sm font-medium sm:flex-none"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}
    </Context.Provider>
  )
}
