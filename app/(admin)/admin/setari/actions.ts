'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminUser } from '@/lib/supabase/auth'

export type StareSetari = { ok: boolean; mesaj?: string }

async function ceruteDrepturi() {
  if (!(await getAdminUser())) redirect('/login')
}

const consimtamantSchema = z.object({
  body: z.string().trim().min(40, 'Textul e prea scurt ca să fie un consimțământ valid.'),
  version: z
    .string()
    .trim()
    .min(3, 'Dă-i o versiune, ex. 2026-09-v1.')
    .max(40)
    .regex(/^[a-z0-9.\-]+$/i, 'Doar litere, cifre, puncte și cratime.'),
})

/**
 * Textul de consimțământ nu se editează pe loc: se publică o versiune nouă.
 *
 * Contactele existente păstrează versiunea pe care au acceptat-o efectiv. Dacă
 * ai rescrie textul vechi, n-ai mai ști ce a acceptat fiecare — exact ce cere
 * brieful §10 să nu se întâmple.
 */
export async function publicaConsimtamant(
  _stare: StareSetari,
  formData: FormData
): Promise<StareSetari> {
  await ceruteDrepturi()

  const rezultat = consimtamantSchema.safeParse(Object.fromEntries(formData.entries()))
  if (!rezultat.success) {
    return { ok: false, mesaj: rezultat.error.issues[0]?.message }
  }

  const supabase = createAdminClient()
  const { version, body } = rezultat.data

  const { data: existent } = await supabase
    .from('consent_texts')
    .select('version')
    .eq('version', version)
    .maybeSingle()

  if (existent) {
    return { ok: false, mesaj: `Versiunea ${version} există deja. Alege alt nume.` }
  }

  await supabase.from('consent_texts').update({ is_current: false }).eq('is_current', true)

  const { error } = await supabase
    .from('consent_texts')
    .insert({ version, body, is_current: true })

  if (error) {
    console.error('Publicarea consimțământului a eșuat:', error.message)
    return { ok: false, mesaj: 'Nu am putut publica versiunea.' }
  }

  revalidatePath('/admin/setari')
  // Textul apare sub căsuța de bifat de pe fiecare pagină de webinar.
  revalidatePath('/webinar/[slug]', 'page')
  revalidatePath('/')
  return { ok: true, mesaj: `Versiunea ${version} e activă acum.` }
}

export async function salveazaRetentie(
  _stare: StareSetari,
  formData: FormData
): Promise<StareSetari> {
  await ceruteDrepturi()

  const luni = Number(formData.get('retentie_luni'))
  if (!Number.isInteger(luni) || luni < 1 || luni > 120) {
    return { ok: false, mesaj: 'Alege între 1 și 120 de luni.' }
  }

  const supabase = createAdminClient()
  const { error } = await supabase.from('settings').update({ retentie_luni: luni }).eq('id', true)

  if (error) return { ok: false, mesaj: 'Nu am putut salva.' }

  revalidatePath('/admin/setari')
  return { ok: true, mesaj: 'Salvat.' }
}
