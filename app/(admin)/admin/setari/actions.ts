'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminUser } from '@/lib/supabase/auth'

export type StareSetari = { ok: boolean; mesaj?: string }

async function ceruteDrepturi() {
  const utilizator = await getAdminUser()
  if (!utilizator) redirect('/login')
  return utilizator
}

/**
 * Doar proprietarii umblă la lista de acces.
 *
 * Interfața ascunde deja butoanele de la editori, dar o Server Action e un
 * endpoint: poate fi apelată direct, fără să treacă vreodată prin interfață.
 */
async function ceruteProprietar() {
  const utilizator = await ceruteDrepturi()
  if (utilizator.role !== 'owner') return null
  return utilizator
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


const adminSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email('Verifică adresa de email.')),
  name: z
    .string()
    .trim()
    .max(120)
    .optional()
    .or(z.literal('').transform(() => undefined)),
  role: z.enum(['owner', 'editor']),
})

/**
 * Adaugă o adresă pe lista albă.
 *
 * Nu e nevoie de invitație sau de parolă: contul Supabase se creează singur la
 * prima autentificare. Lista albă e singura care decide cine are voie, iar ea
 * se verifică și înainte de trimiterea linkului, și la fiecare randare a
 * panoului.
 */
export async function adaugaAdmin(
  _stare: StareSetari,
  formData: FormData
): Promise<StareSetari> {
  if (!(await ceruteProprietar())) {
    return { ok: false, mesaj: 'Doar un proprietar poate schimba lista de acces.' }
  }

  const rezultat = adminSchema.safeParse(Object.fromEntries(formData.entries()))
  if (!rezultat.success) {
    return { ok: false, mesaj: rezultat.error.issues[0]?.message }
  }

  const supabase = createAdminClient()
  const { error } = await supabase.from('admin_users').insert(rezultat.data)

  if (error) {
    if (error.message.includes('duplicate key')) {
      return { ok: false, mesaj: 'Adresa are deja acces.' }
    }
    console.error('Adăugarea adminului a eșuat:', error.message)
    return { ok: false, mesaj: 'Nu am putut adăuga adresa.' }
  }

  revalidatePath('/admin/setari')
  return { ok: true, mesaj: `${rezultat.data.email} are acum acces.` }
}

/**
 * Scoate o adresă de pe lista albă.
 *
 * Două lucruri nu sunt permise, ca panoul să nu ajungă inaccesibil: să te scoți
 * pe tine însuți și să dispară ultimul proprietar.
 */
export async function stergeAdmin(id: string): Promise<StareSetari> {
  const utilizator = await ceruteProprietar()
  if (!utilizator) {
    return { ok: false, mesaj: 'Doar un proprietar poate schimba lista de acces.' }
  }

  if (utilizator.id === id) {
    return { ok: false, mesaj: 'Nu te poți scoate pe tine din listă.' }
  }

  const supabase = createAdminClient()
  const { data: tinta } = await supabase
    .from('admin_users')
    .select('email, role')
    .eq('id', id)
    .maybeSingle()

  if (!tinta) return { ok: false, mesaj: 'Adresa nu mai există.' }

  if (tinta.role === 'owner') {
    const { count } = await supabase
      .from('admin_users')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'owner')

    if ((count ?? 0) <= 1) {
      return {
        ok: false,
        mesaj: 'E singurul proprietar. Fă pe altcineva proprietar înainte.',
      }
    }
  }

  const { error } = await supabase.from('admin_users').delete().eq('id', id)
  if (error) return { ok: false, mesaj: 'Nu am putut scoate adresa.' }

  revalidatePath('/admin/setari')
  return { ok: true, mesaj: `${tinta.email} nu mai are acces.` }
}

export async function schimbaRolAdmin(id: string, rol: 'owner' | 'editor'): Promise<StareSetari> {
  const utilizator = await ceruteProprietar()
  if (!utilizator) {
    return { ok: false, mesaj: 'Doar un proprietar poate schimba rolurile.' }
  }

  if (utilizator.id === id && rol === 'editor') {
    return { ok: false, mesaj: 'Nu-ți poți scădea singur rolul.' }
  }

  const supabase = createAdminClient()
  const { error } = await supabase.from('admin_users').update({ role: rol }).eq('id', id)
  if (error) return { ok: false, mesaj: 'Nu am putut schimba rolul.' }

  revalidatePath('/admin/setari')
  return { ok: true }
}
