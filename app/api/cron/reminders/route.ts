import { NextResponse } from 'next/server'

import { getDestinatar, getWebinarPentruEmail } from '@/lib/email/destinatar'
import { trimiteSablon } from '@/lib/email/trimite'
import { env } from '@/lib/env'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

type Revendicare = {
  registration_id: string
  contact_id: string
  webinar_id: string
}

type Sablon = 'reminder_24h' | 'reminder_scurt'

const PLAFON_IMPLICIT = 60

/**
 * Cât timp ne lăsăm să trimitem, înainte să predăm restul rulării următoare.
 *
 * Sub `maxDuration`, cu o margine cât o trimitere lentă plus revendicarea
 * înapoi a ce n-am apucat. Vezi `trimiteLot`.
 */
const BUGET_MS = 45_000

/**
 * Câte reamintiri revendicăm într-o rulare.
 *
 * Varianta dinainte era `Number(process.env.CRON_BATCH_LIMIT ?? 60)`, iar `??`
 * prinde doar `null` şi `undefined` — nu şi şirul gol. Cu variabila existentă
 * dar goală în Vercel, `Number('')` dădea 0, în bază ajungea `limit 0`, iar
 * revendicarea întorcea zero rânduri **fără nicio eroare**. Cron-ul raporta
 * succes, `trimise: 0`, iar reamintirile n-au plecat niciodată — nici măcar
 * una, de la lansare până acum.
 *
 * De-aia funcţia asta nu se mulţumeşte să convertească: lipsa şi golul
 * înseamnă „nesetat", iar orice altceva neutilizabil e o greşeală de
 * configurare, care merge mai departe pe valoarea implicită **şi** se spune cu
 * voce tare. O reamintire netrimisă nu are voie să mai arate ca o rulare
 * verde.
 */
function plafonLot(): { valoare: number; problema?: string } {
  const brut = process.env.CRON_BATCH_LIMIT

  if (brut === undefined || brut.trim() === '') {
    return { valoare: PLAFON_IMPLICIT }
  }

  const valoare = Number(brut)
  if (!Number.isInteger(valoare) || valoare <= 0) {
    return {
      valoare: PLAFON_IMPLICIT,
      problema: `CRON_BATCH_LIMIT are valoarea „${brut}", care nu e un număr întreg pozitiv. Am folosit ${PLAFON_IMPLICIT}.`,
    }
  }

  return { valoare }
}

/**
 * Cron-ul de remindere.
 *
 * Rulat din GitHub Actions, nu din Vercel Cron: planul Hobby permite o singură
 * rulare pe zi (PLAN.md §2.1).
 *
 * Rândurile se revendică atomic în bază — vezi migraţia 20260828000000 pentru
 * de ce marcarea se face înaintea trimiterii.
 */
export async function POST(request: Request) {
  const antet = request.headers.get('authorization')
  if (antet !== `Bearer ${env.cronSecret()}`) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  const supabase = createAdminClient()
  const plafon = plafonLot()
  const pana = Date.now() + BUGET_MS

  // Mesajele de după eveniment nu se mai trimit automat — decizia clientei.
  //
  // Rămân şablonul, funcţia `claim_followups` din bază şi coloana
  // `followup_sent_at`: nu costă nimic şi fac repornirea o chestiune de un
  // rând aici, nu o migraţie. Cine reactivează să citească întâi
  // `emails/followup.tsx` — textul promite un bonus pe care nimic nu-l
  // livrează.
  const [r24, rScurt] = await Promise.all([
    supabase.rpc('claim_reminders_24h', { p_limit: plafon.valoare }),
    supabase.rpc('claim_reminders_short', { p_limit: plafon.valoare }),
  ])

  // Nu ieșim aici, chiar dacă una dintre ele a picat.
  //
  // Revendicarea marchează rândurile *înainte* de trimitere, ca o rulare
  // repetată să nu trimită de două ori. Consecința e că un `return` în acest
  // punct aruncă la gunoi loturile care au reușit: rândurile lor sunt deja
  // marcate ca trimise, iar rularea următoare nu le mai vede. Reamintirea nu
  // pleacă niciodată, și nimeni nu află.
  //
  // Deci trimitem ce s-a revendicat şi raportăm eroarea după.
  const erori = [r24, rScurt]
    .map((r) => r.error?.message)
    .filter((m): m is string => Boolean(m))

  const raport = {
    reminder_24h: await trimiteLot(
      (r24.data ?? []) as Revendicare[],
      'reminder_24h',
      pana,
    ),
    reminder_scurt: await trimiteLot(
      (rScurt.data ?? []) as Revendicare[],
      'reminder_scurt',
      pana,
    ),
  }

  if (plafon.problema) {
    console.error('Configurare greşită:', plafon.problema)
    erori.push(plafon.problema)
  }

  if (erori.length > 0) {
    console.error('Cron cu probleme:', erori.join(' · '))
    // 500, ca rularea din GitHub să iasă roșie: ce s-a revendicat a plecat,
    // dar restul trebuie reîncercat, iar o rulare verde n-ar spune nimănui.
    return NextResponse.json(
      { ok: false, error: erori.join(' · '), ...raport },
      { status: 500 },
    )
  }

  return NextResponse.json({ ok: true, ...raport })
}

