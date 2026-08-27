import { Badge } from '@/components/ui/badge'

const ETICHETE: Record<string, { text: string; clasa: string }> = {
  draft: { text: 'Ciornă', clasa: 'bg-muted text-muted-foreground' },
  published: { text: 'Publicat', clasa: 'bg-emerald-100 text-emerald-900' },
  live: { text: 'În desfășurare', clasa: 'bg-amber-100 text-amber-900' },
  ended: { text: 'Încheiat', clasa: 'bg-slate-200 text-slate-800' },
  cancelled: { text: 'Anulat', clasa: 'bg-red-100 text-red-900' },
}

export function BadgeStatus({ status }: { status: string }) {
  const e = ETICHETE[status] ?? { text: status, clasa: 'bg-muted' }
  return (
    <Badge variant="secondary" className={e.clasa}>
      {e.text}
    </Badge>
  )
}

const STATUS_CONTACT: Record<string, { text: string; clasa: string }> = {
  nou: { text: 'Nou', clasa: 'bg-blue-100 text-blue-900' },
  contactat: { text: 'Contactat', clasa: 'bg-violet-100 text-violet-900' },
  interesat: { text: 'Interesat', clasa: 'bg-amber-100 text-amber-900' },
  client: { text: 'Client', clasa: 'bg-emerald-100 text-emerald-900' },
  inactiv: { text: 'Inactiv', clasa: 'bg-muted text-muted-foreground' },
}

export function BadgeStatusContact({ status }: { status: string }) {
  const e = STATUS_CONTACT[status] ?? { text: status, clasa: 'bg-muted' }
  return (
    <Badge variant="secondary" className={e.clasa}>
      {e.text}
    </Badge>
  )
}
