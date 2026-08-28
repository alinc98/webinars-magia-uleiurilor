'use client'

import { useState, useTransition } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import { stergeWebinar } from '../actions'

/**
 * Ştergerea unui eveniment, cu numărul de înscrieri pus în faţă.
 *
 * „Eşti sigur?" nu ajută pe nimeni: omul e sigur că vrea să şteargă, nu ştie
 * ce pierde. Dialogul spune câte înscrieri pleacă odată cu evenimentul şi,
 * când există, propune `Anulat` — starea care scoate pagina de pe site fără să
 * arunce istoricul.
 */
export function StergeWebinar({
  id,
  inscrieri,
}: {
  id: string
  inscrieri: number
}) {
  const [deSters, setDeSters] = useState(false)
  const [inCurs, porneste] = useTransition()

  return (
    <div className="px-5 pb-8 md:px-8">
      <Button variant="destructive" onClick={() => setDeSters(true)}>
        Șterge evenimentul
      </Button>

      <Dialog open={deSters} onOpenChange={setDeSters}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ștergi definitiv acest eveniment?</DialogTitle>
            <DialogDescription>
              {inscrieri > 0 ? (
                <>
                  Pagina publică dispare, împreună cu cele {inscrieri} înscrieri
                  la el. Oamenii rămân în Lead-uri, dar nu se mai vede că au
                  fost înscriși aici, iar ștergerea nu se poate anula.
                  <br />
                  <br />
                  Dacă evenimentul chiar nu mai are loc, pune-i mai bine starea{' '}
                  <strong>Anulat</strong>: iese de pe site la fel, dar istoricul
                  rămâne.
                </>
              ) : (
                <>
                  Pagina publică dispare și nu se poate recupera. Evenimentul
                  n-are nicio înscriere, deci nu se pierde niciun istoric.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeSters(false)}>
              Renunță
            </Button>
            <Button
              variant="destructive"
              disabled={inCurs}
              onClick={() => porneste(() => void stergeWebinar(id))}
            >
              {inCurs ? 'Se șterge…' : 'Da, șterge definitiv'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
