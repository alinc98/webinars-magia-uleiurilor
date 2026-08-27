import { Antet } from '@/components/admin/antet'
import { formateazaDataOra } from '@/lib/format'
import { createAdminClient } from '@/lib/supabase/admin'

import { FormularConsimtamant, FormularRetentie } from './formulare'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const supabase = createAdminClient()

  const [{ data: utilizatori }, { data: consimtamant }, { data: setari }, { data: istoric }] =
    await Promise.all([
      supabase.from('admin_users').select('*').order('created_at'),
      supabase.from('consent_texts').select('*').eq('is_current', true).maybeSingle(),
      supabase.from('settings').select('*').maybeSingle(),
      supabase
        .from('consent_texts')
        .select('version, created_at, is_current')
        .order('created_at', { ascending: false }),
    ])

  const configurat = (nume: string) => (process.env[nume] ? 'configurat' : 'lipsește')

  return (
    <>
      <Antet titlu="Setări" />

      <div className="flex max-w-2xl flex-col gap-6 px-5 py-6 md:px-8">
        <section className="rounded-lg border p-4">
          <h2 className="font-medium">Utilizatori cu acces</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Doar aceste adrese pot primi link de autentificare.
          </p>
          <ul className="mt-3 divide-y">
            {(utilizatori ?? []).map((u) => (
              <li key={u.id} className="flex flex-wrap items-center gap-x-3 py-2 text-sm">
                <span className="font-medium">{u.name ?? u.email}</span>
                <span className="text-muted-foreground break-all">{u.email}</span>
                <span className="text-muted-foreground ml-auto text-xs">
                  {u.role === 'owner' ? 'proprietar' : 'editor'}
                  {u.last_login_at ? ` · ultima intrare ${formateazaDataOra(u.last_login_at)}` : ''}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-lg border p-4">
          <h2 className="font-medium">Integrări</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Cheile se setează în variabilele de mediu, nu aici — nu ajung
            niciodată în bază sau în browser.
          </p>
          <dl className="mt-3 flex flex-col gap-1.5 text-sm">
            {[
              ['Email (Resend)', 'RESEND_API_KEY'],
              ['Webhook Resend', 'RESEND_WEBHOOK_SECRET'],
              ['Meta Pixel', 'META_PIXEL_ID'],
              ['Meta Conversions API', 'META_CAPI_TOKEN'],
              ['Secret cron', 'CRON_SECRET'],
            ].map(([eticheta, nume]) => (
              <div key={nume} className="flex items-center justify-between gap-4">
                <dt>{eticheta}</dt>
                <dd
                  className={
                    process.env[nume] ? 'text-sm text-emerald-700' : 'text-muted-foreground text-sm'
                  }
                >
                  {configurat(nume)}
                </dd>
              </div>
            ))}
          </dl>
          {!process.env.RESEND_API_KEY && (
            <p className="text-muted-foreground mt-3 text-sm">
              Fără cheie Resend, emailurile pleacă spre serverul local de test,
              nu spre destinatari reali.
            </p>
          )}
        </section>

        <section className="rounded-lg border p-4">
          <h2 className="font-medium">Textul de consimțământ</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Apare sub căsuța de bifat din formulare și în politica de
            confidențialitate.
          </p>
          <div className="mt-4">
            {consimtamant ? (
              <FormularConsimtamant
                versiuneCurenta={consimtamant.version}
                textCurent={consimtamant.body}
              />
            ) : (
              <p className="text-destructive text-sm">
                Nu există niciun text activ. Formularele publice afișează un
                text de rezervă.
              </p>
            )}
          </div>

          {(istoric ?? []).length > 1 && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm">Versiuni anterioare</summary>
              <ul className="text-muted-foreground mt-2 flex flex-col gap-1 text-sm">
                {(istoric ?? [])
                  .filter((v) => !v.is_current)
                  .map((v) => (
                    <li key={v.version}>
                      {v.version} · {formateazaDataOra(v.created_at)}
                    </li>
                  ))}
              </ul>
            </details>
          )}
        </section>

        <section className="rounded-lg border p-4">
          <h2 className="font-medium">Retenția datelor</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Contactele fără nicio activitate atâtea luni se anonimizează automat,
            o dată pe lună. Înscrierile rămân, ca numărul de participanți la
            evenimentele trecute să fie în continuare corect.
          </p>
          <div className="mt-4">
            <FormularRetentie luni={setari?.retentie_luni ?? 24} />
          </div>
        </section>
      </div>
    </>
  )
}
