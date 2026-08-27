'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminUser } from '@/lib/supabase/auth'
import type { Database } from '@/lib/database.types'

async function ceruteDrepturi() {
  if (!(await getAdminUser())) redirect('/login')
}

const contactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z
    .string()
    .trim()
    .max(30)
    .optional()
    .or(z.literal('').transform(() => undefined)),
  status: z.enum(['nou', 'contactat', 'interesat', 'client', 'inactiv']),
  tags: z.string().optional(),
  notes: z
    .string()
    .trim()
    .max(5000)
    .optional()
    .or(z.literal('').transform(() => undefined)),
})

export type StareContact = { ok: boolean; mesaj?: string }

export async function actualizeazaContact(
  id: string,
  _stare: StareContact,
  formData: FormData
): Promise<StareContact> {
  await ceruteDrepturi()

  const rezultat = contactSchema.safeParse(Object.fromEntries(formData.entries()))
  if (!rezultat.success) return { ok: false, mesaj: 'Verifică datele completate.' }

  const { tags, ...date } = rezultat.data
  const supabase = createAdminClient()

  const { data: inainte } = await supabase
    .from('contacts')
    .select('status, tags, notes')
    .eq('id', id)
    .maybeSingle()

  const tagNoi = (tags ?? '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)

  const { error } = await supabase
    .from('contacts')
    .update({ ...date, tags: tagNoi })
    .eq('id', id)

  if (error) return { ok: false, mesaj: 'Nu am putut salva.' }

  // Timeline-ul contactului trebuie să arate ce s-a schimbat, nu doar că
  // „s-a salvat ceva".
  const activitati: Database['public']['Tables']['activities']['Insert'][] = []

  if (inainte && date.notes && date.notes !== inainte.notes) {
    activitati.push({ contact_id: id, type: 'nota_adaugata', payload: { nota: date.notes } })
  }
  const adaugate = tagNoi.filter((t) => !(inainte?.tags ?? []).includes(t))
  if (adaugate.length > 0) {
    activitati.push({ contact_id: id, type: 'tag_adaugat', payload: { taguri: adaugate } })
  }
  if (activitati.length > 0) await supabase.from('activities').insert(activitati)

  revalidatePath(`/admin/leaduri/${id}`)
  return { ok: true, mesaj: 'Salvat.' }
}

/**
 * Dreptul la ștergere (GDPR, brief §10): contactul dispare, dar statistica
 * agregată a evenimentelor rămâne corectă.
 *
 * `registrations` are `ON DELETE CASCADE`, deci ștergerea contactului ar
 * scădea numărul de înscriși la evenimentele trecute. Anonimizăm în loc să
 * ștergem: rândurile rămân, dar nu mai duc spre o persoană.
 */
export async function stergeContact(id: string) {
  await ceruteDrepturi()
  const supabase = createAdminClient()

  const anonim = `sters-${crypto.randomUUID()}@anonim.invalid`

  await supabase.from('activities').delete().eq('contact_id', id)
  await supabase.from('email_log').delete().eq('contact_id', id)
  await supabase.from('waitlist').delete().eq('contact_id', id)

  await supabase
    .from('contacts')
    .update({
      name: 'Contact șters',
      email: anonim,
      phone: null,
      notes: null,
      tags: [],
      status: 'inactiv',
      consent_marketing: false,
      unsubscribed_at: new Date().toISOString(),
      first_utm_source: null,
      first_utm_medium: null,
      first_utm_campaign: null,
      first_utm_content: null,
      first_utm_term: null,
      first_fbclid: null,
      city: null,
      country: null,
    })
    .eq('id', id)

  revalidatePath('/admin/leaduri')
  redirect('/admin/leaduri')
}
