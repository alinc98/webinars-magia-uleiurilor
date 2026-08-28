'use client'

import { useActiuneFormular } from '@/lib/formular'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { trimiteMagicLink, verificaCod, type StareLogin, type StareCod } from './actions'

const initial: StareLogin = { ok: false }
const initialCod: StareCod = {}

export function FormularLogin({ redirectTo }: { redirectTo?: string }) {
  const { stare, onSubmit, inCurs: seTrimite } = useActiuneFormular(trimiteMagicLink, initial)

  if (stare.ok) {
    return <PasCod email={stare.email ?? ''} redirectTo={redirectTo} />
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <input type="hidden" name="redirectTo" value={redirectTo ?? ''} />

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" autoFocus />
      </div>

      {stare.mesaj && (
        <p role="alert" className="text-destructive text-sm">
          {stare.mesaj}
        </p>
      )}

      <Button type="submit" disabled={seTrimite}>
        {seTrimite ? 'Se trimite…' : 'Trimite-mi linkul'}
      </Button>
    </form>
  )
}

/**
 * Butonul din email deschide sesiunea doar în browserul care a cerut linkul.
 * Codul merge de oriunde — deci îl arătăm din prima, nu ascuns sub un „ai
 * probleme?”, ca omul care citește mailul pe telefon să aibă ce face.
 */
function PasCod({ email, redirectTo }: { email: string; redirectTo?: string }) {
  const { stare, onSubmit, inCurs: seVerifica } = useActiuneFormular(verificaCod, initialCod)

  return (
    <div className="flex flex-col gap-6">
      <div role="status" className="flex flex-col gap-2">
        <p className="font-medium">Verifică-ți emailul.</p>
        <p className="text-muted-foreground text-sm">
          Dacă adresa are acces, ți-am trimis un link. E valabil o oră.
        </p>
      </div>

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="redirectTo" value={redirectTo ?? ''} />

        <div className="flex flex-col gap-2">
          <Label htmlFor="cod">Sau introdu codul din email</Label>
          <Input
            id="cod"
            name="cod"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={10}
            placeholder="Codul din email"
            className="font-mono text-lg tracking-[0.25em]"
          />
          <p className="text-muted-foreground text-sm">
            Folosește codul dacă deschizi emailul pe alt dispozitiv decât cel de aici.
          </p>
        </div>

        {stare.mesaj && (
          <p role="alert" className="text-destructive text-sm">
            {stare.mesaj}
          </p>
        )}

        <Button type="submit" variant="outline" disabled={seVerifica}>
          {seVerifica ? 'Se verifică…' : 'Intră cu codul'}
        </Button>
      </form>
    </div>
  )
}
