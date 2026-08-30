import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Antet } from '@/components/admin/antet'
import { createAdminClient } from '@/lib/supabase/admin'
import { formateazaDataOra } from '@/lib/format'

import { ListaPrezenta, type Inscris } from './lista'

export const dynamic = 'force-dynamic'

type RandInscriere = {
  id: string
  registered_at: string
  attended: boolean
  contacts: { name: string; email: string } | null
}

export default async function Page(props: PageProps<'/admin/webinarii/[id]/prezenta'>) {
  const { id } = await props.params
  const supabase = createAdminClient()

  const [{ data: webinar }, { data: inscrieri }] = await Promise.all([
    supabase.from('webinars').select('id, title, starts_at').eq('id', id).maybeSingle(),
    supabase
      .from('registrations')
      .select('id, registered_at, attended, contacts(name, email)')
      .eq('webinar_id', id)
      // Doar cine s-a înscris la eveniment, nu şi cine a cerut înregistrarea
      // după: aceia n-aveau cum să fie în sală.
      .eq('kind', 'live')
      .order('registered_at'),
  ])

  if (!webinar) notFound()

  const lista: Inscris[] = ((inscrieri ?? []) as unknown as RandInscriere[]).map((r) => ({
    id: r.id,
    name: r.contacts?.name ?? 'Contact șters',
    email: r.contacts?.email ?? '—',
    registeredAt: r.registered_at,
    attended: r.attended,
  }))

  return (
    <>
      <Antet titlu="Prezență" descriere={`${webinar.title} · ${formateazaDataOra(webinar.starts_at)}`}>
        <Link
          href={`/admin/webinarii/${id}`}
          className="text-sm underline underline-offset-4"
        >
          Înapoi la eveniment
        </Link>
      </Antet>

      <div className="px-5 py-5 md:px-8">
        {lista.length === 0 ? (
          <div className="rounded-lg border border-dashed py-16 text-center">
            <p className="font-medium">Nimeni înscris încă.</p>
            <p className="text-text-muted mt-1 text-sm">
              Prezența se poate marca după ce se înscrie cineva.
            </p>
          </div>
        ) : (
          <ListaPrezenta webinarId={id} inscrisi={lista} />
        )}
      </div>
    </>
  )
}
