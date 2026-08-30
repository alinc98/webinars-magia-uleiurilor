'use client'

import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import {
  dinOraRomaniei,
  grilaLunii,
  inOraRomaniei,
  NUME_LUNI,
  scrieOra,
  ZILE_SCURTE,
  type PartiOra,
} from '@/lib/ora'
import { cn } from '@/lib/utils'

const MINUTE = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]
const ORE = Array.from({ length: 24 }, (_, h) => h)

/**
 * Alegerea datei și orei unui eveniment.
 *
 * Înlocuiește `datetime-local`, din două motive. Cel serios: câmpul nativ
 * trimitea o oră fără fus, iar serverul o citea în fusul lui — pe Vercel, UTC.
 * O oră scrisă ca 22:00 ajungea în bază ca 22:00 UTC și reapărea la 01:00.
 * Aici trimitem un moment absolut, calculat mereu față de ora României.
 *
 * Cel de suprafață: fereastra nativă arată altfel în fiecare browser, în altă
 * limbă, și cu luni care încep duminica.
 *
 * Câmpul ascuns poartă ISO complet, cu `Z`. Schema refuză orice altceva, ca
 * eroarea de fus să nu se poată strecura înapoi.
 */
export function SelectorDataOra({
  nume,
  id,
  valoare,
}: {
  nume: string
  id: string
  /** Moment absolut, ISO. Gol înseamnă nimic ales. */
  valoare?: string | null
}) {
  const initial = valoare ? inOraRomaniei(new Date(valoare)) : null

  // Ziua şi ora stau separat, nu într-un singur obiect.
  //
  // Prima variantă le ţinea împreună, iar listele de oră erau dezactivate până
  // alegeai o zi — se vedea „19" şi nu răspundea la clic. Dar ora e o decizie
  // de sine stătătoare: omul o schimbă întâi, sau o schimbă fără să se atingă
  // de zi. Aşa, nimic nu e blocat niciodată.
  const [zi, setZi] = useState<Omit<PartiOra, 'ora' | 'minut'> | null>(
    initial ? { an: initial.an, luna: initial.luna, zi: initial.zi } : null
  )
  const [ora, setOra] = useState(initial?.ora ?? 19)
  const [minut, setMinut] = useState(initial?.minut ?? 0)

  const ales: PartiOra | null = zi ? { ...zi, ora, minut } : null

  const [deschis, setDeschis] = useState(false)
  const [luna, setLuna] = useState(() => {
    const acum = zi ?? inOraRomaniei(new Date())
    return { an: acum.an, luna: acum.luna }
  })

  const invelis = useRef<HTMLDivElement>(null)
  const coloanaOre = useRef<HTMLDivElement>(null)
  const coloanaMinute = useRef<HTMLDivElement>(null)

  // La deschidere, aducem valoarea aleasă în mijlocul coloanei.
  //
  // `scrollTop` calculat, nu `scrollIntoView`: acela derulează şi pagina din
  // spate, iar formularul îţi sare de sub ochi când deschizi calendarul.
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

  useEffect(() => {
    if (!deschis) return

    function laClic(ev: MouseEvent) {
      if (!invelis.current?.contains(ev.target as Node)) setDeschis(false)
    }
    function laTasta(ev: KeyboardEvent) {
      if (ev.key === 'Escape') setDeschis(false)
    }

    document.addEventListener('mousedown', laClic)
    document.addEventListener('keydown', laTasta)
    return () => {
      document.removeEventListener('mousedown', laClic)
      document.removeEventListener('keydown', laTasta)
    }
  }, [deschis])

  function mutaLuna(pas: number) {
    setLuna(({ an, luna }) => {
      const l = luna + pas
      if (l < 1) return { an: an - 1, luna: 12 }
      if (l > 12) return { an: an + 1, luna: 1 }
      return { an, luna: l }
    })
  }

  const azi = inOraRomaniei(new Date())
  const valoareTrimisa = ales ? dinOraRomaniei(ales).toISOString() : ''

  return (
    <div className="relative" ref={invelis}>
      <input type="hidden" name={nume} value={valoareTrimisa} />

      <button
        type="button"
        id={id}
        onClick={() => setDeschis((d) => !d)}
        aria-haspopup="dialog"
        aria-expanded={deschis}
        className={cn(
          'border-input flex h-8 w-full items-center justify-between gap-2 rounded-lg border px-2.5 py-1 text-left transition-colors',
          'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 outline-none',
          'md:text-sm'
        )}
      >
        <span className={ales ? '' : 'text-muted-foreground'}>
          {ales ? scrieOra(ales) : 'Alege data și ora'}
        </span>
        <CalendarDays className="text-muted-foreground size-4 shrink-0" />
      </button>

      {deschis && (
        <div
          role="dialog"
          aria-label="Alege data și ora"
          className="bg-admin-bg border-admin-border absolute z-30 mt-1 w-72 rounded-lg border p-3 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => mutaLuna(-1)}
              aria-label="Luna anterioară"
              className="hover:bg-admin-row-alt rounded p-1"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="text-sm font-medium">
              {NUME_LUNI[luna.luna - 1]} {luna.an}
            </span>
            <button
              type="button"
              onClick={() => mutaLuna(1)}
              aria-label="Luna următoare"
              className="hover:bg-admin-row-alt rounded p-1"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>

          <div className="text-text-muted mt-2 grid grid-cols-7 gap-0.5 text-center text-[11px]">
            {ZILE_SCURTE.map((z) => (
              <span key={z}>{z}</span>
            ))}
          </div>

          <div className="mt-1 grid grid-cols-7 gap-0.5">
            {grilaLunii(luna.an, luna.luna).map((zi, i) => {
              if (zi === null) return <span key={`gol-${i}`} />

              const esteAles =
                ales?.zi === zi && ales.luna === luna.luna && ales.an === luna.an
              const esteAzi =
                azi.zi === zi && azi.luna === luna.luna && azi.an === luna.an

              return (
                <button
                  key={zi}
                  type="button"
                  onClick={() => setZi({ an: luna.an, luna: luna.luna, zi })}
                  aria-pressed={esteAles}
                  className={cn(
                    'h-8 rounded text-sm tabular-nums',
                    esteAles
                      ? 'bg-primary-800 font-semibold text-white'
                      : 'hover:bg-admin-row-alt',
                    !esteAles && esteAzi && 'text-primary-800 font-semibold'
                  )}
                >
                  {zi}
                </button>
              )
            })}
          </div>

          {/* Coloane derulabile, nu `<select>`.
              Lista unui `select` o desenează sistemul de operare: altă
              tipografie, altă culoare, alt colţ rotunjit — exact contrastul pe
              care l-am scos de la calendar. Şi un meniu nativ se deschide
              peste panou, în afara lui, unde clicul îl închide. */}
          <div className="border-admin-border mt-3 grid grid-cols-2 gap-2 border-t pt-3">
            <Coloana
              eticheta="Ora"
              valori={ORE}
              ales={ora}
              alege={setOra}
              ref={coloanaOre}
            />
            <Coloana
              eticheta="Minutul"
              valori={MINUTE}
              ales={minut}
              alege={setMinut}
              ref={coloanaMinute}
            />
          </div>

          <div className="mt-3 flex items-center justify-between gap-2">
            <p className="text-text-muted text-[11px]">
              Ora României, oriunde ai fi.
            </p>
            <button
              type="button"
              onClick={() => setDeschis(false)}
              className="text-primary-800 text-sm font-medium"
            >
              Gata
            </button>
          </div>

        </div>
      )}
    </div>
  )
}

/**
 * O coloană derulabilă de valori, în locul listei native.
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
                  : 'hover:bg-admin-row-alt'
              )}
            >
              {String(v).padStart(2, '0')}
            </button>
          )
        })}
      </div>
    </div>
  )
}
