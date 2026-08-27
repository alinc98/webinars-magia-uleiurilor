'use client'

import { useActionState, useState, useTransition } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { formateazaDataOra } from '@/lib/format'

import { actualizeazaContact, stergeContact, type StareContact } from './actions'

type Valori = {
  name: string
  email: string
  phone: string | null
  status: string
  tags: string[]
  notes: string | null
  consent_marketing: boolean
  consent_at: string | null
  consent_text_version: string | null
  unsubscribed_at: string | null
  first_utm_source: string | null
  first_utm_campaign: string | null
}

const initial: StareContact = { ok: false }

export function FisaContact({ id, valori }: { id: string; valori: Valori }) {
  const [stare, trimite, seTrimite] = useActionState(
    (s: StareContact, fd: FormData) => actualizeazaContact(id, s, fd),
    initial
  )
  const [deSters, setDeSters] = useState(false)
  const [inCurs, porneste] = useTransition()

  return (
    <div className="flex flex-col gap-5">
      <form action={trimite} className="flex flex-col gap-4 rounded-lg border p-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="c-name">Nume</Label>
          <Input id="c-name" name="name" defaultValue={valori.name} required />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="c-email">Email</Label>
          {/* Emailul e cheia contactului: modificarea lui ar rupe potrivirea cu
              înscrierile și cu email_log. Se schimbă doar prin ștergere. */}
          <Input id="c-email" value={valori.email} readOnly disabled />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="c-phone">Telefon</Label>
          <Input id="c-phone" name="phone" defaultValue={valori.phone ?? ''} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="c-status">Status</Label>
          <select
            id="c-status"
            name="status"
            defaultValue={valori.status}
            className="border-input h-9 rounded-md border px-3 text-sm"
          >
            <option value="nou">Nou</option>
            <option value="contactat">Contactat</option>
            <option value="interesat">Interesat</option>
            <option value="client">Client</option>
            <option value="inactiv">Inactiv</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="c-tags">Tag-uri</Label>
          <Input
            id="c-tags"
            name="tags"
            defaultValue={valori.tags.join(', ')}
            placeholder="separate prin virgulă"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="c-notes">Notă</Label>
          <Textarea id="c-notes" name="notes" rows={4} defaultValue={valori.notes ?? ''} />
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={seTrimite}>
            {seTrimite ? 'Se salvează…' : 'Salvează'}
          </Button>
          {stare.mesaj && (
            <p className={stare.ok ? 'text-sm text-emerald-600' : 'text-destructive text-sm'}>
              {stare.mesaj}
            </p>
          )}
        </div>
      </form>

      <section className="rounded-lg border p-4 text-sm">
        <h2 className="font-medium">Consimțământ</h2>
        <dl className="mt-2 flex flex-col gap-1">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Marketing</dt>
            <dd>{valori.consent_marketing ? 'acceptat' : 'nu'}</dd>
          </div>
          {valori.consent_at && (
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">La data de</dt>
              <dd>{formateazaDataOra(valori.consent_at)}</dd>
            </div>
          )}
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Versiunea textului</dt>
            <dd>{valori.consent_text_version ?? '—'}</dd>
          </div>
          {valori.unsubscribed_at && (
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Dezabonat la</dt>
              <dd>{formateazaDataOra(valori.unsubscribed_at)}</dd>
            </div>
          )}
        </dl>

        <h2 className="mt-4 font-medium">Prima atingere</h2>
        <dl className="mt-2 flex flex-col gap-1">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Sursă</dt>
            <dd>{valori.first_utm_source ?? '—'}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Campanie</dt>
            <dd>{valori.first_utm_campaign ?? '—'}</dd>
          </div>
        </dl>
      </section>

      <Button variant="destructive" onClick={() => setDeSters(true)}>
        Șterge definitiv contactul
      </Button>

      <Dialog open={deSters} onOpenChange={setDeSters}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ștergi definitiv acest contact?</DialogTitle>
            <DialogDescription>
              Numele, emailul, telefonul, notele, tag-urile și istoricul dispar
              și nu se pot recupera. Înscrierile rămân, dar anonimizate, ca
              numărul de participanți la evenimentele trecute să rămână corect.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeSters(false)}>
              Renunță
            </Button>
            <Button
              variant="destructive"
              disabled={inCurs}
              onClick={() => porneste(() => stergeContact(id))}
            >
              Da, șterge definitiv
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
