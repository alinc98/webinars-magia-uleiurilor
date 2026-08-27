import { NextResponse } from 'next/server'

import { citesteCerere, raspunsEroare } from '@/lib/api-helpers'
import { createAdminClient } from '@/lib/supabase/admin'
import { replaySchema } from '@/lib/validations/inscriere'

/**
 * Deblocarea unei înregistrări contra email.
 *
 * E singurul mecanism din tot sistemul care aduce lead-uri fără buget de
 * reclame (brief §11): un webinar din martie continuă să genereze contacte în
 * octombrie.
 */
export async function POST(request: Request) {
  const cerere = await citesteCerere(request, replaySchema, 'replay')
  if (!cerere.ok) return cerere.raspuns

  const { slug, name, email, consent, tracking } = cerere.date

  const supabase = createAdminClient()
  const { data, error } = await supabase.rpc('register_for_webinar', {
    p_slug: slug,
    p_name: name,
    p_email: email,
    p_consent: consent,
    p_kind: 'inregistrare',
    p_source: 'arhiva',
    p_tracking: tracking,
  })

  if (error) {
    console.error('register_for_webinar (replay) a eșuat:', error.message)
    return raspunsEroare('server_error', 500)
  }

  const rezultat = data as { ok: boolean; reason?: string }
  if (!rezultat.ok) return raspunsEroare(rezultat.reason ?? 'server_error')

  // TODO(M3): email cu linkul înregistrării
  return NextResponse.json({ ok: true })
}
