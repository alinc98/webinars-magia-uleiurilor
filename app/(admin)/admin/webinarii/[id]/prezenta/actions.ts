'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { trimiteEvenimentGa4Server } from '@/lib/ga4-server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminUser } from '@/lib/supabase/auth'

/** Layout-ul protejează randarea; o Server Action e un endpoint separat. */
async function ceruteDrepturi() {
  const utilizator = await getAdminUser()
  if (!utilizator) redirect('/login')
  return utilizator
}

/**
 * Marchează dacă un înscris a participat.
 *
 * Nu declanșează niciun email — mesajele de după eveniment nu se mai trimit
 * automat. Prezența rămâne pentru evidența Andreei, pentru rata de
 * participare de pe Panou și pentru exportul CSV.
 *
 * Pleacă însă spre GA4, prin Measurement Protocol. E singurul semnal pe care
 * GA4 n-are cum să-l afle singur: nimic din ce se întâmplă în browserul omului
 * nu spune dacă a venit sau nu. Doar la bifare, nu şi la debifare — o corecţie
 * nu e un eveniment nou, iar GA4 n-are cum să retragă unul trimis.
 *
 * `webinarId` nu vine din `registrations`, deşi ar putea: îl primim de la
 * pagina care apelează, ca să ştim ce cale să reîmprospătăm fără o a doua
 * interogare.
 */
export async function comutaPrezenta(
  registrationId: string,
  webinarId: string,
  prezent: boolean
): Promise<{ ok: boolean }> {
  await ceruteDrepturi()

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('registrations')
    .update({ attended: prezent })
    .eq('id', registrationId)

  if (error) {
    console.error('Marcarea prezenței a eșuat:', error.message)
    return { ok: false }
  }

  if (prezent) await raporteazaPrezenta(registrationId)

  revalidatePath(`/admin/webinarii/${webinarId}/prezenta`)
  revalidatePath('/admin')

  return { ok: true }
}

/**
 * Trimite prezenţa către GA4, dacă avem cu ce.
 *
 * Interogarea în plus nu se poate evita: `client_id`-ul stă pe înscriere, iar
 * formatul şi slug-ul pe eveniment. Se cheamă o dată la o bifă, deci nu merită
 * complicat mai mult.
 *
 * Orice eşec e tăcut şi doar înregistrat: bifa trebuie să rămână bifată chiar
 * dacă Google nu răspunde.
 */
async function raporteazaPrezenta(registrationId: string) {
  const supabase = createAdminClient()

  const { data } = await supabase
    .from('registrations')
    .select('ga_client_id, webinars(slug, format)')
    .eq('id', registrationId)
    .maybeSingle()

  const webinar = data?.webinars as { slug: string; format: string } | null
  if (!data?.ga_client_id || !webinar) return

  await trimiteEvenimentGa4Server({
    clientId: data.ga_client_id,
    nume: 'attendance_confirmed',
    parametri: {
      webinar_slug: webinar.slug,
      webinar_format: webinar.format,
    },
  })
}
