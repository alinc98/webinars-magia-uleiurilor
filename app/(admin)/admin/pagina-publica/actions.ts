'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { getDestinatar, getWebinarPentruEmail } from '@/lib/email/destinatar'
import { trimiteSablon } from '@/lib/email/trimite'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminUser } from '@/lib/supabase/auth'

export type StareAnunt = { ok: boolean; mesaj?: string }

/**
 * „Anunță lista": aici se vede cel mai clar valoarea CRM-ului propriu — pe
 * Facebook Events lista asta nu există (brief §7.3).
 *
 * Se marchează `notified_at` *înainte* de trimitere, ca un dublu-clic sau o
 * reîncercare să nu trimită de două ori.
 */
export async function anuntaLista(
  webinarId: string,
  _stare: StareAnunt,
  _formData: FormData
): Promise<StareAnunt> {
  if (!(await getAdminUser())) redirect('/login')

  const supabase = createAdminClient()

  const webinar = await getWebinarPentruEmail(webinarId)
  if (!webinar) return { ok: false, mesaj: 'Nu am găsit webinarul.' }

  const { data: revendicati, error } = await supabase
    .from('waitlist')
    .update({ notified_at: new Date().toISOString() })
    .is('notified_at', null)
    .is('webinar_id', null)
    .select('contact_id')

  if (error) return { ok: false, mesaj: 'Nu am putut citi lista.' }
  if (!revendicati?.length) return { ok: true, mesaj: 'Nu e nimeni de anunțat.' }

  let trimise = 0
  let sarite = 0

  for (const rand of revendicati) {
    const destinatar = await getDestinatar(rand.contact_id)
    if (!destinatar) continue

    const rezultat = await trimiteSablon({ sablon: 'anunt_lista', destinatar, webinar })
    if (rezultat.ok) trimise += 1
    else sarite += 1
  }

  revalidatePath('/admin/pagina-publica')
  return {
    ok: true,
    mesaj: `Trimis către ${trimise} ${trimise === 1 ? 'persoană' : 'persoane'}${sarite ? `, ${sarite} sărite` : ''}.`,
  }
}
