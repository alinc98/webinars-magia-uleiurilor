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

  const [ales, setAles] = useState<PartiOra | null>(initial)
  const [deschis, setDeschis] = useState(false)
  const [luna, setLuna] = useState(() => {
    const acum = ales ?? inOraRomaniei(new Date())
    return { an: acum.an, luna: acum.luna }
  })

  const invelis = useRef<HTMLDivElement>(null)

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

  function alegeZiua(zi: number) {
    // Ora implicită la prima alegere: 19:00, cea mai obișnuită la webinarii.
    setAles((curent) => ({
      an: luna.an,
      luna: luna.luna,
      zi,
      ora: curent?.ora ?? 19,
      minut: curent?.minut ?? 0,
    }))
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
                  onClick={() => alegeZiua(zi)}
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

          <div className="border-admin-border mt-3 flex items-center gap-2 border-t pt-3">
            <span className="text-text-muted text-xs">Ora</span>
            <select
              aria-label="Ora"
              value={ales?.ora ?? 19}
              disabled={!ales}
              onChange={(ev) =>
                setAles((c) => (c ? { ...c, ora: Number(ev.target.value) } : c))
              }
              className="border-input h-8 rounded-lg border bg-transparent px-2 text-sm tabular-nums"
            >
              {Array.from({ length: 24 }, (_, h) => (
                <option key={h} value={h}>
                  {String(h).padStart(2, '0')}
                </option>
              ))}
            </select>
            <span className="text-text-muted">:</span>
            <select
              aria-label="Minutul"
              value={ales?.minut ?? 0}
              disabled={!ales}
              onChange={(ev) =>
                setAles((c) => (c ? { ...c, minut: Number(ev.target.value) } : c))
              }
              className="border-input h-8 rounded-lg border bg-transparent px-2 text-sm tabular-nums"
            >
              {MINUTE.map((m) => (
                <option key={m} value={m}>
                  {String(m).padStart(2, '0')}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setDeschis(false)}
              className="text-primary-800 ml-auto text-sm font-medium"
            >
              Gata
            </button>
          </div>

          <p className="text-text-muted mt-2 text-[11px]">
            Ora României, indiferent de unde completezi.
          </p>
        </div>
      )}
    </div>
  )
}
