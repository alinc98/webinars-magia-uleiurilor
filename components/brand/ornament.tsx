import { cn } from '@/lib/utils'

const ORNAMENTE = {
  'colt-ornament': { src: '/botanice/colt-ornament.svg', ratie: 1 },
  ramura: { src: '/botanice/ramura.svg', ratie: 96 / 64 },
  scanteie: { src: '/botanice/scanteie.svg', ratie: 1 },
  buchet: { src: '/botanice/buchet.svg', ratie: 1 },
  frunza: { src: '/botanice/frunza.svg', ratie: 1 },
} as const

export type NumeOrnament = keyof typeof ORNAMENTE

/**
 * Accente botanice desenate, la marginea secțiunilor.
 *
 * Opacitatea stă între 8 și 15% (brief §13): peste atât, concurează cu textul.
 * Sunt pur decorative, deci `aria-hidden` — un cititor de ecran n-are ce
 * anunța despre o ramură.
 *
 * Se folosește `mask` în loc de `<img>` ca să poată moșteni `currentColor`,
 * altfel n-ar respecta paleta secțiunii în care e pus.
 */
export function Ornament({
  nume,
  marime = 200,
  opacitate = 0.1,
  className,
}: {
  nume: NumeOrnament
  marime?: number
  opacitate?: number
  className?: string
}) {
  const { src, ratie } = ORNAMENTE[nume]

  return (
    <span
      aria-hidden
      className={cn('pointer-events-none absolute block bg-current', className)}
      style={{
        width: marime,
        height: marime * ratie,
        opacity: opacitate,
        maskImage: `url(${src})`,
        maskRepeat: 'no-repeat',
        maskSize: 'contain',
        maskPosition: 'center',
        WebkitMaskImage: `url(${src})`,
        WebkitMaskRepeat: 'no-repeat',
        WebkitMaskSize: 'contain',
        WebkitMaskPosition: 'center',
      }}
    />
  )
}
