import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/lib/database.types'

export type WebinarPublic = Database['public']['Views']['webinars_public']['Row']

export type Speaker = {
  id: string
  name: string
  role_title: string | null
  bio_short: string | null
  photo_url: string | null
  instagram_url: string | null
  facebook_url: string | null
  website_url: string | null
  role_label: 'gazda' | 'invitat'
  sort_order: number
}

/** `speakers` vine ca jsonb din view; îl tipăm o singură dată, aici. */
export function speakeri(webinar: WebinarPublic): Speaker[] {
  return (webinar.speakers as unknown as Speaker[] | null) ?? []
}

export async function getWebinarBySlug(slug: string) {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('webinars_public')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()

  return data
}

/** Slug-urile de pre-generat la build (ISR). */
export async function getSlugsPublicate() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('webinars_public')
    .select('slug')
    .in('status', ['published', 'live'])

  return (data ?? []).flatMap((w) => (w.slug ? [w.slug] : []))
}

export async function getWebinariiHub() {
  const supabase = createAdminClient()

  const [viitoare, arhiva] = await Promise.all([
    supabase
      .from('webinars_public')
      .select('*')
      .in('status', ['published', 'live'])
      .eq('listed', true)
      .gte('starts_at', new Date().toISOString())
      .order('sort_order')
      .order('starts_at'),
    supabase
      .from('webinars_public')
      .select('*')
      .eq('status', 'ended')
      .eq('replay_public', true)
      .order('starts_at', { ascending: false })
      .limit(12),
  ])

  const programate = viitoare.data ?? []

  // Cel marcat `is_featured` ocupă locul evidențiat; altfel cel mai apropiat în
  // timp (brief §11).
  const evidentiat =
    programate.find((w) => w.is_featured) ??
    [...programate].sort((a, b) =>
      (a.starts_at ?? '').localeCompare(b.starts_at ?? '')
    )[0] ??
    null

  return {
    evidentiat,
    restul: programate.filter((w) => w.id !== evidentiat?.id),
    arhiva: arhiva.data ?? [],
  }
}
