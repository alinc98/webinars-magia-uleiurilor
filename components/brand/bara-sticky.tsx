'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'

import { numesteEvenimentul } from '@/lib/format'
import {
  formateazaProgramScurt,
  stareaProgramului,
  type Sesiune,
} from '@/lib/program'

function ramas(pana: string) {
  const diferenta = new Date(pana).getTime() - Date.now()
  if (diferenta <= 0) return null

  const minuteTotal = Math.floor(diferenta / 60_000)
  const zile = Math.floor(minuteTotal / 1440)
  const ore = Math.floor((minuteTotal % 1440) / 60)
  const minute = minuteTotal % 60

  if (zile > 0) return `${zile} ${zile === 1 ? 'zi' : 'zile'} și ${ore} h`
  if (ore > 0) return `${ore} h ${minute} min`
  return `${minute} min`
}

/**
 * Bara de sus, cu numărătoare inversă.
 *
 * După încheierea evenimentului se transformă singură, fără să fie nevoie de
 * o schimbare în admin (brief §12.1). Numărătoarea pornește abia după montare,
 * altfel serverul și clientul ar randa valori diferite.
 *
 * Numără spre **următoarea** întâlnire, nu spre prima. La un atelier de trei
 * zile, varianta veche ar fi scris „se anunță în curând" în seara primei zile,
 * cu două zile de atelier încă în față.
 */
export function BaraSticky({
  sesiuni,
  format = 'online',
  gratuit = true,
}: {
  sesiuni: Sesiune[]
  format?: string
  gratuit?: boolean
}) {
  // Trecerea timpului e o sursă externă, nu stare React. Un interval care
  // apelează setState direct din efect declanșează randări în cascadă; aici
  // React resubscrie singur când tick-ul anunță o schimbare.
  const [tic, setTic] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setTic((n) => n + 1), 30_000)
    return () => clearInterval(t)
  }, [])

  const montat = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )
  void tic

  // Înainte de montare nu ştim cât e ceasul la om, deci arătăm programul
  // întreg, fără numărătoare — exact ce randează şi serverul.
  const stare = montat ? stareaProgramului(sesiuni) : null
  const text =
    stare?.stare === 'inainte' ? ramas(stare.sesiune.starts_at) : null

  return (
    <div className="bg-surface-deep text-text-on-dark sticky top-0 z-40">
      <div className="mx-auto flex max-w-[var(--container-content)] flex-wrap items-center justify-center gap-x-3 gap-y-1 px-5 py-2 text-center">
        {stare?.stare === 'trecut' ? (
          <span className="text-caption">
            Următoarea întâlnire se anunță în curând.
          </span>
        ) : (
          <>
            <span className="text-caption font-semibold tracking-wide uppercase">
              {numesteEvenimentul(format)}
              {gratuit ? ' gratuit' : ''}
            </span>
            <span className="text-caption text-white/80">
              {formateazaProgramScurt(sesiuni)}
            </span>
            {stare?.stare === 'in_curs' && (
              <span className="text-caption rounded-full bg-white/10 px-2.5 py-0.5">
                {sesiuni.length > 1
                  ? `ziua ${stare.index + 1}, în desfășurare`
                  : 'în desfășurare'}
              </span>
            )}
            {text && (
              <span className="text-caption rounded-full bg-white/10 px-2.5 py-0.5">
                {stare && stare.stare === 'inainte' && stare.index > 0
                  ? `ziua ${stare.index + 1} începe în ${text}`
                  : `începe în ${text}`}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  )
}
