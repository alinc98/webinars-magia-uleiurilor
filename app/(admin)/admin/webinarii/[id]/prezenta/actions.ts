'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

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

  revalidatePath(`/admin/webinarii/${webinarId}/prezenta`)
  revalidatePath('/admin')

  return { ok: true }
}
