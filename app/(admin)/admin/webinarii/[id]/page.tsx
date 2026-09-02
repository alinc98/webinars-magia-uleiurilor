import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Antet } from '@/components/admin/antet'
import { BadgeStatus } from '@/components/admin/badge-status'
import { FormularWebinar } from '@/components/admin/formular-webinar'
import { createAdminClient } from '@/lib/supabase/admin'

import { EditorWebinar } from './editor'
import { StergeWebinar } from './sterge'

export const dynamic = 'force-dynamic'

export default async function Page(props: PageProps<'/admin/webinarii/[id]'>) {
  const { id } = await props.params
  const supabase = createAdminClient()

  const [
    { data: webinar },
    { data: speakeri },
    { data: legaturi },
    { count: inscrisi },
    { count: inscrieriTotal },
    { data: sesiuni },
  ] = await Promise.all([
    supabase.from('webinars').select('*').eq('id', id).maybeSingle(),
    supabase
      .from('speakers')
      .select('id, name, role_title, is_default')
      .is('archived_at', null)
      .order('is_default', { ascending: false })
      .order('name'),
    supabase
      .from('webinar_speakers')
      .select('speaker_id, role_label, sort_order')
      .eq('webinar_id', id)
      .order('sort_order'),
    supabase
      .from('registrations')
      .select('id', { count: 'exact', head: true })
      .eq('webinar_id', id)
      .eq('kind', 'live'),
    // Fără filtrul pe `kind`: la ştergere pleacă toate, nu doar cele live.
    supabase
      .from('registrations')
      .select('id', { count: 'exact', head: true })
      .eq('webinar_id', id),
    supabase
      .from('webinar_sessions')
      .select('starts_at, ends_at, label')
      .eq('webinar_id', id)
      .order('starts_at'),
  ])

  if (!webinar) notFound()

  return (
    <>
      <Antet titlu={webinar.title} descriere={`${inscrisi ?? 0} înscriși`}>
        <BadgeStatus status={webinar.status} />
        <Link
          href={`/admin/leaduri?webinar=${webinar.id}`}
          className="text-sm underline underline-offset-4"
        >
          Vezi înscrișii
        </Link>
        <Link
          href={`/admin/webinarii/${webinar.id}/prezenta`}
          className="text-sm underline underline-offset-4"
        >
          Prezență
        </Link>
      </Antet>

      <EditorWebinar
        id={webinar.id}
        valori={{
          id: webinar.id,
          title: webinar.title,
          slug: webinar.slug,
          subtitle: webinar.subtitle,
          description: webinar.description,
          learning_points: (webinar.learning_points as string[]) ?? [],
          for_whom: (webinar.for_whom as string[]) ?? [],
          bonus_title: webinar.bonus_title,
          bonus_description: webinar.bonus_description,
          useful_info: webinar.useful_info,
          faq: (webinar.faq as { q: string; a: string }[] | null) ?? [],
          sessions: sesiuni ?? [],
          format: webinar.format,
          join_url: webinar.join_url,
          venue_name: webinar.venue_name,
          address: webinar.address,
          city: webinar.city,
          county: webinar.county,
          map_url: webinar.map_url,
          venue_notes: webinar.venue_notes,
          capacity: webinar.capacity,
          price_bani: webinar.price_bani,
          price_currency: webinar.price_currency,
          cover_image_url: webinar.cover_image_url,
          status: webinar.status,
          listed: webinar.listed,
          is_featured: webinar.is_featured,
          replay_public: webinar.replay_public,
          recording_url: webinar.recording_url,
          seo_title: webinar.seo_title,
          seo_description: webinar.seo_description,
          speaker_ids: (legaturi ?? []).map((l) => l.speaker_id),
          gazda_id: (legaturi ?? []).find((l) => l.role_label === 'gazda')
            ?.speaker_id,
        }}
        speakeri={speakeri ?? []}
      />

      <StergeWebinar id={webinar.id} inscrieri={inscrieriTotal ?? 0} />
    </>
  )
}
