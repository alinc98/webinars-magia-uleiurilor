import { cn } from '@/lib/utils'

/** Eticheta mică de deasupra unui titlu. */
export function Supratitlu({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        'text-overline text-sage-700 font-semibold tracking-[0.14em] uppercase',
        className
      )}
    >
      {children}
    </p>
  )
}

export function Titlu1({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h1
      className={cn(
        'font-display text-h1 text-text-heading font-semibold text-balance',
        className
      )}
    >
      {children}
    </h1>
  )
}

export function Titlu2({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h2 className={cn('font-display text-h2 text-text-heading font-semibold', className)}>
      {children}
    </h2>
  )
}

export function Titlu3({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 className={cn('font-display text-h3 text-text-heading font-semibold', className)}>
      {children}
    </h3>
  )
}

const TONURI = {
  neutru: 'bg-warm-100 text-warm-800 border-warm-200',
  sage: 'bg-sage-50 text-sage-800 border-sage-200',
  gold: 'bg-gold-50 text-gold-text border-gold-200',
} as const

export function Insigna({
  ton = 'neutru',
  children,
}: {
  ton?: keyof typeof TONURI
  children: React.ReactNode
}) {
  return (
    <span
      className={cn(
        'text-body-sm inline-flex items-center gap-1.5 rounded-full border px-3 py-1',
        TONURI[ton]
      )}
    >
      {children}
    </span>
  )
}

export function Card({
  supratitlu,
  panglica,
  titlu,
  evidentiat = false,
  children,
  className,
}: {
  supratitlu?: string
  panglica?: string
  titlu?: string
  evidentiat?: boolean
  children?: React.ReactNode
  className?: string
}) {
  return (
    <article
      className={cn(
        'relative rounded-brand-lg p-6',
        evidentiat
          ? 'bg-surface-botanic border-sage-400 shadow-brand-2 border-[1.5px]'
          : 'bg-surface-raised border-brand-border shadow-brand-1 border',
        className
      )}
    >
      {panglica && (
        <span className="text-overline bg-primary-800 text-text-on-dark absolute -top-3 left-6 rounded-full px-3 py-1.5 font-semibold tracking-[0.14em] uppercase">
          {panglica}
        </span>
      )}
      {supratitlu && <Supratitlu className={panglica ? 'mt-2' : ''}>{supratitlu}</Supratitlu>}
      {titlu && (
        <h4 className="font-display text-h4 text-text-heading mt-2 font-semibold">{titlu}</h4>
      )}
      {children && (
        <div
          className={cn(
            'text-body-sm mt-2',
            evidentiat ? 'text-sage-800' : 'text-text-muted'
          )}
        >
          {children}
        </div>
      )}
    </article>
  )
}

/** Bloc de tip fișă: etichetă în stânga, valoare în dreapta. */
export function Fisa({
  randuri,
  adanc = false,
}: {
  randuri: { eticheta: string; valoare: React.ReactNode }[]
  adanc?: boolean
}) {
  return (
    <dl
      className={cn(
        'rounded-brand-lg divide-y',
        adanc
          ? 'bg-surface-deep text-text-on-dark divide-white/15'
          : 'bg-surface-raised border-brand-border divide-brand-border border'
      )}
    >
      {randuri.map(({ eticheta, valoare }) => (
        <div key={eticheta} className="flex items-baseline justify-between gap-4 px-5 py-3">
          <dt className={cn('text-body-sm', adanc ? 'text-white/70' : 'text-text-muted')}>
            {eticheta}
          </dt>
          <dd className="text-body-sm text-right font-semibold">{valoare}</dd>
        </div>
      ))}
    </dl>
  )
}
