import type { Metadata } from 'next'
import Link from 'next/link'

import { FormularListaAsteptare } from '@/components/public/formular-lista-asteptare'
import { ETICHETA_FORMAT, formateazaDataOra } from '@/lib/format'
import { getWebinariiHub, speakeri, type WebinarPublic } from '@/lib/webinars/queries'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Webinarii despre uleiuri esențiale',
  description:
    'Întâlniri online și la fața locului despre uleiuri esențiale, cu Andreea Gligor.',
}

export default async function Page() {
  const { evidentiat, restul, arhiva } = await getWebinariiHub()

  return (
    <main className="mx-auto w-full max-w-[760px] px-6 py-12">
      {/* TODO(M5): antet, intro, „despre Andreea" și footer vin din designul importat. */}
      <h1 className="font-heading text-4xl leading-tight">
        Întâlniri despre uleiuri esențiale
      </h1>
      <p className="text-muted-foreground mt-3 text-lg">
        Ritualuri simple pentru tine și casa ta, explicate pe înțelesul oricui.
        Fără experiență prealabilă.
      </p>

      {evidentiat ? (
        <section className="mt-12">
          <h2 className="text-muted-foreground text-sm tracking-wide uppercase">
            Următorul eveniment
          </h2>
          <CardWebinar webinar={evidentiat} evidentiat />
        </section>
      ) : (
        // Starea goală e cazul care contează: pagina va arăta așa între
        // evenimente (brief §11). Un formular, nu un mesaj de eroare.
        <section className="bg-muted/40 mt-12 rounded-2xl p-8">
          <h2 className="font-heading text-2xl">
            Află primul când se anunță următorul
          </h2>
          <p className="text-muted-foreground mt-2">
            Nu e nimic programat în momentul ăsta. Lasă-ți adresa și afli primul
            când se anunță următoarea întâlnire.
          </p>
          <div className="mt-6 max-w-sm">
            <FormularListaAsteptare />
          </div>
        </section>
      )}

      {restul.length > 0 && (
        <section className="mt-14">
          <h2 className="font-heading text-2xl">Următoarele evenimente</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {restul.map((w) => (
              <CardWebinar key={w.id} webinar={w} />
            ))}
          </div>
        </section>
      )}

      {arhiva.length > 0 && (
        <section className="mt-16">
          <h2 className="font-heading text-xl">Întâlniri trecute</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Înregistrarea se deblochează pe email.
          </p>
          <ul className="mt-4 flex flex-col gap-2">
            {arhiva.map((w) => (
              <li key={w.id} className="flex items-baseline justify-between gap-4">
                <span>{w.title}</span>
                <Link href={`/inregistrare/${w.slug}`} className="text-sm underline">
                  Vezi înregistrarea
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  )
}

function CardWebinar({
  webinar,
  evidentiat = false,
}: {
  webinar: WebinarPublic
  evidentiat?: boolean
}) {
  const format = webinar.format ?? 'online'
  const lista = speakeri(webinar)

  return (
    <article
      className={`border-border rounded-2xl border p-6 ${evidentiat ? 'mt-4' : ''}`}
    >
      <p className="text-muted-foreground text-sm">
        {formateazaDataOra(webinar.starts_at!)}
      </p>
      <h3 className={`font-heading mt-1 ${evidentiat ? 'text-2xl' : 'text-lg'}`}>
        <Link href={`/webinar/${webinar.slug}`} className="hover:underline">
          {webinar.title}
        </Link>
      </h3>
      {webinar.subtitle && (
        <p className="text-muted-foreground mt-2 text-sm">{webinar.subtitle}</p>
      )}

      <p className="text-muted-foreground mt-3 text-sm">
        {ETICHETA_FORMAT[format]}
        {format !== 'online' && webinar.city ? ` · ${webinar.city}` : ''}
        {webinar.seats_left !== null &&
          (webinar.is_full ? ' · locuri epuizate' : ` · ${webinar.seats_left} locuri`)}
      </p>

      {lista.length > 0 && (
        <p className="text-muted-foreground mt-2 text-sm">
          {lista.map((s) => s.name).join(', ')}
        </p>
      )}

      {/* Butonul de pe hub e secundar: teracota rămâne rezervată înscrierii de
          pe pagina individuală, altfel hub-ul ajunge cu opt CTA-uri de aceeași
          intensitate (brief §16). */}
      <Link
        href={`/webinar/${webinar.slug}`}
        className="bg-secondary text-secondary-foreground mt-5 inline-flex min-h-[44px] items-center rounded-xl px-5 text-sm font-medium"
      >
        Vreau să particip
      </Link>
    </article>
  )
}
