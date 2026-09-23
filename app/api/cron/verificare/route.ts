import { NextResponse } from 'next/server'

import { trimiteEmail } from '@/lib/email/transport'
import { env } from '@/lib/env'
import { formateazaDataOra } from '@/lib/format'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Verificarea automată: singurul lucru care observă tăcerea.
 *
 * Cron-ul de reamintiri a fost verde săptămâni la rând fără să trimită nimic.
 * Un plafon gol ajungea `limit 0` în bază, revendicarea întorcea zero rânduri
 * fără eroare, iar rularea raporta succes. Optzeci şi şase de oameni înscrişi
 * la un webinar n-aveau linkul de intrare, iar noi am aflat în dimineaţa
 * evenimentului, din întâmplare.
 *
 * Ruta nu repară nimic. Se uită în urmă şi spune ce a găsit, pe trei căi:
 *
 * 1. **Zilnic**, trimite email doar dacă a găsit ceva.
 * 2. **Săptămânal**, trimite oricum — inclusiv „toate bune". Dacă mesajul ăla
 *    nu mai vine, înseamnă că s-a rupt chiar supravegherea. O alarmă tăcută
 *    arată altfel identic cu una stricată.
 * 3. **În bază**, la fiecare rulare, ca panoul de administrare să poată arăta
 *    când a verificat ultima oară şi ce a ieşit. Confirmare pozitivă, la
 *    cerere, fără niciun email.
 */

/** Dacă bătaia cron-ului e mai veche de-atât, programarea s-a oprit. */
const BATAIE_INVECHITA_MIN = 30

/** Cât de mult în urmă căutăm evenimente ale căror reamintiri au ratat. */
const PRIVIM_INAPOI_ORE = 48

/**
 * Programul raportului săptămânal, exact cum e scris în `vercel.json`.
 *
 * Vercel trimite expresia care a declanşat rularea în `x-vercel-cron-schedule`,
 * tocmai ca două programe să poată împărţi aceeaşi rută. Fără antet — adică la
 * o rulare manuală — ne purtăm ca la cea zilnică.
 */
const PROGRAM_SAPTAMANAL = '0 8 * * 1'

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
  const acum = Date.now()

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
    const minute = Math.round((acum - ultima.getTime()) / 60_000)
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
  const deLa = new Date(acum - PRIVIM_INAPOI_ORE * 3_600_000).toISOString()
  const panaLa = new Date(acum).toISOString()

  const { data: ratate, error: eroareRatate } = await supabase
    .from('registrations')
    .select('id, webinars!inner(title, starts_at, status)')
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
    .select('id')
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
  // Starea, scrisă de fiecare dată
  // ---------------------------------------------------------------------
  //
  // Şi când n-a găsit nimic. Asta e jumătatea vizibilă: panoul poate spune
  // „verificat acum două ore, nimic de semnalat", în loc să lase tăcerea să
  // însemne şi „e bine", şi „s-a stricat".
  const { error: eroareScriere } = await supabase
    .from('settings')
    .update({
      verificare_ultima_rulare: new Date(acum).toISOString(),
      verificare_probleme: probleme.map((p) => p.titlu),
    })
    .eq('id', true)

  if (eroareScriere) {
    console.error(
      'Nu am putut scrie starea verificării:',
      eroareScriere.message,
    )
  }

  // ---------------------------------------------------------------------
  // Raportul
  // ---------------------------------------------------------------------
  const saptamanal =
    request.headers.get('x-vercel-cron-schedule') === PROGRAM_SAPTAMANAL

  if (probleme.length === 0 && !saptamanal) {
    return NextResponse.json({ ok: true, probleme: 0 })
  }

  const trimis = await anunta(
    probleme,
    saptamanal ? await rezumatSaptamanal(supabase) : null,
  )

  if (probleme.length === 0) {
    return NextResponse.json({ ok: true, probleme: 0, email: trimis })
  }

  // 500 ca să se vadă şi în logurile Vercel, nu doar în inbox: dacă tocmai
  // trimiterea de email e ce s-a stricat, emailul de alarmă n-are cum să
  // ajungă, iar atunci logul e singurul martor.
  return NextResponse.json(
    { ok: false, probleme: probleme.map((p) => p.titlu), email: trimis },
    { status: 500 },
  )
}

