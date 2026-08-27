'use client'

import { useActiuneFormular } from '@/lib/formular'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { trimiteMagicLink, type StareLogin } from './actions'

const initial: StareLogin = { ok: false }

export function FormularLogin({ redirectTo }: { redirectTo?: string }) {
  const { stare, onSubmit, inCurs: seTrimite } = useActiuneFormular(trimiteMagicLink, initial)

  if (stare.ok) {
    return (
      <div role="status" className="flex flex-col gap-2">
        <p className="font-medium">Verifică-ți emailul.</p>
        <p className="text-muted-foreground text-sm">
          Dacă adresa are acces, ți-am trimis un link. E valabil o oră.
        </p>
      </div>
    )
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
