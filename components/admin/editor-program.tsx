'use client'

import { useRef, useState } from 'react'

import {
  SelectorDataOra,
  SelectorOra,
} from '@/components/admin/selector-data-ora'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { dinOraRomaniei, inOraRomaniei } from '@/lib/ora'
import { durataTotala, formateazaProgramScurt } from '@/lib/program'

export type SesiuneInitiala = {
  starts_at: string
  ends_at: string
  label?: string | null
}

type Rand = {
  /** Stabilă cât trăieşte rândul: la ştergerea unuia din mijloc, React nu
      trebuie să creadă că s-a schimbat conţinutul celor de sub el. */
  cheie: number
  /** Moment absolut, ISO. Gol până se alege o zi. */
  start: string
  oraFinal: number
  minutFinal: number
  label: string
}

/** Ziua din `start`, cu altă oră. Trece corect peste graniţa de lună şi de an. */
function laAceeasiZi(
  start: string,
  ora: number,
  minut: number,
  plusZile = 0,
): Date {
  const p = inOraRomaniei(new Date(start))
  const d = new Date(Date.UTC(p.an, p.luna - 1, p.zi + plusZile))
  return dinOraRomaniei({
    an: d.getUTCFullYear(),
    luna: d.getUTCMonth() + 1,
    zi: d.getUTCDate(),
    ora,
    minut,
  })
}

/**
 * Momentul în care se termină o întâlnire.
 *
 * Ora de final se alege fără dată: ziua o dă începutul. Când ora aleasă cade
 * înaintea celei de start — un atelier de seară, 22:00–01:00 — o citim ca
 * fiind a doua zi. Regula e corectă, dar invizibilă, aşa că rândul scrie „se
 * termină a doua zi" sub câmp.
 */
function calculeazaFinal(rand: Rand): { iso: string; aDouaZi: boolean } {
  if (!rand.start) return { iso: '', aDouaZi: false }

  const start = new Date(rand.start).getTime()
  const aceeasiZi = laAceeasiZi(rand.start, rand.oraFinal, rand.minutFinal)

  if (aceeasiZi.getTime() > start) {
    return { iso: aceeasiZi.toISOString(), aDouaZi: false }
  }

  const urmatoarea = laAceeasiZi(rand.start, rand.oraFinal, rand.minutFinal, 1)
  return { iso: urmatoarea.toISOString(), aDouaZi: true }
}

function randDin(s: SesiuneInitiala, cheie: number): Rand {
  const final = inOraRomaniei(new Date(s.ends_at))
  return {
    cheie,
    start: new Date(s.starts_at).toISOString(),
    oraFinal: final.ora,
    minutFinal: final.minut,
    label: s.label ?? '',
  }
}

const RAND_NOU: Omit<Rand, 'cheie'> = {
  start: '',
  oraFinal: 20,
  minutFinal: 30,
  label: '',
}

/**
 * Programul unui eveniment: una sau mai multe întâlniri.
 *
 * Un eveniment de o seară arată aproape ca înainte — un singur rând, fără
 * listă vizibilă în jurul lui şi fără câmpul de etichetă. Lista apare abia
 * când chiar sunt mai multe zile.
 *
 * Rândurile pleacă spre server ca trei liste paralele — `sesiune_start`,
 * `sesiune_end`, `sesiune_label` — împerecheate după poziţie, ca perechile de
 * la FAQ. Nu numerotăm câmpurile: la ştergerea unui rând din mijloc, indicii ar
 * trebui recalculaţi, iar `getAll` păstrează oricum ordinea din document.
 */
