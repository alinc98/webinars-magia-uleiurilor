import 'server-only'

import { render } from 'react-email'

import { EmailAnuntLista } from '@/emails/anunt-lista'
import { EmailConfirmare } from '@/emails/confirmare'
import { EmailFollowUp } from '@/emails/followup'
import { EmailReminder } from '@/emails/reminder'
import { EmailReplay } from '@/emails/replay'
import type { DateWebinar } from '@/emails/tipuri'
import { env } from '@/lib/env'
import { construiesteIcs, linkGoogleCalendar } from '@/lib/ics'
import { createAdminClient } from '@/lib/supabase/admin'
import { trimiteEmail, type Atasament } from '@/lib/email/transport'
import { formateazaDataOra } from '@/lib/format'
import type { Database } from '@/lib/database.types'

type Sablon = 'confirmare' | 'reminder_24h' | 'reminder_scurt' | 'followup_prezent'
  | 'followup_absent' | 'replay' | 'anunt_lista'

/**
 * Emailurile de marketing respectă dezabonarea; cele operaționale, nu.
 *
 * Cineva care s-a dezabonat de la newsletter dar tocmai s-a înscris la un
 * webinar trebuie să primească în continuare linkul de intrare. Dezabonarea e
 * o cerere de a nu primi promovare, nu de a fi lăsat pe dinafară la ceva la
 * care s-a înscris singur.
 */
const ESTE_MARKETING: Record<Sablon, boolean> = {
  confirmare: false,
  reminder_24h: false,
  reminder_scurt: false,
  followup_prezent: true,
  followup_absent: true,
  replay: false,
  anunt_lista: true,
}

const SUBIECTE: Record<Sablon, (w: DateWebinar) => string> = {
  confirmare: (w) => `Te-ai înscris: ${w.title}`,
  reminder_24h: (w) => `Mâine ne vedem: ${w.title}`,
  reminder_scurt: (w) => `Începem în curând: ${w.title}`,
  followup_prezent: (w) => `Mulțumesc că ai fost acolo — ${w.title}`,
  followup_absent: (w) => `Ce ai ratat la ${w.title}`,
  replay: (w) => `Înregistrarea: ${w.title}`,
  anunt_lista: (w) => `S-a anunțat: ${w.title}`,
}

export type DestinatarEmail = {
  contactId: string
  name: string
  email: string
  unsubscribeToken: string
  unsubscribedAt: string | null
}

type Optiuni = {
  sablon: Sablon
  destinatar: DestinatarEmail
  webinar: DateWebinar & { id: string }
  /** Doar la confirmare: fișierul .ics ca atașament. */
  cuCalendar?: boolean
}

