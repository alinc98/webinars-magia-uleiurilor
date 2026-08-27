'use client'

import { useActionState, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

import { publicaConsimtamant, salveazaRetentie, type StareSetari } from './actions'

const initial: StareSetari = { ok: false }

function Mesaj({ stare }: { stare: StareSetari }) {
  if (!stare.mesaj) return null
  return (
    <p
      role="status"
      className={stare.ok ? 'text-sm text-emerald-600' : 'text-destructive text-sm'}
    >
      {stare.mesaj}
    </p>
  )
}

export function FormularConsimtamant({
  versiuneCurenta,
  textCurent,
}: {
  versiuneCurenta: string
  textCurent: string
}) {
  const [stare, trimite, seTrimite] = useActionState(publicaConsimtamant, initial)
  const [text, setText] = useState(textCurent)

  const modificat = text.trim() !== textCurent.trim()

  return (
    <form action={trimite} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="body">Textul de sub căsuța de bifat</Label>
        <Textarea
          id="body"
          name="body"
          rows={5}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <p className="text-muted-foreground text-xs">
          Versiunea activă: <strong>{versiuneCurenta}</strong>. Textul nu se
          rescrie — publici o versiune nouă, iar cine a acceptat-o pe cea veche
          rămâne legat de ea.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex min-w-[180px] flex-col gap-1.5">
          <Label htmlFor="version">Versiunea nouă</Label>
          <Input id="version" name="version" placeholder="2026-09-v1" required />
        </div>
        <Button type="submit" disabled={seTrimite || !modificat}>
          {seTrimite ? 'Se publică…' : 'Publică versiunea'}
        </Button>
        {!modificat && (
          <p className="text-muted-foreground text-sm">
            Modifică textul ca să poți publica o versiune nouă.
          </p>
        )}
      </div>

      <Mesaj stare={stare} />
    </form>
  )
}

export function FormularRetentie({ luni }: { luni: number }) {
  const [stare, trimite, seTrimite] = useActionState(salveazaRetentie, initial)

  return (
    <form action={trimite} className="flex flex-wrap items-end gap-3">
      <div className="flex w-32 flex-col gap-1.5">
        <Label htmlFor="retentie_luni">Luni</Label>
        <Input
          id="retentie_luni"
          name="retentie_luni"
          type="number"
          min={1}
          max={120}
          defaultValue={luni}
        />
      </div>
      <Button type="submit" variant="outline" disabled={seTrimite}>
        Salvează
      </Button>
      <Mesaj stare={stare} />
    </form>
  )
}
