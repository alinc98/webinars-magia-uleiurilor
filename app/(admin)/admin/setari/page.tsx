import { Antet } from '@/components/admin/antet'
import { formateazaDataOra } from '@/lib/format'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminUser } from '@/lib/supabase/auth'

import {
  FormularConsimtamant,
  FormularRetentie,
  GestiuneAdmini,
} from './formulare'

export const dynamic = 'force-dynamic'

/**
 * A trecut mai puţin de `prag` minute de la momentul dat?
 *
 * Citirea ceasului stă aici, nu în component: `Date.now()` în corpul unei
 * componente face randarea neidempotentă, iar React o semnalează pe bună
 * dreptate. Componentul primeşte verdictul, nu ora.
 */
function prospat(cand: string | null | undefined, pragMinute: number): boolean {
  if (!cand) return false
  return Date.now() - new Date(cand).getTime() <= pragMinute * 60_000
}

export default async function Page() {
  const eu = await getAdminUser()
  const supabase = createAdminClient()

  const [
    { data: utilizatori },
    { data: consimtamant },
    { data: setari },
    { data: istoric },
  ] = await Promise.all([
    supabase.from('admin_users').select('*').order('created_at'),
    supabase
      .from('consent_texts')
      .select('*')
      .eq('is_current', true)
      .maybeSingle(),
    supabase.from('settings').select('*').maybeSingle(),
    supabase
      .from('consent_texts')
      .select('version, created_at, is_current')
      .order('created_at', { ascending: false }),
  ])

  const configurat = (nume: string) =>
    process.env[nume] ? 'configurat' : 'lipsește'

  return (
    <>
      <Antet titlu="Setări" />

      <div className="flex max-w-2xl flex-col gap-6 px-5 py-6 md:px-8">
        <section className="rounded-lg border p-4">
          <h2 className="font-medium">Cine are acces</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Doar aceste adrese pot primi link de autentificare. Proprietarii pot
            adăuga și scoate oameni; editorii fac restul.
          </p>
          <div className="mt-4">
            <GestiuneAdmini
              administratori={(utilizatori ?? []).map((u) => ({
                id: u.id,
                email: u.email,
                name: u.name,
                role: u.role,
                last_login_at: u.last_login_at,
              }))}
              suntEu={eu?.id ?? ''}
              potGestiona={eu?.role === 'owner'}
            />
          </div>
        </section>

        <StareSistem
          cronUltimaRulare={setari?.cron_ultima_rulare ?? null}
          cronBate={prospat(setari?.cron_ultima_rulare, 30)}
          verificareUltimaRulare={setari?.verificare_ultima_rulare ?? null}
          verificareRecenta={prospat(setari?.verificare_ultima_rulare, 36 * 60)}
          verificareProbleme={
            (setari?.verificare_probleme as string[] | null) ?? []
          }
        />

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
              ['Google Analytics', 'NEXT_PUBLIC_GA4_ID'],
              ['GA4 Measurement Protocol', 'GA4_API_SECRET'],
              ['Secret cron', 'CRON_SECRET'],
            ].map(([eticheta, nume]) => (
              <div
                key={nume}
                className="flex items-center justify-between gap-4"
              >
                <dt>{eticheta}</dt>
                <dd
                  className={
                    process.env[nume]
                      ? 'text-sm text-emerald-700'
                      : 'text-muted-foreground text-sm'
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
              <summary className="cursor-pointer text-sm">
                Versiuni anterioare
              </summary>
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
            Contactele fără nicio activitate atâtea luni se anonimizează
            automat, o dată pe lună. Înscrierile rămân, ca numărul de
            participanți la evenimentele trecute să fie în continuare corect.
          </p>
          <div className="mt-4">
            <FormularRetentie luni={setari?.retentie_luni ?? 24} />
          </div>
        </section>
      </div>
    </>
  )
}

/**
 * Starea supravegherii, văzută din panou.
 *
 * Verificarea automată trimite email doar când găseşte ceva. E corect, dar
 * lasă o gaură: tăcerea unei alarme arată identic cu tăcerea unei alarme
 * stricate. Blocul ăsta e confirmarea pozitivă — se vede când a bătut ultima
 * dată cron-ul şi când a verificat, fără să trebuiască să vină vreun mesaj.
 */
function StareSistem({
  cronUltimaRulare,
  cronBate,
  verificareUltimaRulare,
  verificareRecenta,
  verificareProbleme,
}: {
  cronUltimaRulare: string | null
  cronBate: boolean
  verificareUltimaRulare: string | null
  verificareRecenta: boolean
  verificareProbleme: string[]
}) {
  return (
    <section className="rounded-lg border p-4">
      <h2 className="font-medium">Stare sistem</h2>
      <p className="text-muted-foreground mt-1 text-sm">
        Reamintirile pleacă dintr-o programare care rulează din 5 în 5 minute.
        Aici se vede dacă mai merge, fără să aștepți un email care să te anunțe
        că nu.
      </p>

      <dl className="mt-3 flex flex-col gap-2 text-sm">
        <div className="flex items-baseline justify-between gap-4">
          <dt>Ultima rulare a reamintirilor</dt>
          <dd className={cronBate ? 'text-emerald-700' : 'text-destructive'}>
            {cronUltimaRulare
              ? `${formateazaDataOra(cronUltimaRulare)}${cronBate ? '' : ' — s-a oprit'}`
              : 'niciodată'}
          </dd>
        </div>

        <div className="flex items-baseline justify-between gap-4">
          <dt>Ultima verificare</dt>
          <dd
            className={
              verificareRecenta ? 'text-emerald-700' : 'text-destructive'
            }
          >
            {verificareUltimaRulare
              ? `${formateazaDataOra(verificareUltimaRulare)}${verificareRecenta ? '' : ' — întârziată'}`
              : 'niciodată'}
          </dd>
        </div>
      </dl>

      {verificareProbleme.length > 0 ? (
        <div className="border-destructive/30 bg-destructive/5 mt-3 rounded-md border p-3">
          <p className="text-sm font-medium">Ultima verificare a găsit:</p>
          <ul className="mt-1.5 flex flex-col gap-1 text-sm">
            {verificareProbleme.map((p) => (
              <li key={p}>• {p}</li>
            ))}
          </ul>
        </div>
      ) : (
        verificareUltimaRulare && (
          <p className="text-muted-foreground mt-3 text-sm">
            Ultima verificare n-a găsit nimic de semnalat.
          </p>
        )
      )}
    </section>
  )
}
