import { Antet } from '@/components/admin/antet'
import { formateazaDataScurta } from '@/lib/format'
import { createAdminClient } from '@/lib/supabase/admin'

import { PanouAnunt } from './panou-anunt'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const supabase = createAdminClient()

  const [{ data: asteptare }, { data: publicate }] = await Promise.all([
    supabase
      .from('waitlist')
      .select('id, created_at, notified_at, interest, contacts(name, email)')
      .is('webinar_id', null)
      .order('created_at'),
    supabase
      .from('webinars')
      .select('id, title, starts_at')
      .eq('status', 'published')
      .gte('ends_at', new Date().toISOString())
      .order('starts_at'),
  ])

  const neanuntati = (asteptare ?? []).filter((w) => !w.notified_at)

  return (
    <>
      <Antet
        titlu="Pagina publică"
        descriere="Lista de așteptare de pe pagina principală, când nu e nimic programat."
      />

      <div className="flex flex-col gap-6 px-5 py-6 md:px-8">
        <PanouAnunt neanuntati={neanuntati.length} webinarii={publicate ?? []} />

        <section>
          <h2 className="font-medium">
            Cine așteaptă ({(asteptare ?? []).length})
          </h2>
          {(asteptare ?? []).length === 0 ? (
            <p className="text-muted-foreground mt-2 text-sm">
              Nimeni încă. Lista se umple când pagina publică n-are niciun
              eveniment programat.
            </p>
          ) : (
            <ul className="mt-2 divide-y rounded-lg border">
              {(asteptare ?? []).map((w) => (
                <li key={w.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 p-3 text-sm">
                  <span className="font-medium">{w.contacts?.name}</span>
                  <span className="text-muted-foreground break-all">{w.contacts?.email}</span>
                  <span className="text-muted-foreground ml-auto text-xs">
                    din {formateazaDataScurta(w.created_at)}
                  </span>
                  {w.notified_at ? (
                    <span className="text-xs text-emerald-700">anunțat</span>
                  ) : (
                    <span className="text-muted-foreground text-xs">neanunțat</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  )
}