export async function trimiteSablon({
  sablon,
  destinatar,
  webinar,
  cuCalendar = false,
}: Optiuni): Promise<{ ok: boolean; motiv?: string }> {
  if (ESTE_MARKETING[sablon] && destinatar.unsubscribedAt) {
    return { ok: false, motiv: 'dezabonat' }
  }

  const siteUrl = env.siteUrl()

  // Linkul de dezabonare apare doar pe emailurile pe care dezabonarea chiar le
  // opreşte. Pe o confirmare ar minţi: cine se dezabonează primeşte în
  // continuare accesul la evenimentul la care s-a înscris, altfel n-ar avea cum
  // să ajungă la el.
  const unsubscribeUrl = ESTE_MARKETING[sablon]
    ? `${siteUrl}/dezabonare/${destinatar.unsubscribeToken}`
    : undefined

  // La evenimentele hibride, omul alege la înscriere cum vine. Citim aici, nu
  // de la apelanţi: reamintirile pleacă din cron, care n-are de unde s-o ştie.
  let preferinta: 'fizic' | 'online' | null = null
  if (webinar.format === 'hibrid') {
    const { data } = await createAdminClient()
      .from('registrations')
      .select('attendance_preference')
      .eq('contact_id', destinatar.contactId)
      .eq('webinar_id', webinar.id)
      .maybeSingle()
    preferinta = (data?.attendance_preference as 'fizic' | 'online' | null) ?? null
  }

  // La evenimentele online, locaţia era chiar linkul de intrare — ceea ce l-ar
  // fi strecurat în intrarea din calendar, deşi confirmarea nu-l mai conţine.
  // Linkul pleacă doar cu reamintirile.
  const locatie =
    webinar.format === 'online'
      ? 'Online'
      : [webinar.venueName, webinar.address, webinar.city].filter(Boolean).join(', ')

  const optiuniIcs = {
    uid: `${webinar.id}@magia-uleiurilor.ro`,
    title: webinar.title,
    description:
      webinar.format === 'online'
        ? `${webinar.title} — ${formateazaDataOra(webinar.startsAt)}. Linkul de intrare vine pe email înainte de eveniment.`
        : `${webinar.title} — ${formateazaDataOra(webinar.startsAt)}`,
    startsAt: webinar.startsAt,
    durationMin: webinar.durationMin,
    location: locatie,
    url: `${siteUrl}/webinar/${webinar.slug}`,
    organizerName: 'Andreea Gligor',
    organizerEmail: process.env.EMAIL_REPLY_TO ?? undefined,
  }

  const context = {
    name: destinatar.name.split(' ')[0] || destinatar.name,
    webinar,
    siteUrl,
    unsubscribeUrl,
    calendarUrl: cuCalendar ? linkGoogleCalendar(optiuniIcs) : undefined,
    preferinta,
  }

  const element = (() => {
    switch (sablon) {
      case 'confirmare':
        return EmailConfirmare(context)
      case 'reminder_24h':
        return EmailReminder({ ...context, cand: '24h' })
      case 'reminder_scurt':
        return EmailReminder({ ...context, cand: 'scurt' })
      case 'followup_prezent':
        return EmailFollowUp({ ...context, aParticipat: true })
      case 'followup_absent':
        return EmailFollowUp({ ...context, aParticipat: false })
      case 'replay':
        return EmailReplay(context)
      case 'anunt_lista':
        return EmailAnuntLista(context)
    }
  })()

  const [html, text] = await Promise.all([
    render(element),
    render(element, { plainText: true }),
  ])

  const atasamente: Atasament[] | undefined = cuCalendar
    ? [
        {
          filename: `${webinar.slug}.ics`,
          content: construiesteIcs(optiuniIcs),
          contentType: 'text/calendar; charset=utf-8; method=PUBLISH',
        },
      ]
    : undefined

  const subiect = SUBIECTE[sablon](webinar)

  const rezultat = await trimiteEmail({
    to: destinatar.email,
    subject: subiect,
    html,
    text,
    attachments: atasamente,
    headers: {
      // Dezabonare cu un clic, direct din Gmail. Ajută livrabilitatea și e
      // cerută de politicile pentru expeditori de volum.
      'List-Unsubscribe': `<${unsubscribeUrl}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
  })

  await logheazaEmail({
    contactId: destinatar.contactId,
    webinarId: webinar.id,
    sablon,
    subiect,
    providerId: rezultat.ok ? rezultat.providerId : null,
    status: rezultat.ok ? 'sent' : 'queued',
  })

  if (!rezultat.ok) {
    console.error(`Trimiterea ${sablon} către ${destinatar.email} a eșuat:`, rezultat.error)
    return { ok: false, motiv: rezultat.error }
  }

  return { ok: true }
}

async function logheazaEmail(intrare: {
  contactId: string
  webinarId: string | null
  sablon: string
  subiect: string
  providerId: string | null
  status: Database['public']['Enums']['email_status']
}) {
  const supabase = createAdminClient()

  const { error } = await supabase.from('email_log').insert({
    contact_id: intrare.contactId,
    webinar_id: intrare.webinarId,
    template: intrare.sablon,
    subject: intrare.subiect,
    provider_id: intrare.providerId,
    status: intrare.status,
    sent_at: intrare.status === 'sent' ? new Date().toISOString() : null,
  })

  if (error) console.error('Nu am putut scrie în email_log:', error.message)

  if (intrare.status === 'sent') {
    await supabase.from('activities').insert({
      contact_id: intrare.contactId,
      type: 'email_trimis',
      payload: { template: intrare.sablon, subject: intrare.subiect },
    })
  }
}