async function trimiteLot(
  revendicari: Revendicare[],
  sablon: Sablon,
  pana: number,
) {
  let trimise = 0
  let esuate = 0
  let sarite = 0

  const supabase = createAdminClient()

  // Cache pe webinar: un lot e de obicei pentru același eveniment, deci n-are
  // rost o interogare per destinatar.
  const webinare = new Map<
    string,
    Awaited<ReturnType<typeof getWebinarPentruEmail>>
  >()

  let i = 0
  for (; i < revendicari.length; i++) {
    // Oprim înainte să ne taie platforma.
    //
    // Fiecare trimitere înseamnă o interogare, două randări şi un apel la
    // furnizorul de email — aproape o secundă. La optzeci şi ceva de
    // destinatari, un lot poate trece de `maxDuration`, iar funcţia e oprită
    // la mijloc. Rândurile rămase erau deja marcate ca trimise, deci s-ar fi
    // pierdut definitiv: rularea următoare nu le mai vede.
    if (Date.now() > pana) break

    try {
      await unul(revendicari[i])
    } catch (eroare) {
      // Acelaşi motiv ca mai sus: rândul e deja marcat, deci o excepţie
      // aruncată aici ar face restul lotului să dispară odată cu ea.
      console.error('Trimitere eșuată pentru o revendicare:', eroare)
      esuate += 1
    }
  }

  // Ce n-am apucat să încercăm deloc se dă înapoi, ca să-l ia rularea
  // următoare. Doar cele neatinse: o trimitere care a eşuat rămâne marcată,
  // fiindcă nu ştim dacă furnizorul a apucat s-o livreze, iar un email dublu
  // supără mai mult decât unul întârziat (vezi migraţia 20260828000000).
  const amanate = revendicari.slice(i)
  if (amanate.length > 0) {
    // Scris pe ramuri, nu cu cheie calculată: o cheie dinamică se lărgeşte la
    // `string` şi tipul coloanelor se pierde exact acolo unde ne-ar prinde o
    // greşeală de nume.
    const resetare =
      sablon === 'reminder_24h'
        ? { reminder_24h_sent_at: null }
        : { reminder_short_sent_at: null }

    const { error } = await supabase
      .from('registrations')
      .update(resetare)
      .in(
        'id',
        amanate.map((r) => r.registration_id),
      )

    if (error) {
      console.error(
        `Nu am putut da înapoi ${amanate.length} revendicări ${sablon}:`,
        error.message,
      )
    } else {
      console.info(
        `Am dat înapoi ${amanate.length} revendicări ${sablon}, pentru rularea următoare.`,
      )
    }
  }

  return { trimise, esuate, sarite, amanate: amanate.length }

  async function unul(revendicare: Revendicare) {
    if (!webinare.has(revendicare.webinar_id)) {
      webinare.set(
        revendicare.webinar_id,
        await getWebinarPentruEmail(revendicare.webinar_id),
      )
    }
    const webinar = webinare.get(revendicare.webinar_id)
    const destinatar = await getDestinatar(revendicare.contact_id)

    if (!webinar || !destinatar) {
      esuate += 1
      return
    }

    const rezultat = await trimiteSablon({ sablon, destinatar, webinar })

    if (rezultat.ok) trimise += 1
    else if (rezultat.motiv === 'dezabonat') sarite += 1
    else esuate += 1
  }
}
