import type { Moneda } from '@/lib/format'
import type { Sesiune } from '@/lib/program'

export type DateWebinar = {
  title: string
  slug: string
  /** Una sau mai multe întâlniri, în ordine cronologică. */
  sesiuni: Sesiune[]
  format: 'online' | 'fizic'
  joinUrl?: string | null
  venueName?: string | null
  address?: string | null
  city?: string | null
  mapUrl?: string | null
  venueNotes?: string | null
  usefulInfo?: string | null
  /** În subunitatea monedei. NULL înseamnă gratuit. */
  priceBani?: number | null
  priceCurrency?: Moneda
  recordingUrl?: string | null
  bonusTitle?: string | null
}

export type ContextEmail = {
  name: string
  webinar: DateWebinar
  siteUrl: string
  /** Doar la emailurile de promovare. Vezi `Sablon` din componente.tsx. */
  unsubscribeUrl?: string
  calendarUrl?: string
}
