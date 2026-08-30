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
  attended?: boolean
}

/**
 * Cron-ul de remindere și follow-up-uri.
 *
 * Rulat din GitHub Actions din 15 în 15 minute, nu din Vercel Cron: planul
 * Hobby permite o singură rulare pe zi (PLAN.md §2.1).
 *
 * Rândurile se revendică atomic în bază — vezi migrația 20260828000000 pentru
 * de ce marcarea se face înaintea trimiterii.
 */
export async function POST(request: Request) {
  const antet = request.headers.get('authorization')
  if (antet !== `Bearer ${env.cronSecret()}`) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  const supabase = createAdminClient()

  // Plafonul e mai mic decât ar suporta baza, ca să nu depășim limita zilnică
  // a furnizorului de email într-o singură rulare (PLAN.md §2.3).
  const limita = Number(process.env.CRON_BATCH_LIMIT ?? 60)

  const [r24, rScurt, rFollowup] = await Promise.all([
    supabase.rpc('claim_reminders_24h', { p_limit: limita }),
    supabase.rpc('claim_reminders_short', { p_limit: limita }),
    supabase.rpc('claim_followups', { p_limit: limita }),
  ])

  // Nu ieșim aici, chiar dacă una din cele trei a picat.
  //
  // Revendicarea marchează rândurile *înainte* de trimitere, ca o rulare
  // repetată să nu trimită de două ori. Consecința e că un `return` în acest
  // punct aruncă la gunoi loturile care au reușit: rândurile lor sunt deja
  // marcate ca trimise, iar rularea următoare nu le mai vede. Reamintirea nu
  // pleacă niciodată, și nimeni nu află.
  //
  // Deci trimitem ce s-a revendicat şi raportăm eroarea după.
  const erori = [r24, rScurt, rFollowup]
    .map((r) => r.error?.message)
    .filter((m): m is string => Boolean(m))

  const raport = {
    reminder_24h: await trimiteLot((r24.data ?? []) as Revendicare[], () => 'reminder_24h'),
    reminder_scurt: await trimiteLot((rScurt.data ?? []) as Revendicare[], () => 'reminder_scurt'),
    followup: await trimiteLot((rFollowup.data ?? []) as Revendicare[], (r) =>
      r.attended ? 'followup_prezent' : 'followup_absent'
    ),
  }

  if (erori.length > 0) {
    console.error('Revendicarea a eșuat parțial:', erori.join(' · '))
    // 500, ca rularea din GitHub să iasă roșie: ce s-a revendicat a plecat,
    // dar restul trebuie reîncercat, iar o rulare verde n-ar spune nimănui.
    return NextResponse.json(
      { ok: false, error: erori.join(' · '), ...raport },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true, ...raport })
}

async function trimiteLot(
  revendicari: Revendicare[],
  alegeSablon: (r: Revendicare) => 'reminder_24h' | 'reminder_scurt' | 'followup_prezent' | 'followup_absent'
) {
  let trimise = 0
  let esuate = 0
  let sarite = 0

  // Cache pe webinar: un lot e de obicei pentru același eveniment, deci n-are
  // rost o interogare per destinatar.
  const webinare = new Map<string, Awaited<ReturnType<typeof getWebinarPentruEmail>>>()

  for (const revendicare of revendicari) {
    try {
      await unul(revendicare)
    } catch (eroare) {
      // Acelaşi motiv ca mai sus: rândul e deja marcat, deci o excepţie
      // aruncată aici ar face restul lotului să dispară odată cu ea.
      console.error('Trimitere eșuată pentru o revendicare:', eroare)
      esuate += 1
    }
  }

  return { trimise, esuate, sarite }

  async function unul(revendicare: Revendicare) {
    if (!webinare.has(revendicare.webinar_id)) {
      webinare.set(revendicare.webinar_id, await getWebinarPentruEmail(revendicare.webinar_id))
    }
    const webinar = webinare.get(revendicare.webinar_id)
    const destinatar = await getDestinatar(revendicare.contact_id)

    if (!webinar || !destinatar) {
      esuate += 1
      return
    }

    const rezultat = await trimiteSablon({
      sablon: alegeSablon(revendicare),
      destinatar,
      webinar,
    })

    if (rezultat.ok) trimise += 1
    else if (rezultat.motiv === 'dezabonat') sarite += 1
    else esuate += 1
  }
}
