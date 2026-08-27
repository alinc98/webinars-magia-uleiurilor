import Link from 'next/link'
import { Eye, EyeOff, Star, Video } from 'lucide-react'

import { Antet } from '@/components/admin/antet'
import { BadgeStatus } from '@/components/admin/badge-status'
import { Button } from '@/components/ui/button'
import { ETICHETA_FORMAT, formateazaDataOra } from '@/lib/format'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/lib/database.types'

import { ButonDuplica } from './buton-duplica'

export const dynamic = 'force-dynamic'

export default async function Page(props: PageProps<'/admin/webinarii'>) {
  const { status } = await props.searchParams
  const supabase = createAdminClient()

  let interogare = supabase
    .from('webinars_public')
    .select('*')
    .order('starts_at', { ascending: false })

  const STATUSURI = ['draft', 'published', 'live', 'ended', 'cancelled'] as const
  type Status = Database['public']['Enums']['webinar_status']

  if (typeof status === 'string' && (STATUSURI as readonly string[]).includes(status)) {
    interogare = interogare.eq('status', status as Status)
  }

  const { data: webinarii } = await interogare

  return (
    <>
      <Antet titlu="Webinarii" descriere="Tot ce e programat, în desfășurare sau încheiat.">
        <Button asChild>
          <Link href="/admin/webinarii/nou">Webinar nou</Link>
        </Button>
      </Antet>

      <div className="px-5 py-5 md:px-8">
        <nav className="mb-4 flex flex-wrap gap-1.5">
          {[
            ['toate', 'Toate'],
            ['draft', 'Ciorne'],
            ['published', 'Publicate'],
            ['ended', 'Încheiate'],
          ].map(([valoare, eticheta]) => (
            <Link
              key={valoare}
              href={valoare === 'toate' ? '/admin/webinarii' : `/admin/webinarii?status=${valoare}`}
              className={
                (status ?? 'toate') === valoare
                  // Un filtru nu e o acțiune primară, deci verde, nu teracotă.
                  ? 'bg-primary-800 rounded-md px-3 py-1.5 text-sm font-medium text-white'
                  : 'hover:bg-accent text-text-muted rounded-md px-3 py-1.5 text-sm'
              }
            >
              {eticheta}
            </Link>
          ))}
        </nav>

        {(webinarii ?? []).length === 0 ? (
          <div className="rounded-lg border border-dashed py-16 text-center">
            <p className="font-medium">Niciun webinar aici.</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Începe cu unul nou — durează sub cinci minute.
            </p>
            <Button asChild className="mt-4">
              <Link href="/admin/webinarii/nou">Webinar nou</Link>
            </Button>
          </div>
        ) : (
          <ul className="divide-y rounded-lg border">
            {(webinarii ?? []).map((w) => (
              <li key={w.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/admin/webinarii/${w.id}`}
                      className="font-medium hover:underline"
                    >
                      {w.title}
                    </Link>
                    <BadgeStatus status={w.status!} />
                    {w.is_featured && (
                      <Star className="size-4 fill-amber-400 text-amber-500" aria-label="Evidențiat" />
                    )}
                    {w.listed ? (
                      <Eye className="text-muted-foreground size-4" aria-label="Afișat în listă" />
                    ) : (
                      <EyeOff className="text-muted-foreground size-4" aria-label="Ascuns din listă" />
                    )}
                    {w.replay_public && (
                      <Video className="text-muted-foreground size-4" aria-label="Înregistrare publică" />
                    )}
                  </div>
                  <p className="text-muted-foreground mt-0.5 text-sm">
                    {formateazaDataOra(w.starts_at!)} · {ETICHETA_FORMAT[w.format!]}
                    {w.format !== 'online' && w.city ? ` · ${w.city}` : ''}
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-semibold tabular-nums">{w.registrations_count}</p>
                  <p className="text-muted-foreground text-xs">înscriși</p>
                </div>

                <ButonDuplica id={w.id!} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}
