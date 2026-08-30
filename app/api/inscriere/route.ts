import * as Sentry from '@sentry/nextjs'
import { NextResponse } from 'next/server'

import { citesteCerere, raspunsEroare } from '@/lib/api-helpers'
import { trimiteEvenimentMeta } from '@/lib/meta-capi'
import { ipClient } from '@/lib/rate-limit'
import { textCurentDeConsimtamant } from '@/lib/consimtamant-server'
import { getDestinatar, getWebinarPentruEmail } from '@/lib/email/destinatar'
import { env } from '@/lib/env'
import { trimiteSablon } from '@/lib/email/trimite'
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

  const {
    slug,
    name,
    email,
    phone,
    consent,
    tracking,
    event_id,
  } = cerere.date

  // Versiunea textului acceptat se salvează pe contact: dacă textul se
  // schimbă, știi cine ce a acceptat (brief §10).
  const versiuneConsimtamant = await textCurentDeConsimtamant()

  const supabase = createAdminClient()
  const { data, error } = await supabase.rpc('register_for_webinar', {
    p_slug: slug,
    p_name: name,
    p_email: email,
    p_consent: consent,
    p_consent_text_version: versiuneConsimtamant ?? undefined,
    p_phone: phone ?? undefined,
    p_kind: 'live',
    p_source: 'lp',
    p_tracking: tracking,
  })

  if (error) {
    // Formularul de înscriere e singurul lucru care n-are voie să pice în
    // tăcere în timpul unei campanii (brief §5).
    Sentry.captureException(
      new Error(`register_for_webinar: ${error.message}`),
      {
        tags: { ruta: 'inscriere', slug },
      },
    )
    console.error('register_for_webinar a eșuat:', error.message)
    return raspunsEroare('server_error', 500)
  }

  const rezultat = data as {
    ok: boolean
    reason?: string
    contact_id?: string
    webinar_id?: string
  }

  if (!rezultat.ok) {
    // „E plin" și „ești deja înscris" nu sunt erori de server: formularul
    // trebuie să le poată afișa diferit.
    const status = rezultat.reason === 'full' ? 409 : 400
    return raspunsEroare(rezultat.reason ?? 'server_error', status)
  }

  // Confirmarea nu are voie să rateze înscrierea: dacă trimiterea pică, lead-ul
  // rămâne în bază și în email_log cu status `queued`, iar omul vede tot ecranul
  // de succes. Un email pierdut se retrimite din admin; un lead pierdut, nu.
  if (rezultat.contact_id && rezultat.webinar_id) {
    const [destinatar, webinar] = await Promise.all([
      getDestinatar(rezultat.contact_id),
      getWebinarPentruEmail(rezultat.webinar_id),
    ])

    if (destinatar && webinar) {
      await trimiteSablon({
        sablon: 'confirmare',
        destinatar,
        webinar,
        cuCalendar: true,
      })
    }
  }

  // Conversions API, cu același event_id ca pixelul din browser. Nu are voie
  // să întârzie sau să pice răspunsul: dacă eșuează, lead-ul e deja salvat.
  if (event_id) {
    await trimiteEvenimentMeta({
      eventName: 'Lead',
      eventId: event_id,
      // `new URL(cale, baza)` în loc de lipit cu şablon: concatenarea crudă
      // dădea adresă greşită dacă variabila avea slash la final, iar dacă
      // lipsea de tot ieşea o cale relativă, pe care Meta o refuză tăcut.
      // `env.siteUrl()` e aceeaşi valoare normalizată din care se construiesc
      // şi linkurile de autentificare.
      eventSourceUrl: tracking.landing_page
        ? new URL(tracking.landing_page, env.siteUrl()).toString()
        : undefined,
      email,
      phone,
      name,
      fbclid: tracking.fbclid,
      fbp: tracking.fbp,
      clientIp: ipClient(request.headers),
      userAgent: request.headers.get('user-agent') ?? undefined,
    })
  }

  return NextResponse.json({ ok: true, slug })
}
