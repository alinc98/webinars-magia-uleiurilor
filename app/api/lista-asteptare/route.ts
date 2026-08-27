import { NextResponse } from 'next/server'

import { citesteCerere, raspunsEroare } from '@/lib/api-helpers'
import { createAdminClient } from '@/lib/supabase/admin'
import { listaAsteptareSchema } from '@/lib/validations/inscriere'

/**
 * Lista de așteptare: din starea goală a hub-ului (fără `webinar_slug`) sau de
 * pe un eveniment fizic plin (cu `webinar_slug`).
 */
export async function POST(request: Request) {
  const cerere = await citesteCerere(request, listaAsteptareSchema, 'lista-asteptare')
  if (!cerere.ok) return cerere.raspuns

  const { name, email, consent, interest, webinar_slug, tracking } = cerere.date

  const supabase = createAdminClient()
  const { data, error } = await supabase.rpc('join_waitlist', {
    p_name: name,
    p_email: email,
    p_consent: consent,
    p_interest: interest ?? undefined,
    p_webinar_slug: webinar_slug ?? undefined,
    p_source: webinar_slug ? 'eveniment-plin' : 'hub',
    p_tracking: tracking,
  })

  if (error) {
    console.error('join_waitlist a eșuat:', error.message)
    return raspunsEroare('server_error', 500)
  }

  const rezultat = data as { ok: boolean; reason?: string }
  if (!rezultat.ok) return raspunsEroare(rezultat.reason ?? 'server_error')

  return NextResponse.json({ ok: true })
}
