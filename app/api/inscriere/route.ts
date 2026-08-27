import { NextResponse } from 'next/server'

import { citesteCerere, raspunsEroare } from '@/lib/api-helpers'
import { createAdminClient } from '@/lib/supabase/admin'
import { inscriereSchema } from '@/lib/validations/inscriere'

/**
 * Înscrierea la un webinar.
 *
 * Formularul public nu scrie niciodată direct în bază: rolul `anon` n-are
 * grant-uri pe nimic (migrația 20260827230000). Scrierea se face aici, cu
 * `service_role`, după honeypot, rate limit și Zod.
 */
export async function POST(request: Request) {
  const cerere = await citesteCerere(request, inscriereSchema, 'inscriere')
  if (!cerere.ok) return cerere.raspuns

  const { slug, name, email, phone, consent, attendance_preference, tracking } = cerere.date

  const supabase = createAdminClient()
  const { data, error } = await supabase.rpc('register_for_webinar', {
    p_slug: slug,
    p_name: name,
    p_email: email,
    p_consent: consent,
    p_phone: phone ?? undefined,
    p_kind: 'live',
    p_attendance_preference: attendance_preference ?? undefined,
    p_source: 'lp',
    p_tracking: tracking,
  })

  if (error) {
    console.error('register_for_webinar a eșuat:', error.message)
    return raspunsEroare('server_error', 500)
  }

  const rezultat = data as { ok: boolean; reason?: string; contact_id?: string }

  if (!rezultat.ok) {
    // „E plin" și „ești deja înscris" nu sunt erori de server: formularul
    // trebuie să le poată afișa diferit.
    const status = rezultat.reason === 'full' ? 409 : 400
    return raspunsEroare(rezultat.reason ?? 'server_error', status)
  }

  // TODO(M3): email de confirmare prin Resend, cu .ics atașat
  // TODO(M6): eveniment `Lead` prin Conversions API, cu același event_id ca pixelul

  return NextResponse.json({ ok: true, slug })
}
