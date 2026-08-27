import crypto from 'node:crypto'

import { NextResponse } from 'next/server'

import { createAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/lib/database.types'

export const dynamic = 'force-dynamic'

type StatusEmail = Database['public']['Enums']['email_status']

const STARI: Record<string, StatusEmail> = {
  'email.sent': 'sent',
  'email.delivered': 'delivered',
  'email.opened': 'opened',
  'email.bounced': 'bounced',
  'email.complained': 'complained',
}

/**
 * Webhook-ul Resend: bounce, complaint, open.
 *
 * Resend semnează cu Svix. Verificarea semnăturii nu e opțională — fără ea,
 * oricine poate marca lead-uri ca `bounced` și le poate scoate din fluxuri.
 */
export async function POST(request: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET
  const corp = await request.text()

  if (!secret) {
    console.error('RESEND_WEBHOOK_SECRET lipsește; webhook respins.')
    return NextResponse.json({ ok: false }, { status: 503 })
  }

  if (!verificaSemnatura(request.headers, corp, secret)) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  let eveniment: { type?: string; data?: { email_id?: string } }
  try {
    eveniment = JSON.parse(corp)
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  const status = eveniment.type ? STARI[eveniment.type] : undefined
  const providerId = eveniment.data?.email_id

  if (!status || !providerId) {
    // Tip de eveniment necunoscut: îl confirmăm ca să nu fie reîncercat la
    // nesfârșit, dar nu facem nimic cu el.
    return NextResponse.json({ ok: true, ignorat: true })
  }

  const supabase = createAdminClient()
  const { data: intrare } = await supabase
    .from('email_log')
    .update({ status })
    .eq('provider_id', providerId)
    .select('contact_id')
    .maybeSingle()

  if (intrare && status === 'opened') {
    await supabase.from('activities').insert({
      contact_id: intrare.contact_id,
      type: 'email_deschis',
      payload: { provider_id: providerId },
    })
  }

  // O plângere de spam e o dezabonare, indiferent ce scrie în bază.
  if (intrare && status === 'complained') {
    await supabase
      .from('contacts')
      .update({ unsubscribed_at: new Date().toISOString(), consent_marketing: false })
      .eq('id', intrare.contact_id)
      .is('unsubscribed_at', null)
  }

  return NextResponse.json({ ok: true })
}

function verificaSemnatura(antete: Headers, corp: string, secret: string): boolean {
  const id = antete.get('svix-id')
  const marcaj = antete.get('svix-timestamp')
  const semnaturi = antete.get('svix-signature')

  if (!id || !marcaj || !semnaturi) return false

  // Fereastră de 5 minute, ca un mesaj interceptat să nu poată fi rejucat.
  const varsta = Math.abs(Date.now() / 1000 - Number(marcaj))
  if (!Number.isFinite(varsta) || varsta > 300) return false

  const cheie = Buffer.from(secret.replace(/^whsec_/, ''), 'base64')
  const asteptata = crypto
    .createHmac('sha256', cheie)
    .update(`${id}.${marcaj}.${corp}`)
    .digest('base64')

  // Resend poate trimite mai multe semnături, pentru rotația cheilor.
  return semnaturi.split(' ').some((intrare) => {
    const valoare = intrare.split(',')[1]
    if (!valoare) return false
    const a = Buffer.from(valoare)
    const b = Buffer.from(asteptata)
    return a.length === b.length && crypto.timingSafeEqual(a, b)
  })
}
