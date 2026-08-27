import Link from 'next/link'

import { Antet } from '@/components/admin/antet'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { formateazaDataOra } from '@/lib/format'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

type Statistici = {
  leads_today: number
  leads_7d: number
  leads_30d: number
  leads_prev_7d: number
  leads_prev_30d: number
  waitlist_pending: number
  next_webinar: {
    slug: string
    title: string
    starts_at: string
    registrations_count: number
    seats_left: number | null
  } | null
  last_webinar: {
    title: string
    registered: number
    attended: number
    show_up_rate: number | null
  } | null
}

export default async function Page() {
  const supabase = createAdminClient()

  const [{ data: statBrut }, { data: zile }, { data: ultimele }] = await Promise.all([
    supabase.rpc('dashboard_stats'),
    supabase.rpc('leads_per_day', { p_days: 30 }),
    supabase
      .from('registrations')
      .select('id, registered_at, contacts(name, email), webinars(title)')
      .order('registered_at', { ascending: false })
      .limit(10),
  ])

  const stat = statBrut as unknown as Statistici
  const maxim = Math.max(1, ...(zile ?? []).map((z) => Number(z.leads)))

  return (
    <>
      <Antet titlu="Panou" descriere="Cum stă lucrurile astăzi." />

      <div className="flex flex-col gap-6 px-5 py-6 md:px-8">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Cifra eticheta="Lead-uri azi" valoare={stat.leads_today} />
          <Cifra
            eticheta="Lead-uri, 7 zile"
            valoare={stat.leads_7d}
            anterior={stat.leads_prev_7d}
          />
          <Cifra
            eticheta="Lead-uri, 30 zile"
            valoare={stat.leads_30d}
            anterior={stat.leads_prev_30d}
          />
          <Cifra
            eticheta="Pe lista de așteptare"
            valoare={stat.waitlist_pending}
            nota="neanunțați"
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardContent className="pt-6">
              <p className="text-sm font-medium">Lead-uri pe zi, ultimele 30</p>
              <div className="mt-4 flex h-28 items-end gap-[3px]">
                {(zile ?? []).map((z) => (
                  <div
                    key={z.zi}
                    className="bg-primary/80 min-h-[2px] flex-1 rounded-t-sm"
                    style={{ height: `${(Number(z.leads) / maxim) * 100}%` }}
                    title={`${z.zi}: ${z.leads}`}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-sm font-medium">Următorul webinar</p>
              {stat.next_webinar ? (
                <div className="mt-3">
                  <Link
                    href={`/webinar/${stat.next_webinar.slug}`}
                    className="font-medium hover:underline"
                  >
                    {stat.next_webinar.title}
                  </Link>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {formateazaDataOra(stat.next_webinar.starts_at)}
                  </p>
                  <p className="mt-3 text-2xl font-semibold">
                    {stat.next_webinar.registrations_count}
                    <span className="text-muted-foreground ml-1.5 text-sm font-normal">
                      înscriși
                    </span>
                  </p>
                  {stat.next_webinar.seats_left !== null && (
                    <p className="text-muted-foreground text-sm">
                      {stat.next_webinar.seats_left} locuri rămase
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground mt-3 text-sm">
                  Nu e nimic programat. Pagina publică arată formularul de listă
                  de așteptare.
                </p>
              )}

              {stat.last_webinar && (
                <div className="mt-5 border-t pt-4">
                  <p className="text-muted-foreground text-xs">Ultimul încheiat</p>
                  <p className="mt-1 text-sm">{stat.last_webinar.title}</p>
                  <p className="mt-1 text-sm">
                    <strong>{stat.last_webinar.show_up_rate ?? '—'}%</strong> prezență
                    <span className="text-muted-foreground">
                      {' '}
                      ({stat.last_webinar.attended}/{stat.last_webinar.registered})
                    </span>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium">Ultimele înscrieri</p>
            {(ultimele ?? []).length === 0 ? (
              <p className="text-muted-foreground mt-3 text-sm">Încă nimic.</p>
            ) : (
              <ul className="mt-3 divide-y">
                {(ultimele ?? []).map((r) => (
                  <li key={r.id} className="flex flex-wrap items-baseline gap-x-3 py-2.5 text-sm">
                    <span className="font-medium">{r.contacts?.name}</span>
                    <span className="text-muted-foreground">{r.contacts?.email}</span>
                    <Badge variant="secondary" className="ml-auto">
                      {r.webinars?.title}
                    </Badge>
                    <span className="text-muted-foreground w-full text-xs md:w-auto">
                      {formateazaDataOra(r.registered_at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}

function Cifra({
  eticheta,
  valoare,
  anterior,
  nota,
}: {
  eticheta: string
  valoare: number
  anterior?: number
  nota?: string
}) {
  const variatie =
    anterior !== undefined && anterior > 0
      ? Math.round(((valoare - anterior) / anterior) * 100)
      : null

  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-muted-foreground text-sm">{eticheta}</p>
        <p className="mt-1 text-3xl font-semibold tabular-nums">{valoare}</p>
        {variatie !== null && (
          <p
            className={
              variatie >= 0 ? 'mt-1 text-sm text-emerald-600' : 'mt-1 text-sm text-amber-600'
            }
          >
            {variatie >= 0 ? '+' : ''}
            {variatie}% față de perioada anterioară
          </p>
        )}
        {nota && <p className="text-muted-foreground mt-1 text-sm">{nota}</p>}
      </CardContent>
    </Card>
  )
}
