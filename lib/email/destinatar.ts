import 'server-only'

import type { DateWebinar } from '@/emails/tipuri'
import { createAdminClient } from '@/lib/supabase/admin'
import type { DestinatarEmail } from '@/lib/email/trimite'

export async function getDestinatar(contactId: string): Promise<DestinatarEmail | null> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('contacts')
    .select('id, name, email, unsubscribe_token, unsubscribed_at')
    .eq('id', contactId)
    .maybeSingle()

  if (!data) return null

  return {
    contactId: data.id,
    name: data.name,
    email: data.email,
    unsubscribeToken: data.unsubscribe_token,
    unsubscribedAt: data.unsubscribed_at,
  }
}

export async function getWebinarPentruEmail(
  webinarId: string
): Promise<(DateWebinar & { id: string }) | null> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('webinars')
    .select(
      'id, title, slug, starts_at, duration_min, format, join_url, venue_name, address, city, map_url, venue_notes, useful_info, recording_url, bonus_title'
    )
    .eq('id', webinarId)
    .maybeSingle()

  if (!data) return null

  return {
    id: data.id,
    title: data.title,
    slug: data.slug,
    startsAt: data.starts_at,
    durationMin: data.duration_min,
    format: data.format,
    joinUrl: data.join_url,
    venueName: data.venue_name,
    address: data.address,
    city: data.city,
    mapUrl: data.map_url,
    venueNotes: data.venue_notes,
    usefulInfo: data.useful_info,
    recordingUrl: data.recording_url,
    bonusTitle: data.bonus_title,
  }
}
