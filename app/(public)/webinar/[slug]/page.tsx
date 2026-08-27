import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { FormularInscriere } from '@/components/public/formular-inscriere'
import { ETICHETA_FORMAT, formateazaDataOra } from '@/lib/format'
import { getSlugsPublicate, getWebinarBySlug, speakeri } from '@/lib/webinars/queries'

// ISR: pagina se regenerează la publicarea din admin, prin updateTag (M4).
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
    // Webinariile nelistate sunt promovate exclusiv prin reclame (brief §11).
    robots: webinar.listed ? undefined : { index: false, follow: false },
  }
}

export default async function Page(props: PageProps<'/webinar/[slug]'>) {
  const { slug } = await props.params
  const webinar = await getWebinarBySlug(slug)

  if (!webinar || !['published', 'live'].includes(webinar.status ?? '')) {
    notFound()
  }

  const lista = speakeri(webinar)
  const invitati = lista.filter((s) => s.role_label === 'invitat')
  const format = (webinar.format ?? 'online') as 'online' | 'fizic' | 'hibrid'

  return (
    <main className="mx-auto w-full max-w-[760px] px-6 py-12">
      {/* TODO(M5): structura reală vine din designul importat — hero, „pentru
          cine e", „ce vei învăța", speakeri, testimoniale, bonus, FAQ.
          Aici e doar cât trebuie ca fluxul de înscriere să fie testabil. */}

      <header className="flex flex-col gap-4">
        <p className="text-muted-foreground text-sm">
          Webinar gratuit · {formateazaDataOra(webinar.starts_at!)}
        </p>
        <h1 className="font-heading text-4xl leading-tight">{webinar.title}</h1>
        {webinar.subtitle && <p className="text-lg">{webinar.subtitle}</p>}

        <ul className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <li>{formateazaDataOra(webinar.starts_at!)}</li>
          <li>
            {ETICHETA_FORMAT[format]}
            {format !== 'online' && webinar.city ? ` · ${webinar.city}` : ''}
          </li>
          <li>{webinar.duration_min} min</li>
          <li>Gratuit</li>
        </ul>

        {invitati.length > 0 && (
          <p className="text-sm">
            {invitati.length === 1 ? 'Cu invitat special: ' : 'Cu invitați speciali: '}
            {invitati.map((s) => s.name).join(' și ')}
          </p>
        )}
      </header>

      {webinar.description && (
        <section className="mt-10">
          <p className="whitespace-pre-line">{webinar.description}</p>
        </section>
      )}

      {lista.length > 0 && (
        <section className="mt-10">
          <h2 className="font-heading text-2xl">Cine susține webinarul</h2>
          <ul className="mt-4 flex flex-col gap-4">
            {lista.map((s) => (
              <li key={s.id}>
                <p className="font-medium">
                  {s.name}
                  {s.role_label === 'gazda' && (
                    <span className="text-muted-foreground text-sm"> · gazdă</span>
                  )}
                </p>
                {s.role_title && (
                  <p className="text-muted-foreground text-sm">{s.role_title}</p>
                )}
                {s.bio_short && <p className="mt-1 text-sm">{s.bio_short}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section id="inscriere" className="mt-12 scroll-mt-8">
        <h2 className="font-heading text-2xl">Înscrie-te</h2>

        {webinar.seats_left !== null && (
          <p className="text-muted-foreground mt-2 text-sm">
            {webinar.is_full
              ? 'Nu mai sunt locuri libere.'
              : `Locuri rămase: ${webinar.seats_left}`}
          </p>
        )}

        <div className="mt-6">
          {webinar.is_full ? (
            // TODO(M5): formular „Anunță-mă dacă se eliberează un loc",
            // POST /api/lista-asteptare cu webinar_slug.
            <p className="text-muted-foreground text-sm">
              Evenimentul e plin. Lista de așteptare se adaugă odată cu designul final.
            </p>
          ) : (
            <FormularInscriere slug={slug} format={format} />
          )}
        </div>
      </section>

      <footer className="text-muted-foreground mt-16 text-sm">
        {/* Singura concesie de navigație pe pagina de webinar (brief §11). */}
        <Link href="/" className="underline">
          Vezi toate webinariile
        </Link>
      </footer>
    </main>
  )
}