/**
 * Câteva cifre pentru raportul săptămânal.
 *
 * Nu statistici de marketing — atâta cât să merite citit, ca omul să observe
 * dacă vreodată nu mai vine.
 */
async function rezumatSaptamanal(
  supabase: ReturnType<typeof createAdminClient>,
): Promise<string> {
  const acum = Date.now()
  const saptamana = new Date(acum - 7 * 86_400_000).toISOString()
  const peste7Zile = new Date(acum + 7 * 86_400_000).toISOString()

  const [{ data: reamintiri }, { data: inscrieri }, { data: urmatoare }] =
    await Promise.all([
      supabase
        .from('email_log')
        .select('id')
        .in('template', ['reminder_24h', 'reminder_scurt'])
        .gte('created_at', saptamana),
      supabase
        .from('registrations')
        .select('id')
        .gte('registered_at', saptamana),
      supabase
        .from('webinars_public')
        .select('title, starts_at, registrations_count')
        .in('status', ['published', 'live'])
        .gte('ends_at', new Date(acum).toISOString())
        .lte('starts_at', peste7Zile)
        .order('starts_at'),
    ])

  const randuri = [
    `Reamintiri trimise în ultimele 7 zile: ${reamintiri?.length ?? 0}`,
    `Înscrieri noi în ultimele 7 zile: ${inscrieri?.length ?? 0}`,
  ]

  if (urmatoare && urmatoare.length > 0) {
    randuri.push('', 'Urmează:')
    for (const w of urmatoare) {
      randuri.push(
        `• ${formateazaDataOra(w.starts_at!)} — ${w.title} (${w.registrations_count ?? 0} înscrişi)`,
      )
    }
  } else {
    randuri.push('', 'Niciun eveniment în următoarele 7 zile.')
  }

  return randuri.join('\n')
}

/**
 * Alarma pleacă spre `EMAIL_ALERTE`, cu `EMAIL_REPLY_TO` ca rezervă.
 *
 * Nu spre Andreea: sunt probleme tehnice, nu de conţinut. Şi nu trece prin
 * `trimiteSablon` — acela scrie în `email_log` per contact şi per eveniment,
 * iar un mesaj către noi n-are nici contact, nici eveniment.
 */
async function anunta(
  probleme: Problema[],
  rezumat: string | null,
): Promise<boolean> {
  const catre = process.env.EMAIL_ALERTE || process.env.EMAIL_REPLY_TO

  if (!catre) {
    console.error(
      'Verificarea are ceva de raportat, dar nu există EMAIL_ALERTE unde să trimit:',
      probleme.map((p) => p.titlu).join(' · ') || 'raport săptămânal',
    )
    return false
  }

  const bucati: string[] = []

  if (probleme.length > 0) {
    bucati.push(probleme.map((p) => `${p.titlu}\n${p.detaliu}`).join('\n\n'))
  } else {
    bucati.push('Nimic de semnalat. Reamintirile pleacă, cron-ul bate.')
  }

  if (rezumat) bucati.push(rezumat)

  bucati.push(
    probleme.length > 0
      ? `Panoul: ${env.siteUrl()}/admin`
      : 'Mesajul ăsta vine o dată pe săptămână. Dacă nu mai vine, înseamnă că s-a rupt chiar verificarea.',
  )

  const corp = bucati.join('\n\n────────────────\n\n')

  const subiect =
    probleme.length > 0
      ? `⚠ Platforma webinarii: ${probleme.length === 1 ? 'o problemă' : `${probleme.length} probleme`}`
      : '✓ Platforma webinarii: toate bune'

  const rezultat = await trimiteEmail({
    to: catre,
    subject: subiect,
    text: `${corp}\n\n${env.siteUrl()}/admin`,
    html:
      `<pre style="font:14px/1.6 ui-monospace,monospace;white-space:pre-wrap">${corp
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')}</pre>` +
      `<p style="font:14px/1.6 system-ui"><a href="${env.siteUrl()}/admin">Deschide panoul</a></p>`,
  })

  if (!rezultat.ok) {
    console.error('Nu am putut trimite raportul:', rezultat.error)
    return false
  }

  return true
}
