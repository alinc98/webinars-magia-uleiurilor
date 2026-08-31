import 'server-only'

import type { DateWebinar } from '@/emails/tipuri'
import { sesiuniDin } from '@/lib/program'
import { createAdminClient } from '@/lib/supabase/admin'
import type { DestinatarEmail } from '@/lib/email/trimite'

export async function getDestinatar(
  contactId: string,
): Promise<DestinatarEmail | null> {
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
  webinarId: string,
): Promise<(DateWebinar & { id: string }) | null> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('webinars')
    // Şirul stă într-o singură bucată, nelipit din altele: supabase-js citeşte
    // forma răspunsului din tipul literal al selectului, iar o concatenare îl
    // face un `string` oarecare şi tot ce urmează îşi pierde tipul.
    //
    // `webinar_sessions(...)` e o resursă încorporată — PostgREST o aduce în
    // acelaşi apel. Ordinea ei n-o garantează nimic aici; o pune `sesiuniDin`.
    .select(
      'id, title, slug, format, join_url, venue_name, address, city, map_url, venue_notes, useful_info, price_bani, recording_url, bonus_title, webinar_sessions(starts_at, ends_at, label)',
    )
    .eq('id', webinarId)
    .maybeSingle()

  if (!data) return null

  return {
    id: data.id,
    title: data.title,
    slug: data.slug,
    sesiuni: sesiuniDin(data.webinar_sessions),
    format: data.format,
    joinUrl: data.join_url,
    venueName: data.venue_name,
    address: data.address,
    city: data.city,
    mapUrl: data.map_url,
    venueNotes: data.venue_notes,
    usefulInfo: data.useful_info,
    priceBani: data.price_bani,
    recordingUrl: data.recording_url,
    bonusTitle: data.bonus_title,
  }
}
