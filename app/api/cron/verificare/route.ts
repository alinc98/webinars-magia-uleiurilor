import { NextResponse } from 'next/server'

import { trimiteEmail } from '@/lib/email/transport'
import { env } from '@/lib/env'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Verificarea zilnică: singurul lucru care observă tăcerea.
 *
 * Cron-ul de reamintiri a fost verde săptămâni la rând fără să trimită nimic.
 * Un plafon gol ajungea `limit 0` în bază, revendicarea întorcea zero rânduri
 * fără eroare, iar rularea raporta succes. Optzeci şi şase de oameni înscrişi
 * la un webinar n-aveau linkul de intrare, iar noi am aflat în dimineaţa
 * evenimentului, din întâmplare.
 *
 * Ruta asta nu repară nimic. Doar se uită în urmă şi, dacă găseşte ceva,
 * **trimite un email**. Nu o rulare roşie într-un panou la care nu se uită
 * nimeni — un mesaj care ajunge la cineva.
 *
 * Tăcerea ei înseamnă că totul e bine. Un email înseamnă că trebuie să te uiţi.
 */

/** Dacă bătaia cron-ului e mai veche de-atât, programarea s-a oprit. */
const BATAIE_INVECHITA_MIN = 30

/** Cât de mult în urmă căutăm evenimente ale căror reamintiri au ratat. */
const PRIVIM_INAPOI_ORE = 48

type Problema = { titlu: string; detaliu: string }

export async function GET(request: Request) {
  return ruleaza(request)
}

export async function POST(request: Request) {
  return ruleaza(request)
}

async function ruleaza(request: Request) {
  if (request.headers.get('authorization') !== `Bearer ${env.cronSecret()}`) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  const supabase = createAdminClient()
  const probleme: Problema[] = []

  // ---------------------------------------------------------------------
  // 1. Mai bate cron-ul?
  // ---------------------------------------------------------------------
  const { data: setari } = await supabase
    .from('settings')
    .select('cron_ultima_rulare')
    .eq('id', true)
    .maybeSingle()

  const ultima = setari?.cron_ultima_rulare
    ? new Date(setari.cron_ultima_rulare)
    : null

  if (!ultima) {
    probleme.push({
      titlu: 'Cron-ul de reamintiri n-a rulat niciodată cu succes',
      detaliu:
        'Coloana `settings.cron_ultima_rulare` e goală. Fie programarea nu e ' +
        'activă, fie fiecare rulare se încheie cu eroare.',
    })
  } else {
    const minute = Math.round((Date.now() - ultima.getTime()) / 60_000)
    if (minute > BATAIE_INVECHITA_MIN) {
      probleme.push({
        titlu: 'Cron-ul de reamintiri s-a oprit',
        detaliu: `Ultima rulare reuşită a fost acum ${minute} de minute. Ar trebui să ruleze din 5 în 5.`,
      })
    }
  }

  // ---------------------------------------------------------------------
  // 2. A rămas cineva fără reamintire la un eveniment care a trecut?
  // ---------------------------------------------------------------------
  //
  // Asta e verificarea care conta. Se uită la evenimente **deja începute**,
  // unde nu mai există nicio şansă ca reamintirea să plece la timp. Dacă
  // greşeala de acum trei săptămâni s-ar repeta sub altă formă, aici s-ar
  // vedea a doua zi.
  const acum = Date.now()
  const deLa = new Date(acum - PRIVIM_INAPOI_ORE * 3_600_000).toISOString()
  const panaLa = new Date(acum).toISOString()

  const { data: ratate, error: eroareRatate } = await supabase
    .from('registrations')
    .select('id, webinars!inner(title, slug, starts_at, status)')
    .eq('kind', 'live')
    .is('reminder_24h_sent_at', null)
    .in('webinars.status', ['published', 'live', 'ended'])
    .gte('webinars.starts_at', deLa)
    .lt('webinars.starts_at', panaLa)

  if (eroareRatate) {
    probleme.push({
      titlu: 'Verificarea reamintirilor a eşuat',
      detaliu: eroareRatate.message,
    })
  } else if (ratate && ratate.length > 0) {
    const peEveniment = new Map<string, number>()
    for (const r of ratate) {
      const w = r.webinars as unknown as { title: string } | null
      const titlu = w?.title ?? 'eveniment necunoscut'
      peEveniment.set(titlu, (peEveniment.get(titlu) ?? 0) + 1)
    }

    probleme.push({
      titlu: `${ratate.length} înscrişi n-au primit reamintirea`,
      detaliu: [...peEveniment]
        .map(([titlu, cati]) => `• ${cati} la „${titlu}"`)
        .join('\n'),
    })
  }

  // ---------------------------------------------------------------------
  // 3. Au rămas trimiteri blocate?
  // ---------------------------------------------------------------------
  const oOra = new Date(acum - 3_600_000).toISOString()
  const { data: blocate } = await supabase
    .from('email_log')
    .select('id, template')
    .eq('status', 'queued')
    .lt('created_at', oOra)

  if (blocate && blocate.length > 0) {
    probleme.push({
      titlu: `${blocate.length} emailuri au rămas în aşteptare`,
      detaliu:
        'Rânduri din `email_log` cu status `queued` mai vechi de o oră. ' +
        'Înseamnă că furnizorul de email a refuzat trimiterea.',
    })
  }

  // ---------------------------------------------------------------------
  // Raportul
  // ---------------------------------------------------------------------
  if (probleme.length === 0) {
    return NextResponse.json({ ok: true, probleme: 0 })
  }

  const trimis = await anunta(probleme)

  // 500 ca să se vadă şi în logurile Vercel, nu doar în inbox: dacă tocmai
  // trimiterea de email e ce s-a stricat, emailul de alarmă n-are cum să
  // ajungă, iar atunci logul e singurul martor.
  return NextResponse.json(
    { ok: false, probleme: probleme.map((p) => p.titlu), email: trimis },
    { status: 500 },
  )
}

