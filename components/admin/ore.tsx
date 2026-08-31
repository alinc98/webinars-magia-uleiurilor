'use client'

import { useEffect, useRef } from 'react'

import { cn } from '@/lib/utils'

export const ORE = Array.from({ length: 24 }, (_, h) => h)
export const MINUTE = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]

export const doua = (n: number) => String(n).padStart(2, '0')

/** „14:00" */
export function scrieCeas(ora: number, minut: number) {
  return `${doua(ora)}:${doua(minut)}`
}

/**
 * Închide un panou la clic în afara lui sau la Escape.
 *
 * Scos din selectorul de dată când a apărut al doilea panou, cel de oră: două
 * copii ale aceluiaşi efect ar fi divergat la prima corectură.
 */
export function useInchidereLaClicInAfara(
  deschis: boolean,
  invelis: React.RefObject<HTMLElement | null>,
  inchide: () => void,
) {
  useEffect(() => {
    if (!deschis) return

    function laClic(ev: MouseEvent) {
      if (!invelis.current?.contains(ev.target as Node)) inchide()
    }
    function laTasta(ev: KeyboardEvent) {
      if (ev.key === 'Escape') inchide()
    }

    document.addEventListener('mousedown', laClic)
    document.addEventListener('keydown', laTasta)
    return () => {
      document.removeEventListener('mousedown', laClic)
      document.removeEventListener('keydown', laTasta)
    }
  }, [deschis, invelis, inchide])
}

/**
 * Cele două coloane derulabile, ora şi minutul.
 *
 * Nu `<select>`: lista lui o desenează sistemul de operare — altă tipografie,
 * altă culoare, alt colţ rotunjit — exact contrastul pe care l-am scos de la
 * calendar. Şi un meniu nativ se deschide peste panou, în afara lui, unde
 * clicul îl închide.
 */
export function ColoaneOra({
  deschis,
  ora,
  minut,
  alegeOra,
  alegeMinut,
}: {
  /** La deschidere, valorile alese se aduc în mijlocul coloanelor. */
  deschis: boolean
  ora: number
  minut: number
  alegeOra: (v: number) => void
  alegeMinut: (v: number) => void
}) {
  const coloanaOre = useRef<HTMLDivElement>(null)
  const coloanaMinute = useRef<HTMLDivElement>(null)

  // `scrollTop` calculat, nu `scrollIntoView`: acela derulează şi pagina din
  // spate, iar formularul îţi sare de sub ochi când deschizi panoul.
  useEffect(() => {
    if (!deschis) return

    for (const coloana of [coloanaOre, coloanaMinute]) {
      const cutie = coloana.current
      const activ = cutie?.querySelector<HTMLElement>('[data-ales="true"]')
      if (cutie && activ) {
        cutie.scrollTop =
          activ.offsetTop - cutie.clientHeight / 2 + activ.clientHeight / 2
      }
    }
  }, [deschis])

  return (
    <div className="grid grid-cols-2 gap-2">
      <Coloana
        eticheta="Ora"
        valori={ORE}
        ales={ora}
        alege={alegeOra}
        ref={coloanaOre}
      />
      <Coloana
        eticheta="Minutul"
        valori={MINUTE}
        ales={minut}
        alege={alegeMinut}
        ref={coloanaMinute}
      />
    </div>
  )
}

/**
 * O coloană derulabilă de valori.
 *
 * `relative` pe cutie nu e decor: fără el, `offsetParent` al butoanelor e
 * panoul întreg, iar `offsetTop` folosit la derulare dă poziţia faţă de acela.
 * Coloana sărea la fund în loc să centreze valoarea aleasă.
 */
function Coloana({
  eticheta,
  valori,
  ales,
  alege,
  ref,
}: {
  eticheta: string
  valori: number[]
  ales: number
  alege: (v: number) => void
  ref: React.RefObject<HTMLDivElement | null>
}) {
  return (
    <div>
      <p className="text-text-muted mb-1 text-[11px]">{eticheta}</p>
      <div
        ref={ref}
        role="listbox"
        aria-label={eticheta}
        className="border-admin-border relative h-36 overflow-y-auto rounded-lg border p-1"
      >
        {valori.map((v) => {
          const esteAles = v === ales
          return (
            <button
              key={v}
              type="button"
              role="option"
              aria-selected={esteAles}
              data-ales={esteAles}
              onClick={() => alege(v)}
              className={cn(
                'block w-full rounded px-2 py-1 text-center text-sm tabular-nums',
                esteAles
                  ? 'bg-primary-800 font-semibold text-white'
                  : 'hover:bg-admin-row-alt',
              )}
            >
              {doua(v)}
            </button>
          )
        })}
      </div>
    </div>
  )
}
