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
  recordingUrl?: string | null
  bonusTitle?: string | null
}

export type ContextEmail = {
  name: string
  webinar: DateWebinar
  siteUrl: string
  unsubscribeUrl?: string
  calendarUrl?: string
}
