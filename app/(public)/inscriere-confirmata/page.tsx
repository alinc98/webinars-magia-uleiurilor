import type { Metadata } from 'next'
import Image from 'next/image'

import { Fisa, Titlu2 } from '@/components/brand/bucati'
import { ButonLink } from '@/components/brand/buton'
import { Ornament } from '@/components/brand/ornament'
import { ETICHETA_FORMAT, formateazaDataOra } from '@/lib/format'
import { linkGoogleCalendar } from '@/lib/ics'
import { getWebinarBySlug } from '@/lib/webinars/queries'

export const metadata: Metadata = {
  title: 'Te-ai înscris',
  robots: { index: false, follow: false },
}

export default async function Page(props: PageProps<'/inscriere-confirmata'>) {
  const { w } = await props.searchParams
  const slug = typeof w === 'string' ? w : undefined
  const webinar = slug ? await getWebinarBySlug(slug) : null

  const format = (webinar?.format ?? 'online') as 'online' | 'fizic' | 'hibrid'
  const locatie =
    format === 'online'
      ? (webinar?.join_url ?? undefined)
      : [webinar?.venue_name, webinar?.address, webinar?.city]
          .filter(Boolean)
          .join(', ') || undefined

  return (
    <div className="bg-brand-bg text-text-body font-body min-h-svh">
      <header className="mx-auto max-w-[var(--container-content)] px-5 py-5">
        <Image
          src="/logo.png"
          alt="Magia Uleiurilor Esențiale"
          width={1116}
          height={292}
          priority
          className="h-9 w-auto"
        />
      </header>

      <section className="relative overflow-hidden px-5 py-10 md:py-16">
        <Ornament
          nume="buchet"
          marime={230}
          opacitate={0.12}
          className="text-primary-800 top-4 -right-8"
        />

        <div className="relative mx-auto max-w-[var(--container-form)]">
          <span className="text-caption inline-flex items-center gap-2 rounded-full bg-[#e8f4ec] px-3 py-1 font-semibold text-[#1f7a46]">
            <span className="size-1.5 rounded-full bg-current" />
            Înscriere confirmată
          </span>

          <Titlu2 className="mt-4">Gata, te-ai înscris.</Titlu2>

          <p className="text-body text-text-muted mt-3">
            Ți-am trimis confirmarea pe email. Dacă nu ajunge în câteva minute,
            uită-te și în Promoții sau Spam — și marcheaz-o ca &bdquo;nu e
            spam&rdquo;, ca să primești și reamintirile.
          </p>

          {webinar?.starts_at && (
            <>
              <div className="mt-6">
                <Fisa
                  randuri={[
                    { eticheta: 'Întâlnirea', valoare: webinar.title },
                    {
                      eticheta: 'Când',
                      valoare: formateazaDataOra(webinar.starts_at),
                    },
                    { eticheta: 'Format', valoare: ETICHETA_FORMAT[format] },
                  ]}
                />
              </div>

              <div className="mt-6">
                <p className="text-caption text-text-muted font-semibold">
                  Adaugă în calendar
                </p>

                {/* `whitespace-nowrap` şi eticheta scurtă merg împreună: fără ele,
                    „Adaugă în Google Calendar" trecea pe două rânduri în jumătatea
                    lui de lăţime, iar al doilea rând rămânea lipit de stânga. */}
                <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                  <a
                    href={linkGoogleCalendar({
                      uid: `${webinar.id}@magia-uleiurilor.ro`,
                      title: webinar.title!,
                      startsAt: webinar.starts_at,
                      durationMin: webinar.duration_min ?? 60,
                      location: locatie,
                    })}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border-primary-800 text-primary-800 hover:bg-primary-50 min-h-touch inline-flex flex-1 items-center justify-center rounded-full border-[1.5px] px-6 text-center font-semibold whitespace-nowrap"
                  >
                    Google Calendar
                  </a>
                  <a
                    href={`/api/calendar/${webinar.slug}`}
                    className="border-brand-border text-text-muted hover:bg-surface min-h-touch inline-flex flex-1 items-center justify-center rounded-full border px-6 text-center font-medium whitespace-nowrap"
                  >
                    Alt calendar (.ics)
                  </a>
                </div>
              </div>
            </>
          )}

          {/* Titlul bonusului stă după două puncte, ca obiect, nu ca subiect al
              unei propoziţii pe care o scriem noi. Înainte ieşea „Cele trei
              flacoane … îl primeşti": acordul se rupea la orice bonus care nu
              era masculin singular. Aşa, textul scris în admin apare aşa cum a
              fost scris. */}
          {webinar?.bonus_title && (
            <div className="text-body-sm text-text-muted bg-surface-botanic rounded-brand-md mt-6 p-4">
              <p>
                <strong className="text-sage-800">
                  Primești dacă participi live:
                </strong>{' '}
                {webinar.bonus_title}
              </p>
              {webinar.bonus_description && (
                <p className="mt-1">{webinar.bonus_description}</p>
              )}
            </div>
          )}

          {/* Despărţit de linie: e pasul următor, nu o a treia variantă de
              adăugat în calendar. Conturat, nu terracotta — culoarea caldă
              rămâne pentru înscriere, ca să nu tragă atenţia de la calendar,
              care e ce reduce neprezentările. */}
          <div className="border-brand-border mt-10 border-t pt-8">
            <ButonLink
              href="/"
              varianta="secundar"
              latimeIntreaga
              className="sm:inline-flex sm:w-auto"
            >
              Vezi toate întâlnirile
            </ButonLink>
          </div>
        </div>
      </section>
    </div>
  )
}
