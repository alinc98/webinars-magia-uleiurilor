'use client'

import { useActionState, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formateazaDataOra } from '@/lib/format'

import { anuntaLista, type StareAnunt } from './actions'

const initial: StareAnunt = { ok: false }

export function PanouAnunt({
  neanuntati,
  webinarii,
}: {
  neanuntati: number
  webinarii: { id: string; title: string; starts_at: string }[]
}) {
  const [ales, setAles] = useState(webinarii[0]?.id ?? '')
  const [confirm, setConfirm] = useState(false)
  const [stare, trimite, seTrimite] = useActionState(
    (s: StareAnunt, fd: FormData) => anuntaLista(ales, s, fd),
    initial
  )

  const webinar = webinarii.find((w) => w.id === ales)

  return (
    <section className="rounded-lg border p-4">
      <h2 className="font-medium">Anunță lista</h2>
      <p className="text-muted-foreground mt-1 text-sm">
        {neanuntati === 0
          ? 'Toți cei de pe listă au fost deja anunțați.'
          : `${neanuntati} ${neanuntati === 1 ? 'persoană așteaptă' : 'persoane așteaptă'} să afle despre următorul eveniment.`}
      </p>

      {webinarii.length === 0 ? (
        <p className="text-muted-foreground mt-3 text-sm">
          Publică întâi un webinar, apoi îl poți anunța aici.
        </p>
      ) : (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <select
            value={ales}
            onChange={(e) => setAles(e.target.value)}
            className="border-input h-9 min-w-0 flex-1 rounded-md border px-3 text-sm"
            aria-label="Webinarul de anunțat"
          >
            {webinarii.map((w) => (
              <option key={w.id} value={w.id}>
                {w.title} — {formateazaDataOra(w.starts_at)}
              </option>
            ))}
          </select>
          <Button disabled={neanuntati === 0 || seTrimite} onClick={() => setConfirm(true)}>
            Anunță lista
          </Button>
        </div>
      )}

      {stare.mesaj && (
        <p role="status" className="mt-3 text-sm text-emerald-600">
          {stare.mesaj}
        </p>
      )}

      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Trimiți anunțul?</DialogTitle>
            <DialogDescription>
              {neanuntati} {neanuntati === 1 ? 'persoană va primi' : 'persoane vor primi'} un
              email despre <strong>{webinar?.title}</strong>. Cei deja anunțați
              nu primesc din nou.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirm(false)}>
              Renunță
            </Button>
            <form action={trimite} onSubmit={() => setConfirm(false)}>
              <Button type="submit" disabled={seTrimite}>
                {seTrimite ? 'Se trimite…' : 'Trimite'}
              </Button>
            </form>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
