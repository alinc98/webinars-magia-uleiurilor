export type DateWebinar = {
  title: string
  slug: string
  startsAt: string
  durationMin: number
  format: 'online' | 'fizic' | 'hibrid'
  joinUrl?: string | null
  venueName?: string | null
  address?: string | null
  city?: string | null
  mapUrl?: string | null
  venueNotes?: string | null
  usefulInfo?: string | null
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
  /** Doar la evenimentele hibride: cum a ales omul să vină, la înscriere. */
  preferinta?: 'fizic' | 'online' | null
}
