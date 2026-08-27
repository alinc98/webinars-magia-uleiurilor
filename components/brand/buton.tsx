import Link from 'next/link'

import { cn } from '@/lib/utils'

type Varianta = 'cta' | 'secundar' | 'ghost'
type Marime = 'md' | 'lg'

const VARIANTE: Record<Varianta, string> = {
  // Singura culoare caldă din pagină. Nimic altceva nu are voie s-o poarte.
  cta: 'bg-cta text-white hover:bg-cta-hover active:bg-cta-active border-transparent',
  secundar:
    'bg-transparent text-primary-800 border-primary-800 hover:bg-primary-50 active:bg-primary-100',
  ghost: 'bg-transparent text-primary-800 border-transparent hover:bg-primary-50',
}

const MARIMI: Record<Marime, string> = {
  md: 'min-h-touch px-6 text-base',
  lg: 'min-h-touch-cta px-8 text-base',
}

const BAZA =
  'inline-flex items-center justify-center gap-2 rounded-full border-[1.5px] font-semibold leading-none whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700 disabled:cursor-not-allowed disabled:bg-warm-200 disabled:text-warm-600 disabled:border-transparent'

function clase(varianta: Varianta, marime: Marime, latimeIntreaga?: boolean, extra?: string) {
  return cn(
    BAZA,
    VARIANTE[varianta],
    MARIMI[marime],
    latimeIntreaga && 'flex w-full min-h-touch-cta',
    extra
  )
}

export function Buton({
  varianta = 'cta',
  marime = 'md',
  latimeIntreaga,
  className,
  ...rest
}: React.ComponentProps<'button'> & {
  varianta?: Varianta
  marime?: Marime
  latimeIntreaga?: boolean
}) {
  return <button className={clase(varianta, marime, latimeIntreaga, className)} {...rest} />
}

export function ButonLink({
  varianta = 'cta',
  marime = 'md',
  latimeIntreaga,
  className,
  ...rest
}: React.ComponentProps<typeof Link> & {
  varianta?: Varianta
  marime?: Marime
  latimeIntreaga?: boolean
}) {
  return <Link className={clase(varianta, marime, latimeIntreaga, className)} {...rest} />
}
