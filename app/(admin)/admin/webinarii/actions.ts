'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { getAdminUser } from '@/lib/supabase/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { webinarSchema } from '@/lib/validations/webinar'

export type StareFormular = {
  ok: boolean
  mesaj?: string
  erori?: Record<string, string>
}

/**
 * Fiecare acțiune își verifică singură sesiunea.
 *
 * Layout-ul protejează randarea, dar o Server Action e un endpoint: poate fi
 * apelată direct, fără să treacă vreodată prin layout.
 */
async function ceruteDrepturi() {
  const utilizator = await getAdminUser()
  if (!utilizator) redirect('/login')
  return utilizator
}

function citesteFormular(formData: FormData) {
  const brut = Object.fromEntries(formData.entries())
  return webinarSchema.safeParse({
    ...brut,
    listed: formData.get('listed') === 'on',
    is_featured: formData.get('is_featured') === 'on',
    replay_public: formData.get('replay_public') === 'on',
    speaker_ids: formData.getAll('speaker_ids').filter(Boolean) as string[],
  })
}

function erori(issues: { path: PropertyKey[]; message: string }[]) {
  const out: Record<string, string> = {}
  for (const issue of issues) {
    const cheie = issue.path.map(String).join('.') || 'form'
    out[cheie] ??= issue.message
  }
  return out
}

/** Republică paginile atinse de o modificare. */
function reimprospateaza(slug: string, slugVechi?: string) {
  revalidatePath('/')
  revalidatePath(`/webinar/${slug}`)
  if (slugVechi && slugVechi !== slug) revalidatePath(`/webinar/${slugVechi}`)
}

export async function salveazaWebinar(
  id: string | null,
  _stare: StareFormular,
  formData: FormData
): Promise<StareFormular> {
  await ceruteDrepturi()

  const rezultat = citesteFormular(formData)
  if (!rezultat.success) {
    return { ok: false, mesaj: 'Verifică datele completate.', erori: erori(rezultat.error.issues) }
  }

  const { speaker_ids, gazda_id, ...date } = rezultat.data
  const supabase = createAdminClient()

  // Un singur webinar evidențiat: baza garantează asta printr-un index unic,
  // deci trebuie să-l deselectăm pe cel anterior înainte de scriere, nu după.
  if (date.is_featured) {
    await supabase
      .from('webinars')
      .update({ is_featured: false })
      .eq('is_featured', true)
      .neq('id', id ?? '00000000-0000-0000-0000-000000000000')
  }

  const valori = {
    ...date,
    starts_at: new Date(date.starts_at).toISOString(),
    learning_points: date.learning_points,
    for_whom: date.for_whom,
  }

  let slugVechi: string | undefined
  let webinarId = id

  if (id) {
    const { data: existent } = await supabase
      .from('webinars')
      .select('slug')
      .eq('id', id)
      .maybeSingle()
    slugVechi = existent?.slug

    const { error } = await supabase.from('webinars').update(valori).eq('id', id)
    if (error) return { ok: false, mesaj: traduEroare(error.message) }
  } else {
    const { data, error } = await supabase.from('webinars').insert(valori).select('id').single()
    if (error) return { ok: false, mesaj: traduEroare(error.message) }
    webinarId = data.id
  }

  if (webinarId) {
    await sincronizeazaSpeakeri(webinarId, speaker_ids, gazda_id)
  }

  reimprospateaza(date.slug, slugVechi)

  if (!id && webinarId) redirect(`/admin/webinarii/${webinarId}?salvat=1`)
  return { ok: true, mesaj: 'Salvat.' }
}

async function sincronizeazaSpeakeri(
  webinarId: string,
  speakerIds: string[],
  gazdaId?: string
) {
  const supabase = createAdminClient()

  await supabase.from('webinar_speakers').delete().eq('webinar_id', webinarId)

  if (speakerIds.length === 0) return

  await supabase.from('webinar_speakers').insert(
    speakerIds.map((speakerId, index) => ({
      webinar_id: webinarId,
      speaker_id: speakerId,
      role_label: (speakerId === gazdaId ? 'gazda' : 'invitat') as 'gazda' | 'invitat',
      sort_order: index + 1,
    }))
  )
}

/** „Copiază webinarul precedent": un eveniment recurent se creează în 90 de secunde. */
export async function dupliceazaWebinar(id: string) {
  await ceruteDrepturi()
  const supabase = createAdminClient()

  const { data: sursa } = await supabase.from('webinars').select('*').eq('id', id).maybeSingle()
  if (!sursa) return

  const { id: _id, created_at, updated_at, slug, ...restul } = sursa

  const { data: copie, error } = await supabase
    .from('webinars')
    .insert({
      ...restul,
      slug: `${slug}-copie-${Date.now().toString(36)}`,
      title: `${sursa.title} (copie)`,
      // Copia pornește mereu ca ciornă și nepublicată: altfel un clic greșit
      // publică un eveniment cu data veche.
      status: 'draft',
      is_featured: false,
      replay_public: false,
      recording_url: null,
    })
    .select('id')
    .single()

  if (error || !copie) return

  const { data: speakeri } = await supabase
    .from('webinar_speakers')
    .select('speaker_id, role_label, sort_order')
    .eq('webinar_id', id)

  if (speakeri?.length) {
    await supabase
      .from('webinar_speakers')
      .insert(speakeri.map((s) => ({ ...s, webinar_id: copie.id })))
  }

  revalidatePath('/admin/webinarii')
  redirect(`/admin/webinarii/${copie.id}`)
}

function traduEroare(mesaj: string): string {
  if (mesaj.includes('webinars_slug_valid')) return 'Slug invalid.'
  if (mesaj.includes('webinars_slug_key') || mesaj.includes('duplicate key'))
    return 'Există deja un webinar cu acest slug.'
  if (mesaj.includes('webinars_un_singur_featured'))
    return 'Un alt webinar e deja evidențiat.'
  if (mesaj.includes('webinars_online_cere_link'))
    return 'Un eveniment online publicat are nevoie de link de acces.'
  if (mesaj.includes('webinars_fizic_cere_locatie'))
    return 'Un eveniment fizic publicat are nevoie de locație, adresă și oraș.'
  if (mesaj.includes('webinars_replay_cere_url'))
    return 'Ca să publici înregistrarea, ai nevoie de link.'
  if (mesaj.includes('cel mult 3 speakeri')) return 'Cel mult trei speakeri.'
  console.error('Eroare la salvarea webinarului:', mesaj)
  return 'Nu am putut salva. Încearcă din nou.'
}
