'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'

import { formateazaDataOra, numesteEvenimentul } from '@/lib/format'

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
 */
export function BaraSticky({
  startsAt,
  format = 'online',
  gratuit = true,
}: {
  startsAt: string
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
    () => false
  )

  const text = montat ? ramas(startsAt) : null
  const trecut = montat && text === null
  void tic

  return (
    <div className="bg-surface-deep text-text-on-dark sticky top-0 z-40">
      <div className="mx-auto flex max-w-[var(--container-content)] flex-wrap items-center justify-center gap-x-3 gap-y-1 px-5 py-2 text-center">
        {trecut ? (
          <span className="text-caption">Următoarea întâlnire se anunță în curând.</span>
        ) : (
          <>
            <span className="text-caption font-semibold tracking-wide uppercase">
              {numesteEvenimentul(format)}
              {gratuit ? ' gratuit' : ''}
            </span>
            <span className="text-caption text-white/80">
              {formateazaDataOra(startsAt)}
            </span>
            {text && (
              <span className="text-caption bg-white/10 rounded-full px-2.5 py-0.5">
                începe în {text}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  )
}
