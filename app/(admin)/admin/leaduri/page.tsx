import Link from 'next/link'

import { Antet } from '@/components/admin/antet'
import { BadgeStatusContact } from '@/components/admin/badge-status'
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
            <div className="mt-5 hidden overflow-x-auto rounded-lg border md:block">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-left">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Nume</th>
                    <th className="px-4 py-2.5 font-medium">Email</th>
                    <th className="px-4 py-2.5 font-medium">Telefon</th>
                    <th className="px-4 py-2.5 font-medium">Status</th>
                    <th className="px-4 py-2.5 font-medium">Tag-uri</th>
                    <th className="px-4 py-2.5 text-right font-medium">Webinarii</th>
                    <th className="px-4 py-2.5 font-medium">Sursă</th>
                    <th className="px-4 py-2.5 font-medium">Primul contact</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {(leaduri ?? []).map((c) => (
                    <tr key={c.id} className="hover:bg-muted/30 h-11">
                      <td className="px-4">
                        <Link href={`/admin/leaduri/${c.id}`} className="font-medium hover:underline">
                          {c.name}
                        </Link>
                      </td>
                      <td className="text-muted-foreground px-4">{c.email}</td>
                      <td className="text-muted-foreground px-4">{c.phone ?? '—'}</td>
                      <td className="px-4">
                        <BadgeStatusContact status={c.status!} />
                      </td>
                      <td className="px-4">
                        <div className="flex flex-wrap gap-1">
                          {(c.tags ?? []).map((t) => (
                            <Badge key={t} variant="outline" className="text-xs">
                              {t}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 text-right tabular-nums">{c.registrations_count}</td>
                      <td className="text-muted-foreground px-4">{c.first_utm_source ?? '—'}</td>
                      <td className="text-muted-foreground px-4">
                        {formateazaDataScurta(c.created_at!)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="mt-5 flex flex-col gap-2 md:hidden">
              {(leaduri ?? []).map((c) => (
                <li key={c.id} className="rounded-lg border p-3">
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
