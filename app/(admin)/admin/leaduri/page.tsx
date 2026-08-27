import Link from 'next/link'

import { Antet } from '@/components/admin/antet'
import { BadgeStatusContact } from '@/components/admin/badge-status'
import { CapTabel, Celula, RandTabel, Tabel } from '@/components/admin/tabel'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formateazaDataScurta } from '@/lib/format'
import { areFiltreActive, citesteFiltre, interogheazaLeaduri, PE_PAGINA } from '@/lib/leaduri/filtre'
import { createAdminClient } from '@/lib/supabase/admin'

import { BaraFiltre } from './bara-filtre'

export const dynamic = 'force-dynamic'

export default async function Page(props: PageProps<'/admin/leaduri'>) {
  const searchParams = await props.searchParams
  const filtre = citesteFiltre(searchParams)

  const supabase = createAdminClient()
  const [{ data: leaduri, count }, { data: webinarii }] = await Promise.all([
    interogheazaLeaduri(filtre),
    supabase.from('webinars').select('id, title').order('starts_at', { ascending: false }),
  ])

  const total = count ?? 0
  const pagini = Math.max(1, Math.ceil(total / PE_PAGINA))
  const cuFiltre = areFiltreActive(filtre)

  const query = new URLSearchParams(
    Object.entries(searchParams).flatMap(([k, v]) =>
      typeof v === 'string' && v ? [[k, v] as [string, string]] : []
    )
  )

  return (
    <>
      <Antet titlu="Lead-uri" descriere={`${total} ${total === 1 ? 'contact' : 'contacte'}`}>
        <Button variant="outline" asChild>
          <a href={`/admin/leaduri/export?${query.toString()}`}>Exportă CSV</a>
        </Button>
      </Antet>

      <div className="px-5 py-5 md:px-8">
        <BaraFiltre webinarii={webinarii ?? []} />

        {(leaduri ?? []).length === 0 ? (
          <div className="mt-6 rounded-lg border border-dashed py-16 text-center">
            {/* „Niciun lead încă" și „niciun rezultat pentru filtre" sunt două
                lucruri diferite și merită tratate diferit (brief §17). */}
            {cuFiltre ? (
              <>
                <p className="font-medium">Niciun rezultat pentru filtrele curente.</p>
                <p className="text-muted-foreground mt-1 text-sm">
                  Încearcă să scoți un filtru.
                </p>
                <Button variant="outline" asChild className="mt-4">
                  <Link href="/admin/leaduri">Șterge filtrele</Link>
                </Button>
              </>
            ) : (
              <>
                <p className="font-medium">Niciun lead încă.</p>
                <p className="text-muted-foreground mt-1 text-sm">
                  Primul va apărea aici imediat ce cineva se înscrie.
                </p>
              </>
            )}
          </div>
        ) : (
          <>
            {/* Pe desktop tabel, pe mobil carduri stivuite — Andreea verifică
                înscrierile de pe telefon în ziua evenimentului (brief §17). */}
            <div className="mt-4 hidden md:block">
              <Tabel>
                <CapTabel
                  coloane={[
                    'Nume',
                    'Email',
                    'Telefon',
                    'Status',
                    'Tag-uri',
                    { text: 'Webinarii', laDreapta: true },
                    'Sursă',
                    'Primul contact',
                  ]}
                />
                <tbody>
                  {(leaduri ?? []).map((c, i) => (
                    <RandTabel key={c.id} index={i}>
                      <Celula accentuat>
                        <Link href={`/admin/leaduri/${c.id}`} className="hover:underline">
                          {c.name}
                        </Link>
                      </Celula>
                      <Celula discret>{c.email}</Celula>
                      <Celula discret>{c.phone ?? '—'}</Celula>
                      <Celula>
                        <BadgeStatusContact status={c.status!} />
                      </Celula>
                      <Celula>
                        <div className="flex flex-wrap gap-1">
                          {(c.tags ?? []).map((t) => (
                            <Badge key={t} variant="outline" className="text-xs">
                              {t}
                            </Badge>
                          ))}
                        </div>
                      </Celula>
                      <Celula laDreapta>{c.registrations_count}</Celula>
                      <Celula discret>{c.first_utm_source ?? '—'}</Celula>
                      <Celula discret>{formateazaDataScurta(c.created_at!)}</Celula>
                    </RandTabel>
                  ))}
                </tbody>
              </Tabel>
            </div>

            <ul className="mt-4 flex flex-col gap-2 md:hidden">
              {(leaduri ?? []).map((c) => (
                <li key={c.id} className="border-admin-border rounded-lg border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <Link href={`/admin/leaduri/${c.id}`} className="font-medium">
                      {c.name}
                    </Link>
                    <BadgeStatusContact status={c.status!} />
                  </div>
                  <p className="text-muted-foreground mt-1 text-sm break-all">{c.email}</p>
                  {c.phone && <p className="text-muted-foreground text-sm">{c.phone}</p>}
                  <p className="text-muted-foreground mt-1 text-xs">
                    {c.registrations_count} webinarii · {formateazaDataScurta(c.created_at!)}
                    {c.first_utm_source ? ` · ${c.first_utm_source}` : ''}
                  </p>
                </li>
              ))}
            </ul>

            {pagini > 1 && (
              <nav className="mt-5 flex items-center justify-between">
                <p className="text-muted-foreground text-sm">
                  Pagina {filtre.pagina} din {pagini}
                </p>
                <div className="flex gap-2">
                  {filtre.pagina > 1 && (
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`?${paginaCu(query, filtre.pagina - 1)}`}>Înapoi</Link>
                    </Button>
                  )}
                  {filtre.pagina < pagini && (
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`?${paginaCu(query, filtre.pagina + 1)}`}>Înainte</Link>
                    </Button>
                  )}
                </div>
              </nav>
            )}
          </>
        )}
      </div>
    </>
  )
}

function paginaCu(query: URLSearchParams, pagina: number) {
  const noi = new URLSearchParams(query)
  noi.set('pagina', String(pagina))
  return noi.toString()
}