/**
 * Alarma pleacă spre `EMAIL_ALERTE`, cu `EMAIL_REPLY_TO` ca rezervă.
 *
 * Nu spre Andreea: sunt probleme tehnice, nu de conţinut. Şi nu trece prin
 * `trimiteSablon` — acela scrie în `email_log` per contact şi per eveniment,
 * iar un mesaj către noi n-are nici contact, nici eveniment.
 */
async function anunta(probleme: Problema[]): Promise<boolean> {
  const catre = process.env.EMAIL_ALERTE || process.env.EMAIL_REPLY_TO

  if (!catre) {
    console.error(
      'Verificarea a găsit probleme, dar nu există EMAIL_ALERTE unde să le trimit:',
      probleme.map((p) => p.titlu).join(' · '),
    )
    return false
  }

  const corp = probleme
    .map((p) => `${p.titlu}\n${p.detaliu}`)
    .join('\n\n────────────────\n\n')

  const rezultat = await trimiteEmail({
    to: catre,
    subject: `⚠ Platforma webinarii: ${probleme.length === 1 ? 'o problemă' : `${probleme.length} probleme`}`,
    text: `${corp}\n\nVerificarea zilnică rulează din Vercel Cron. Dacă mesajul ăsta nu mai vine, înseamnă că e bine.\n${env.siteUrl()}/admin`,
    html: `<pre style="font:14px/1.6 ui-monospace,monospace;white-space:pre-wrap">${corp
      .replace(/&/g, '&amp;')
      .replace(
        /</g,
        '&lt;',
      )}</pre><p style="font:14px/1.6 system-ui"><a href="${env.siteUrl()}/admin">Deschide panoul</a></p>`,
  })

  if (!rezultat.ok) {
    console.error('Nu am putut trimite alarma:', rezultat.error)
    return false
  }

  return true
}
