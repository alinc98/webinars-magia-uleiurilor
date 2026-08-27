'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminUser } from '@/lib/supabase/auth'

const optional = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .or(z.literal('').transform(() => undefined))

const speakerSchema = z.object({
  name: z.string().trim().min(2, 'Scrie numele.').max(120),
  role_title: optional(120),
  // 250 e recomandarea din brief §7.4, nu o limită dură: un text de 260 de
  // caractere nu merită respins.
  bio_short: optional(600),
  photo_url: optional(500),
  instagram_url: optional(300),
  facebook_url: optional(300),
  website_url: optional(300),
  is_default: z.coerce.boolean<boolean>(),
})

export type StareSpeaker = { ok: boolean; mesaj?: string; erori?: Record<string, string> }

async function ceruteDrepturi() {
  if (!(await getAdminUser())) redirect('/login')
}

export async function salveazaSpeaker(
  id: string | null,
  _stare: StareSpeaker,
  formData: FormData
): Promise<StareSpeaker> {
  await ceruteDrepturi()

  const rezultat = speakerSchema.safeParse({
    ...Object.fromEntries(formData.entries()),
    is_default: formData.get('is_default') === 'on',
  })

  if (!rezultat.success) {
    const erori: Record<string, string> = {}
    for (const issue of rezultat.error.issues) {
      erori[issue.path.map(String).join('.') || 'form'] ??= issue.message
    }
    return { ok: false, mesaj: 'Verifică datele completate.', erori }
  }

  const supabase = createAdminClient()
  const date = rezultat.data

  // Un singur speaker implicit, garantat de un index unic în bază.
  if (date.is_default) {
    await supabase
      .from('speakers')
      .update({ is_default: false })
      .eq('is_default', true)
      .neq('id', id ?? '00000000-0000-0000-0000-000000000000')
  }

  const { error } = id
    ? await supabase.from('speakers').update(date).eq('id', id)
    : await supabase.from('speakers').insert(date)

  if (error) {
    console.error('Salvarea speakerului a eșuat:', error.message)
    return { ok: false, mesaj: 'Nu am putut salva.' }
  }

  revalidatePath('/admin/speakeri')
  revalidatePath('/')
  return { ok: true, mesaj: 'Salvat.' }
}

/**
 * Ștergerea reușește doar dacă speakerul n-a fost folosit niciodată. Altfel
 * `ON DELETE RESTRICT` o refuză, iar arhivarea e singura opțiune — altfel
 * paginile evenimentelor trecute rămân cu goluri (brief §7.4).
 */
export async function stergeSauArhiveazaSpeaker(id: string) {
  await ceruteDrepturi()
  const supabase = createAdminClient()

  const { error } = await supabase.from('speakers').delete().eq('id', id)

  if (error) {
    await supabase
      .from('speakers')
      .update({ archived_at: new Date().toISOString(), is_default: false })
      .eq('id', id)
  }

  revalidatePath('/admin/speakeri')
}

export async function dezarhiveazaSpeaker(id: string) {
  await ceruteDrepturi()
  const supabase = createAdminClient()
  await supabase.from('speakers').update({ archived_at: null }).eq('id', id)
  revalidatePath('/admin/speakeri')
}
