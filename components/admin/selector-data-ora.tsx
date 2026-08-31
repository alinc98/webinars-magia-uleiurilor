'use client'

import { CalendarDays, Clock } from 'lucide-react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import {
  ColoaneOra,
  scrieCeas,
  useInchidereLaClicInAfara,
} from '@/components/admin/ore'
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

const CLASE_BUTON =
  'border-input flex h-8 w-full items-center justify-between gap-2 rounded-lg border px-2.5 py-1 text-left transition-colors focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 outline-none md:text-sm'

const CLASE_PANOU =
  'bg-admin-bg border-admin-border absolute z-30 mt-1 rounded-lg border p-3 shadow-lg'

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
  laSchimbare,
}: {
  nume: string
  id: string
  /** Moment absolut, ISO. Gol înseamnă nimic ales. Citit doar la montare. */
  valoare?: string | null
  /**
   * Anunţă valoarea curentă, când există cineva care are nevoie de ea în timp
   * real — editorul de program, care calculează ora de final pornind de la ziua
   * de început. Câmpul ascuns rămâne oricum sursa a ce se trimite.
   */
  laSchimbare?: (iso: string) => void
}) {
  const initial = valoare ? inOraRomaniei(new Date(valoare)) : null

  // Ziua şi ora stau separat, nu într-un singur obiect.
  //
  // Prima variantă le ţinea împreună, iar listele de oră erau dezactivate până
  // alegeai o zi — se vedea „19" şi nu răspundea la clic. Dar ora e o decizie
  // de sine stătătoare: omul o schimbă întâi, sau o schimbă fără să se atingă
  // de zi. Aşa, nimic nu e blocat niciodată.
  const [zi, setZi] = useState<Omit<PartiOra, 'ora' | 'minut'> | null>(
    initial ? { an: initial.an, luna: initial.luna, zi: initial.zi } : null,
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
  useInchidereLaClicInAfara(deschis, invelis, () => setDeschis(false))

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

  // Doar la schimbare reală: apelul se face dintr-un efect, iar un părinte
  // care-şi actualizează starea la fiecare randare ar intra în buclă.
  const ultimaAnuntata = useRef<string | null>(null)
  useEffect(() => {
    if (ultimaAnuntata.current === valoareTrimisa) return
    ultimaAnuntata.current = valoareTrimisa
    laSchimbare?.(valoareTrimisa)
  }, [valoareTrimisa, laSchimbare])

  return (
    <div className="relative" ref={invelis}>
      <input type="hidden" name={nume} value={valoareTrimisa} />

      <button
        type="button"
        id={id}
        onClick={() => setDeschis((d) => !d)}
        aria-haspopup="dialog"
        aria-expanded={deschis}
        className={CLASE_BUTON}
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
          className={cn(CLASE_PANOU, 'w-72')}
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
                ales?.zi === zi &&
                ales.luna === luna.luna &&
                ales.an === luna.an
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
                    !esteAles && esteAzi && 'text-primary-800 font-semibold',
                  )}
                >
                  {zi}
                </button>
              )
            })}
          </div>

          <div className="border-admin-border mt-3 border-t pt-3">
            <ColoaneOra
              deschis={deschis}
              ora={ora}
              minut={minut}
              alegeOra={setOra}
              alegeMinut={setMinut}
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
 * Doar ora, fără dată.
 *
 * Ora la care se termină o întâlnire n-are nevoie de un calendar: ziua o dă
 * începutul. Când ora aleasă cade înaintea celei de start, editorul de program
 * o citeşte ca fiind a doua zi — şi scrie asta sub câmp, ca regula să nu fie
 * invizibilă.
 */
export function SelectorOra({
  id,
  ora,
  minut,
  laSchimbare,
  etichetaAria,
}: {
  id?: string
  ora: number
  minut: number
  laSchimbare: (ora: number, minut: number) => void
  etichetaAria?: string
}) {
  const [deschis, setDeschis] = useState(false)
  const invelis = useRef<HTMLDivElement>(null)
  useInchidereLaClicInAfara(deschis, invelis, () => setDeschis(false))

  return (
    <div className="relative" ref={invelis}>
      <button
        type="button"
        id={id}
        aria-label={etichetaAria}
        onClick={() => setDeschis((d) => !d)}
        aria-haspopup="dialog"
        aria-expanded={deschis}
        className={CLASE_BUTON}
      >
        <span className="tabular-nums">{scrieCeas(ora, minut)}</span>
        <Clock className="text-muted-foreground size-4 shrink-0" />
      </button>

      {deschis && (
        <div
          role="dialog"
          aria-label="Alege ora"
          // Ancorat pe dreapta: câmpul stă la capătul rândului, iar un panou
          // pornit din stânga lui ieşea din pagină şi aducea o bară de derulare
          // orizontală peste tot formularul.
          className={cn(CLASE_PANOU, 'right-0 w-52')}
        >
          <ColoaneOra
            deschis={deschis}
            ora={ora}
            minut={minut}
            alegeOra={(v) => laSchimbare(v, minut)}
            alegeMinut={(v) => laSchimbare(ora, v)}
          />
          <div className="mt-3 flex justify-end">
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
