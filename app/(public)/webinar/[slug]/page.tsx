import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Accordion } from '@/components/brand/accordion'
import { BaraSticky } from '@/components/brand/bara-sticky'
import { Card, Fisa, Insigna, Supratitlu, Titlu1, Titlu2, Titlu3 } from '@/components/brand/bucati'
import { Ornament } from '@/components/brand/ornament'
import { FormularInscriere } from '@/components/public/formular-inscriere'
import { FormularListaAsteptare } from '@/components/public/formular-lista-asteptare'
import { MetaPixel } from '@/components/public/meta-pixel'
import { getTextConsimtamant } from '@/lib/consimtamant-server'
import { ETICHETA_FORMAT, formateazaDataOra, numesteEvenimentul } from '@/lib/format'
import { getSlugsPublicate, getWebinarBySlug, speakeri } from '@/lib/webinars/queries'

export const revalidate = 300

export async function generateStaticParams() {
  const slugs = await getSlugsPublicate()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata(
  props: PageProps<'/webinar/[slug]'>
): Promise<Metadata> {
  const { slug } = await props.params
  const webinar = await getWebinarBySlug(slug)
  if (!webinar) return {}

  return {
    title: webinar.seo_title ?? webinar.title ?? undefined,
    description: webinar.seo_description ?? webinar.subtitle ?? undefined,
    robots: webinar.listed ? undefined : { index: false, follow: false },
  }
}

export default async function Page(props: PageProps<'/webinar/[slug]'>) {
  const { slug } = await props.params
  const [webinar, textConsimtamant] = await Promise.all([
    getWebinarBySlug(slug),
    getTextConsimtamant(),
  ])

  if (!webinar || !['published', 'live'].includes(webinar.status ?? '')) {
    notFound()
  }

  const lista = speakeri(webinar)
  const gazda = lista.find((s) => s.role_label === 'gazda') ?? lista[0]
  const invitati = lista.filter((s) => s.role_label === 'invitat')
  const format = (webinar.format ?? 'online') as 'online' | 'fizic' | 'hibrid'
  const online = format !== 'fizic'
  const laFataLocului = format !== 'online'

  const puncte = (webinar.learning_points as string[] | null) ?? []
  const pentruCine = (webinar.for_whom as string[] | null) ?? []
  const faq = (webinar.faq as { q: string; a: string }[] | null) ?? []

  const detalii: { eticheta: string; valoare: React.ReactNode }[] = [
    { eticheta: 'Data', valoare: formateazaDataOra(webinar.starts_at!) },
    { eticheta: 'Durata', valoare: `${webinar.duration_min} de minute` },
    { eticheta: 'Format', valoare: ETICHETA_FORMAT[format] },
    { eticheta: 'Cost', valoare: 'Gratuit' },
  ]
  if (laFataLocului && webinar.venue_name) {
    detalii.push({ eticheta: 'Unde', valoare: webinar.venue_name })
  }
  if (laFataLocului && webinar.address) {
    detalii.push({
      eticheta: 'Adresa',
      valoare: [webinar.address, webinar.city].filter(Boolean).join(', '),
    })
  }
  if (webinar.seats_left !== null && !webinar.is_full) {
    detalii.push({ eticheta: 'Locuri rămase', valoare: webinar.seats_left })
  }

  return (
    <div className="bg-brand-bg text-text-body font-body">
      <MetaPixel pixelId={webinar.meta_pixel_id ?? process.env.NEXT_PUBLIC_META_PIXEL_ID} />
      <BaraSticky startsAt={webinar.starts_at!} format={format} />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="bg-surface relative overflow-hidden px-5 pt-8 pb-12">
        <Ornament
          nume="colt-ornament"
          marime={230}
          className="text-primary-800 -bottom-8 -left-8"
        />
        <Ornament nume="scanteie" marime={26} opacitate={1} className="text-gold-300 top-6 right-6" />

        <div className="relative mx-auto max-w-[var(--container-content)]">
          <Image
            src="/logo.png"
            alt="Magia Uleiurilor Esențiale"
            width={1116}
            height={292}
            priority
            className="mb-6 h-9 w-auto"
          />

          <Supratitlu>
            {numesteEvenimentul(format)} gratuit
            {webinar.capacity ? ' · locuri limitate' : ''}
          </Supratitlu>

          <Titlu1 className="mt-3">{webinar.title}</Titlu1>

          {webinar.subtitle && (
            <p className="text-body-lg text-text-muted mt-4 max-w-[46ch]">{webinar.subtitle}</p>
          )}

          {invitati.length > 0 && (
            <p className="text-body-sm text-sage-700 mt-3 font-medium">
              {invitati.length === 1 ? 'Cu invitat special: ' : 'Cu invitați speciali: '}
              {invitati.map((s) => s.name).join(' și ')}
            </p>
          )}

          <div className="mt-6 flex flex-wrap gap-2">
            <Insigna>{formateazaDataOra(webinar.starts_at!)}</Insigna>
            <Insigna>
              {online && !laFataLocului
                ? 'Online'
                : laFataLocului && webinar.city
                  ? webinar.city
                  : ETICHETA_FORMAT[format]}
            </Insigna>
            <Insigna ton="sage">{webinar.duration_min} de minute</Insigna>
            <Insigna ton="gold">Gratuit</Insigna>
          </div>

          <div className="mt-7 max-w-[var(--container-form)]">
            <a
              href="#inscriere"
              className="bg-cta hover:bg-cta-hover active:bg-cta-active min-h-touch-cta focus-visible:outline-primary-700 flex w-full items-center justify-center rounded-full px-8 font-semibold text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              Vreau să particip
            </a>
            <p className="text-caption text-text-muted mt-3">
              {online
                ? 'Îți trimitem linkul de acces pe email, imediat după înscriere.'
                : 'Îți trimitem adresa și detaliile practice pe email, imediat după înscriere.'}
            </p>
          </div>
        </div>
      </section>

      {/* ── Pentru cine e ─────────────────────────────────────────────────── */}
      {pentruCine.length > 0 && (
        <section className="mx-auto max-w-[var(--container-content)] px-5 py-12 md:py-16">
          <Titlu2>Pentru cine este</Titlu2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {pentruCine.map((punct) => (
              <Card key={punct}>{punct}</Card>
            ))}
          </div>
        </section>
      )}

      {/* ── Ce vei învăța ─────────────────────────────────────────────────── */}
      {puncte.length > 0 && (
        <section className="bg-surface relative overflow-hidden px-5 py-12 md:py-16">
          <Ornament nume="ramura" marime={200} className="text-primary-800 -top-10 -right-6" />
          <div className="relative mx-auto max-w-[var(--container-content)]">
            <Titlu2>Ce vei învăța</Titlu2>
            <ol className="mt-6 flex flex-col gap-4">
              {puncte.map((punct, i) => (
                <li key={punct} className="flex gap-4">
                  <span className="bg-primary-800 text-text-on-dark text-body-sm flex size-8 shrink-0 items-center justify-center rounded-full font-semibold">
                    {i + 1}
                  </span>
                  <p className="text-body pt-1">{punct}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {/* ── Cine susține ──────────────────────────────────────────────────── */}
      {lista.length > 0 && (
        <section className="mx-auto max-w-[var(--container-content)] px-5 py-12 md:py-16">
          <Titlu2>Cine susține {online ? 'webinarul' : 'evenimentul'}</Titlu2>

          {/* Cu un singur om, un card mic e rece și pierde ocazia de a construi
              încredere — iar încrederea în persoană e principalul motiv pentru
              care cineva se înscrie (brief §12.5). */}
          {lista.length === 1 && gazda ? (
            <div className="mt-6 grid gap-6 md:grid-cols-[minmax(0,220px)_minmax(0,1fr)] md:items-start">
              {gazda.photo_url ? (
                <Image
                  src={gazda.photo_url}
                  alt={gazda.name}
                  width={440}
                  height={440}
                  className="rounded-brand-lg w-full object-cover"
                />
              ) : (
                <div className="bg-surface-botanic rounded-brand-lg relative flex aspect-square items-center justify-center overflow-hidden">
                  <Ornament
                    nume="buchet"
                    marime={140}
                    opacitate={0.25}
                    className="text-primary-800 static"
                  />
                </div>
              )}
              <div>
                <Titlu3>{gazda.name}</Titlu3>
                {gazda.role_title && (
                  <p className="text-body-sm text-sage-700 mt-1 font-medium">{gazda.role_title}</p>
                )}
                {gazda.bio_short && (
                  <p className="text-body text-text-muted mt-4">{gazda.bio_short}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {lista.map((s) => (
                <Card key={s.id}>
                  <div className="flex items-center gap-3">
                    {s.photo_url ? (
                      <Image
                        src={s.photo_url}
                        alt={s.name}
                        width={96}
                        height={96}
                        className="size-14 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <span className="bg-sage-100 text-sage-800 flex size-14 shrink-0 items-center justify-center rounded-full font-semibold">
                        {s.name
                          .split(' ')
                          .slice(0, 2)
                          .map((p) => p[0])
                          .join('')}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="text-text-heading font-semibold">{s.name}</p>
                      {s.role_title && (
                        <p className="text-caption text-text-muted">{s.role_title}</p>
                      )}
                    </div>
                  </div>
                  {s.role_label === 'gazda' && (
                    <p className="text-overline text-sage-700 mt-3 font-semibold tracking-[0.14em] uppercase">
                      Gazdă
                    </p>
                  )}
                  {s.bio_short && <p className="mt-2">{s.bio_short}</p>}
                </Card>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── Bonus ─────────────────────────────────────────────────────────── */}
      {webinar.bonus_title && (
        <section className="mx-auto max-w-[var(--container-content)] px-5 pb-12 md:pb-16">
          <div className="mt-3">
            <Card evidentiat panglica="Bonus" titlu={webinar.bonus_title}>
              {webinar.bonus_description}
            </Card>
          </div>
        </section>
      )}

      {/* ── Detalii practice ──────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[var(--container-content)] px-5 pb-12 md:pb-16">
        <Titlu2>Detalii practice</Titlu2>
        <div className="mt-6 grid gap-4 md:grid-cols-2 md:items-start">
          <Fisa randuri={detalii} />

          {laFataLocului && (webinar.venue_notes || webinar.map_url) && (
            <div className="flex flex-col gap-4">
              {webinar.venue_notes && (
                <Card titlu="Bine de știut">{webinar.venue_notes}</Card>
              )}
              {webinar.map_url && (
                <a
                  href={webinar.map_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border-primary-800 text-primary-800 hover:bg-primary-50 min-h-touch inline-flex items-center justify-center rounded-full border-[1.5px] px-6 font-semibold"
                >
                  Deschide în Google Maps
                </a>
              )}
            </div>
          )}

          {online && !laFataLocului && (
            <Card titlu="Cum intri">
              Primești linkul pe email imediat după înscriere și încă o dată cu
              o oră înainte de start. Nu ai nevoie de cont, doar de un browser.
            </Card>
          )}
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────────── */}
      {faq.length > 0 && (
        <section className="bg-surface px-5 py-12 md:py-16">
          <div className="mx-auto max-w-[var(--container-prose)]">
            <Titlu2>Întrebări frecvente</Titlu2>
            <div className="mt-6">
              <Accordion intrebari={faq} />
            </div>
          </div>
        </section>
      )}

      {/* ── Formular ──────────────────────────────────────────────────────── */}
      <section id="inscriere" className="relative scroll-mt-16 overflow-hidden px-5 py-12 md:py-16">
        <Ornament nume="buchet" marime={220} opacitate={0.12} className="text-primary-800 -right-6 -bottom-6" />

        <div className="bg-surface-raised border-brand-border shadow-brand-1 rounded-brand-lg relative mx-auto max-w-[var(--container-form)] border p-6 md:p-8">
          <Titlu3>{webinar.is_full ? 'Locurile s-au epuizat' : 'Îmi rezerv locul'}</Titlu3>

          {webinar.is_full ? (
            <>
              <p className="text-body-sm text-text-muted mt-2">
                Toate locurile sunt ocupate. Lasă-ți adresa și te anunțăm primul
                dacă se eliberează unul.
              </p>
              <div className="mt-6">
                <FormularListaAsteptare
                  webinarSlug={slug}
                  eticheta="Anunță-mă dacă se eliberează un loc"
                />
              </div>
            </>
          ) : (
            <>
              <p className="text-body-sm text-text-muted mt-2">
                Două câmpuri obligatorii. Restul e opțional.
                {webinar.seats_left !== null && ` Au mai rămas ${webinar.seats_left} locuri.`}
              </p>
              <div className="mt-6">
                <FormularInscriere
                  slug={slug}
                  format={format}
                  textConsimtamant={textConsimtamant?.body}
                />
              </div>
            </>
          )}
        </div>
      </section>

      {/* Singura concesie de navigație pe pagina de webinar (brief §11). */}
      <div className="px-5 pb-4 text-center">
        <Link
          href="/"
          className="text-caption text-text-muted min-h-touch inline-flex items-center px-4 underline"
        >
          Vezi toate întâlnirile
        </Link>
      </div>
    </div>
  )
}
