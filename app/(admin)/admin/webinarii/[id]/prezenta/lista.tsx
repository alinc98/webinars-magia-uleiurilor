'use client'

import { useOptimistic, useTransition } from 'react'

import { CapTabel, Celula, RandTabel, Tabel } from '@/components/admin/tabel'
import { formateazaDataScurta } from '@/lib/format'

import { comutaPrezenta } from './actions'

export type Inscris = {
  id: string
  name: string
  email: string
  registeredAt: string
  attended: boolean
}

/**
 * Bifele de prezență.
 *
 * `useOptimistic`, nu aşteptarea răspunsului: Andreea bifează douăsprezece
 * rânduri la rând, imediat după atelier, adesea de pe telefon. O bifă care
 * întârzie o secundă o face să apese a doua oară.
 *
 * Dacă serverul refuză, starea optimistă se retrage singură la următoarea
 * randare, iar rândul revine cum era.
 */
export function ListaPrezenta({
  webinarId,
  inscrisi,
}: {
  webinarId: string
  inscrisi: Inscris[]
}) {
  const [, porneste] = useTransition()
  const [optimist, seteazaOptimist] = useOptimistic(
    inscrisi,
    (stare, { id, prezent }: { id: string; prezent: boolean }) =>
      stare.map((i) => (i.id === id ? { ...i, attended: prezent } : i))
  )

  const prezenti = optimist.filter((i) => i.attended).length

  function comuta(id: string, prezent: boolean) {
    porneste(async () => {
      seteazaOptimist({ id, prezent })
      await comutaPrezenta(id, webinarId, prezent)
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-text-muted text-sm">
        <strong className="text-text-body font-semibold">{prezenti}</strong> din{' '}
        {optimist.length} au participat
      </p>

      <Tabel>
        <CapTabel coloane={['A participat', 'Nume', 'Email', 'Înscris']} />
        <tbody>
          {optimist.map((inscris, index) => (
            <RandTabel key={inscris.id} index={index}>
              <Celula>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={inscris.attended}
                    onChange={(ev) => comuta(inscris.id, ev.target.checked)}
                    className="accent-primary-800 size-4"
                    aria-label={`A participat: ${inscris.name}`}
                  />
                </label>
              </Celula>
              <Celula accentuat>{inscris.name}</Celula>
              <Celula discret>{inscris.email}</Celula>
              <Celula discret>{formateazaDataScurta(inscris.registeredAt)}</Celula>
            </RandTabel>
          ))}
        </tbody>
      </Tabel>
    </div>
  )
}
