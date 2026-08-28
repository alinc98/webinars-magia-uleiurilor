'use client'

import { useState, useTransition } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useActiuneFormular } from '@/lib/formular'

import {
  adaugaAdmin,
  publicaConsimtamant,
  salveazaRetentie,
  schimbaRolAdmin,
  stergeAdmin,
  type StareSetari,
} from './actions'

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
  const { stare, onSubmit, inCurs: seTrimite } = useActiuneFormular(publicaConsimtamant, initial)
  const [text, setText] = useState(textCurent)

  const modificat = text.trim() !== textCurent.trim()

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-3">
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
  const { stare, onSubmit, inCurs: seTrimite } = useActiuneFormular(salveazaRetentie, initial)

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-wrap items-end gap-3">
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


export type Administrator = {
  id: string
  email: string
  name: string | null
  role: 'owner' | 'editor'
  last_login_at: string | null
}

/**
 * Lista albă de acces.
 *
 * Proprietarul poate adăuga și scoate oameni; editorul face restul, dar nu
 * umblă la accesul altora.
 */
export function GestiuneAdmini({
  administratori,
  suntEu,
  potGestiona,
}: {
  administratori: Administrator[]
  suntEu: string
  potGestiona: boolean
}) {
  const {
    stare: stareAdaugare,
    onSubmit: adauga,
    inCurs: seAdauga,
  } = useActiuneFormular(adaugaAdmin, initial)
  const [mesaj, setMesaj] = useState<StareSetari | null>(null)
  const [inCurs, porneste] = useTransition()

  return (
    <div className="flex flex-col gap-4">
      <ul className="divide-brand-border divide-y">
        {administratori.map((a) => {
          const eu = a.id === suntEu
          return (
            <li key={a.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 text-sm">
              <div className="min-w-0">
                <p className="font-medium">
                  {a.name ?? a.email}
                  {eu && <span className="text-text-muted font-normal"> · tu</span>}
                </p>
                <p className="text-text-muted text-xs break-all">{a.email}</p>
              </div>

              <div className="ml-auto flex items-center gap-2">
                {potGestiona && !eu ? (
                  <select
                    value={a.role}
                    onChange={(e) =>
                      porneste(async () => {
                        setMesaj(await schimbaRolAdmin(a.id, e.target.value as 'owner' | 'editor'))
                      })
                    }
                    disabled={inCurs}
                    className="border-input h-8 rounded-md border px-2 text-xs"
                    aria-label={`Rolul lui ${a.email}`}
                  >
                    <option value="owner">proprietar</option>
                    <option value="editor">editor</option>
                  </select>
                ) : (
                  <span className="text-text-muted text-xs">
                    {a.role === 'owner' ? 'proprietar' : 'editor'}
                  </span>
                )}

                {potGestiona && !eu && (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={inCurs}
                    onClick={() =>
                      porneste(async () => {
                        setMesaj(await stergeAdmin(a.id))
                      })
                    }
                  >
                    Scoate
                  </Button>
                )}
              </div>
            </li>
          )
        })}
      </ul>

      {potGestiona && (
        <form onSubmit={adauga} noValidate className="flex flex-wrap items-end gap-2">
          <div className="flex min-w-[220px] flex-1 flex-col gap-1.5">
            <Label htmlFor="admin-email">Adaugă o adresă</Label>
            <Input id="admin-email" name="email" type="email" placeholder="nume@exemplu.ro" required />
          </div>
          <div className="flex w-40 flex-col gap-1.5">
            <Label htmlFor="admin-name">Nume</Label>
            <Input id="admin-name" name="name" placeholder="opțional" />
          </div>
          <div className="flex w-36 flex-col gap-1.5">
            <Label htmlFor="admin-role">Rol</Label>
            <select
              id="admin-role"
              name="role"
              defaultValue="editor"
              className="border-input h-9 rounded-md border px-2 text-sm"
            >
              <option value="editor">editor</option>
              <option value="owner">proprietar</option>
            </select>
          </div>
          <Button type="submit" variant="outline" disabled={seAdauga}>
            {seAdauga ? 'Se adaugă…' : 'Adaugă'}
          </Button>
        </form>
      )}

      {(stareAdaugare.mesaj || mesaj?.mesaj) && (
        <Mesaj stare={mesaj?.mesaj ? mesaj : stareAdaugare} />
      )}

      {potGestiona && (
        <p className="text-text-muted text-xs">
          Nu e nevoie de invitație sau parolă. La prima autentificare, contul se
          creează singur — adresa trebuie doar să fie pe listă.
        </p>
      )}
    </div>
  )
}
