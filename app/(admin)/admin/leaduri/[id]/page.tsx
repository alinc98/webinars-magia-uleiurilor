import { notFound } from 'next/navigation'
import Link from 'next/link'

import { Antet } from '@/components/admin/antet'
import { Button } from '@/components/ui/button'
import { formateazaDataOra } from '@/lib/format'
import { createAdminClient } from '@/lib/supabase/admin'

import { FisaContact } from './fisa'

export const dynamic = 'force-dynamic'

const DESCRIERE_ACTIVITATE: Record<string, string> = {
  inscriere: 'S-a înscris',
  cerere_inregistrare: 'A cerut înregistrarea',
  lista_asteptare: 'A intrat pe lista de așteptare',
  email_trimis: 'Email trimis',
  email_deschis: 'A deschis un email',
  prezenta: 'A participat',
  nota_adaugata: 'Notă adăugată',
  tag_adaugat: 'Tag adăugat',
  dezabonare: 'S-a dezabonat',
  export: 'Inclus într-un export',
}

export default async function Page(props: PageProps<'/admin/leaduri/[id]'>) {
  const { id } = await props.params
  const supabase = createAdminClient()

  const [{ data: contact }, { data: inscrieri }, { data: activitati }, { data: emailuri }] =
    await Promise.all([
      supabase.from('contacts_with_stats').select('*').eq('id', id).maybeSingle(),
      supabase
        .from('registrations')
        .select('id, kind, attended, registered_at, webinars(id, title, slug, starts_at)')
        .eq('contact_id', id)
        .order('registered_at', { ascending: false }),
      supabase
        .from('activities')
        .select('*')
        .eq('contact_id', id)
        .order('created_at', { ascending: false })
        .limit(100),
      supabase
        .from('email_log')
        .select('*')
        .eq('contact_id', id)
        .order('created_at', { ascending: false }),
    ])

  if (!contact) notFound()

  return (
    <>
      <Antet titlu={contact.name!} descriere={contact.email!}>
        <Button variant="outline" asChild>
          <a href={`/admin/leaduri/${id}/export`}>Exportă datele</a>
        </Button>
      </Antet>

      <div className="grid gap-6 px-5 py-6 md:px-8 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        <FisaContact
          id={id}
          valori={{
            name: contact.name!,
            email: contact.email!,
            phone: contact.phone,
            status: contact.status!,
            tags: contact.tags ?? [],
            notes: contact.notes,
            consent_marketing: contact.consent_marketing!,
            consent_at: contact.consent_at,
            consent_text_version: contact.consent_text_version,
            unsubscribed_at: contact.unsubscribed_at,
            first_utm_source: contact.first_utm_source,
            first_utm_campaign: contact.first_utm_campaign,
          }}
        />

        <div className="flex flex-col gap-6">
          <section>
            <h2 className="font-medium">Înscrieri</h2>
            {(inscrieri ?? []).length === 0 ? (
              <p className="text-muted-foreground mt-2 text-sm">Nicio înscriere.</p>
            ) : (
              <ul className="mt-2 divide-y rounded-lg border">
                {(inscrieri ?? []).map((r) => (
                  <li key={r.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 p-3 text-sm">
                    <Link
                      href={`/admin/webinarii/${r.webinars?.id}`}
                      className="font-medium hover:underline"
                    >
                      {r.webinars?.title}
                    </Link>
                    <span className="text-muted-foreground">
                      {r.kind === 'live' ? 'înscriere' : 'înregistrare'}
                    </span>
                    {r.attended && (
                      <span className="text-emerald-700">a participat</span>
                    )}
                    <span className="text-muted-foreground ml-auto text-xs">
                      {formateazaDataOra(r.registered_at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="font-medium">Emailuri</h2>
            {(emailuri ?? []).length === 0 ? (
              <p className="text-muted-foreground mt-2 text-sm">Niciun email încă.</p>
            ) : (
              <ul className="mt-2 divide-y rounded-lg border">
                {(emailuri ?? []).map((m) => (
                  <li key={m.id} className="flex flex-wrap items-center gap-x-3 p-3 text-sm">
                    <span>{m.subject ?? m.template}</span>
                    <span className="text-muted-foreground">{m.status}</span>
                    <span className="text-muted-foreground ml-auto text-xs">
                      {formateazaDataOra(m.created_at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="font-medium">Istoric</h2>
            <ol className="mt-2 flex flex-col gap-3 border-l pl-4">
              {(activitati ?? []).map((a) => (
                <li key={a.id} className="relative text-sm">
                  <span className="bg-border absolute -left-[21px] top-1.5 size-2 rounded-full" />
                  <p>{DESCRIERE_ACTIVITATE[a.type] ?? a.type}</p>
                  <p className="text-muted-foreground text-xs">
                    {formateazaDataOra(a.created_at)}
                  </p>
                </li>
              ))}
              {(activitati ?? []).length === 0 && (
                <li className="text-muted-foreground text-sm">Nimic încă.</li>
              )}
            </ol>
          </section>
        </div>
      </div>
    </>
  )
}