export function EditorProgram({
  initiale,
  erori,
}: {
  initiale: SesiuneInitiala[]
  erori: Record<string, string>
}) {
  const urmatoareaCheie = useRef(initiale.length)
  const [randuri, setRanduri] = useState<Rand[]>(() =>
    initiale.length > 0 ? initiale.map(randDin) : [{ ...RAND_NOU, cheie: 0 }],
  )

  const finaluri = randuri.map(calculeazaFinal)
  const complete = randuri
    .map((r, i) => ({ starts_at: r.start, ends_at: finaluri[i].iso }))
    .filter((s) => s.starts_at && s.ends_at)
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at))

  function schimba(i: number, schimbari: Partial<Rand>) {
    setRanduri((curent) =>
      curent.map((r, j) => (j === i ? { ...r, ...schimbari } : r)),
    )
  }

  function adaugaZi() {
    const ultimul = randuri[randuri.length - 1]
    urmatoareaCheie.current += 1

    setRanduri((curent) => [
      ...curent,
      {
        cheie: urmatoareaCheie.current,
        // Cazul obişnuit e acelaşi interval, ziua următoare. Nimeni nu vrea să
        // reintroducă 10:00–14:00 de trei ori.
        start: ultimul.start
          ? laAceeasiZi(
              ultimul.start,
              inOraRomaniei(new Date(ultimul.start)).ora,
              inOraRomaniei(new Date(ultimul.start)).minut,
              1,
            ).toISOString()
          : '',
        oraFinal: ultimul.oraFinal,
        minutFinal: ultimul.minutFinal,
        label: '',
      },
    ])
  }

  const maiMulte = randuri.length > 1

  return (
    <div className="flex flex-col gap-3">
      <div>
        {/* Nu `Label`: e titlul unui grup, nu eticheta unui singur control. */}
        <p className="text-sm font-medium">Program</p>
        <p className="text-muted-foreground text-xs">
          O singură întâlnire la evenimentele obișnuite. Adaugă zile pentru un
          atelier care se întinde pe mai multe.
        </p>
      </div>

      {randuri.map((rand, i) => {
        const final = finaluri[i]
        const eroare =
          erori[`sessions.${i}.starts_at`] ?? erori[`sessions.${i}.ends_at`]

        return (
          <div
            key={rand.cheie}
            className="border-brand-border flex flex-col gap-2 rounded-md border p-3"
          >
            {maiMulte && (
              <div className="flex items-center justify-between">
                <p className="text-text-muted text-xs font-medium">
                  Ziua {i + 1}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label={`Șterge ziua ${i + 1}`}
                  onClick={() =>
                    setRanduri((curent) => curent.filter((_, j) => j !== i))
                  }
                >
                  Șterge
                </Button>
              </div>
            )}

            <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <div>
                <p className="text-text-muted mb-1 text-[11px]">Începe</p>
                <SelectorDataOra
                  nume="sesiune_start"
                  id={`sesiune-start-${rand.cheie}`}
                  valoare={rand.start || null}
                  laSchimbare={(iso) => schimba(i, { start: iso })}
                />
              </div>
              <div>
                <p className="text-text-muted mb-1 text-[11px]">Se termină</p>
                <SelectorOra
                  ora={rand.oraFinal}
                  minut={rand.minutFinal}
                  etichetaAria={`Ora la care se termină ziua ${i + 1}`}
                  laSchimbare={(ora, minut) =>
                    schimba(i, { oraFinal: ora, minutFinal: minut })
                  }
                />
              </div>
            </div>

            {maiMulte && (
              <Input
                aria-label={`Eticheta zilei ${i + 1}`}
                value={rand.label}
                placeholder={`Ziua ${i + 1}: titlu scurt (opțional)`}
                onChange={(ev) => schimba(i, { label: ev.target.value })}
              />
            )}

            <input type="hidden" name="sesiune_end" value={final.iso} />
            <input type="hidden" name="sesiune_label" value={rand.label} />

            {final.aDouaZi && (
              <p className="text-text-muted text-xs">
                Se termină a doua zi dimineața.
              </p>
            )}

            {eroare && (
              <p className="text-destructive text-sm" role="alert">
                {eroare}
              </p>
            )}
          </div>
        )
      })}

      {erori.sessions && (
        <p className="text-destructive text-sm" role="alert">
          {erori.sessions}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button type="button" variant="outline" size="sm" onClick={adaugaZi}>
          Adaugă o zi
        </Button>

        {complete.length > 0 && (
          <p className="text-text-muted text-xs">
            Pe site: {formateazaProgramScurt(complete)} ·{' '}
            {durataTotala(complete)}
          </p>
        )}
      </div>
    </div>
  )
}
