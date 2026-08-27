import { cn } from '@/lib/utils'

/**
 * Statusurile din admin.
 *
 * Culoarea e mereu dublată de punct și text, ca informația să nu depindă de
 * percepția cromatică.
 */
const TONURI = {
  succes: 'bg-[var(--color-success-surface)] text-[var(--color-success)]',
  atentie: 'bg-[var(--color-warning-surface)] text-[var(--color-warning)]',
  pericol: 'bg-[var(--color-danger-surface)] text-[var(--color-danger)]',
  neutru: 'bg-warm-100 text-warm-800',
  info: 'bg-primary-50 text-primary-800',
} as const

type Ton = keyof typeof TONURI

function Badge({ ton, children }: { ton: Ton; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-semibold',
        TONURI[ton]
      )}
    >
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {children}
    </span>
  )
}

const WEBINAR: Record<string, { text: string; ton: Ton }> = {
  draft: { text: 'Ciornă', ton: 'neutru' },
  published: { text: 'Publicat', ton: 'succes' },
  live: { text: 'În desfășurare', ton: 'atentie' },
  ended: { text: 'Încheiat', ton: 'neutru' },
  cancelled: { text: 'Anulat', ton: 'pericol' },
}

export function BadgeStatus({ status }: { status: string }) {
  const e = WEBINAR[status] ?? { text: status, ton: 'neutru' as Ton }
  return <Badge ton={e.ton}>{e.text}</Badge>
}

const CONTACT: Record<string, { text: string; ton: Ton }> = {
  nou: { text: 'Nou', ton: 'info' },
  contactat: { text: 'Contactat', ton: 'neutru' },
  interesat: { text: 'Interesat', ton: 'atentie' },
  client: { text: 'Client', ton: 'succes' },
  inactiv: { text: 'Inactiv', ton: 'neutru' },
}

export function BadgeStatusContact({ status }: { status: string }) {
  const e = CONTACT[status] ?? { text: status, ton: 'neutru' as Ton }
  return <Badge ton={e.ton}>{e.text}</Badge>
}
