import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

import { Card, Insigna, Supratitlu, Titlu1, Titlu2, Titlu3 } from '@/components/brand/bucati'
import { ButonLink } from '@/components/brand/buton'
import { Ornament } from '@/components/brand/ornament'
import { FormularListaAsteptare } from '@/components/public/formular-lista-asteptare'
import { ETICHETA_FORMAT, formateazaData, formateazaDataOra } from '@/lib/format'
import { LINKURI } from '@/lib/linkuri'
import { getWebinariiHub, speakeri, type WebinarPublic } from '@/lib/webinars/queries'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Întâlniri despre uleiuri esențiale',
  description:
    'Webinarii și ateliere despre uleiuri esențiale, cu Andreea Gligor — aromaterapeut cu 8 ani de practică.',
}

export default async function Page() {
  const { evidentiat, restul, arhiva } = await getWebinariiHub()

  return (
    <div className="bg-brand-bg text-text-body font-body">
      {/* Antet minimal: logo și un singur link discret. Fără meniu (brief §11). */}
      <header className="mx-auto flex max-w-[var(--container-content)] items-center justify-between gap-4 px-5 py-5">
        <Image
          src="/logo.png"
          alt="Magia Uleiurilor Esențiale"
          width={1116}
          height={292}
          priority
          className="h-9 w-auto"
        />
        <a
          href={LINKURI.sitePrincipal}
          className="text-caption text-text-muted hover:text-primary-800 underline"
        >
          magia-uleiurilor.ro
        </a>
      </header>

      <section className="bg-surface relative overflow-hidden px-5 py-10 md:py-14">
        <Ornament nume="colt-ornament" marime={220} className="text-primary-800 -bottom-8 -left-8" />
        <div className="relative mx-auto max-w-[var(--container-content)]">
          <Titlu1>Întâlniri despre uleiuri esențiale</Titlu1>
          <p className="text-body-lg text-text-muted mt-4 max-w-[52ch]">
            Ritualuri simple pentru tine și casa ta, explicate pe înțelesul
            oricui. Fără termeni complicați și fără să presupunem că știi ceva
            dinainte.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-[var(--container-content)] px-5">
        {evidentiat ? (
          <section className="py-10 md:py-14">
            <Supratitlu>Următoarea întâlnire</Supratitlu>
            <div className="mt-4">
              <CardEvidentiat webinar={evidentiat} />
            </div>
          </section>
        ) : (
          /* Starea goală e cazul care contează: pagina arată așa între
             evenimente (brief §11). Un formular, nu un mesaj de eroare. */
          <section className="py-10 md:py-14">
            <div className="bg-surface-botanic border-sage-200 rounded-brand-xl relative overflow-hidden border p-6 md:p-10">
              <Ornament
                nume="buchet"
                marime={200}
                opacitate={0.14}
                className="text-primary-800 -right-4 -bottom-6"
              />
              <div className="relative max-w-[var(--container-form)]">
                <Titlu2>Află primul când se anunță următoarea</Titlu2>
                <p className="text-body text-text-muted mt-3">
                  Nu e nimic programat în momentul ăsta. Lasă-ți adresa și îți
                  scriem înainte să se umple locurile.
                </p>
                <div className="mt-6">
                  <FormularListaAsteptare eticheta="Anunță-mă" />
                </div>
              </div>
            </div>
          </section>
        )}

        {restul.length > 0 && (
          <section className="pb-10 md:pb-14">
            <Titlu2>Ce urmează</Titlu2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {restul.map((w) => (
                <CardGrila key={w.id} webinar={w} />
              ))}
            </div>
          </section>
        )}

        {arhiva.length > 0 && (
          <section className="border-brand-border border-t py-10 md:py-14">
            <Titlu3>Întâlniri trecute</Titlu3>
            <p className="text-body-sm text-text-muted mt-1">
              Înregistrarea se deblochează pe email.
            </p>
            <ul className="divide-brand-border mt-4 divide-y">
              {arhiva.map((w) => (
                <li key={w.id} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 py-3">
                  <span className="text-body">{w.title}</span>
                  <span className="text-caption text-text-muted">
                    {formateazaData(w.starts_at!)}
                  </span>
                  <Link
                    href={`/inregistrare/${w.slug}`}
                    className="text-body-sm text-primary-800 ml-auto underline"
                  >
                    Vezi înregistrarea
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  )
}

function Meta({ webinar }: { webinar: WebinarPublic }) {
  const format = webinar.format ?? 'online'
  return (
    <div className="flex flex-wrap gap-2">
      <Insigna>{formateazaDataOra(webinar.starts_at!)}</Insigna>
      <Insigna ton="sage">
        {ETICHETA_FORMAT[format]}
        {format !== 'online' && webinar.city ? ` · ${webinar.city}` : ''}
      </Insigna>
      {webinar.seats_left !== null && (
        <Insigna ton={webinar.is_full ? 'neutru' : 'gold'}>
          {webinar.is_full ? 'locuri epuizate' : `${webinar.seats_left} locuri`}
        </Insigna>
      )}
    </div>
  )
}

function Speakeri({ webinar }: { webinar: WebinarPublic }) {
  const lista = speakeri(webinar)
  if (lista.length === 0) return null

  return (
    <div className="mt-4 flex items-center gap-3">
      <div className="flex -space-x-2">
        {lista.map((s) =>
          s.photo_url ? (
            <Image
              key={s.id}
              src={s.photo_url}
              alt={s.name}
              width={64}
              height={64}
              className="border-surface-raised size-8 rounded-full border-2 object-cover"
            />
          ) : (
            <span
              key={s.id}
              className="bg-sage-100 text-sage-800 border-surface-raised text-caption flex size-8 items-center justify-center rounded-full border-2 font-semibold"
            >
              {s.name
                .split(' ')
                .slice(0, 2)
                .map((p) => p[0])
                .join('')}
            </span>
          )
        )}
      </div>
      <span className="text-caption text-text-muted">
        {lista.map((s) => s.name).join(', ')}
      </span>
    </div>
  )
}

function CardEvidentiat({ webinar }: { webinar: WebinarPublic }) {
  return (
    <article className="bg-surface-raised border-brand-border shadow-brand-2 rounded-brand-xl relative overflow-hidden border p-6 md:p-8">
      <Ornament nume="ramura" marime={170} className="text-primary-800 -top-6 right-2" />
      <div className="relative">
        <Meta webinar={webinar} />
        <h3 className="font-display text-h2 text-text-heading mt-4 font-semibold text-balance">
          {webinar.title}
        </h3>
        {webinar.subtitle && (
          <p className="text-body text-text-muted mt-3 max-w-[52ch]">{webinar.subtitle}</p>
        )}
        <Speakeri webinar={webinar} />
        {/* Teracota rămâne rezervată paginii individuale: altfel hub-ul ajunge
            cu opt CTA-uri de aceeași intensitate (brief §16). */}
        <ButonLink
          href={`/webinar/${webinar.slug}`}
          varianta="secundar"
          marime="lg"
          className="mt-6"
        >
          Vreau să particip
        </ButonLink>
      </div>
    </article>
  )
}

function CardGrila({ webinar }: { webinar: WebinarPublic }) {
  return (
    <Card className="hover:shadow-brand-2 transition-shadow">
      <Meta webinar={webinar} />
      <h3 className="font-display text-h4 text-text-heading mt-3 font-semibold">
        <Link href={`/webinar/${webinar.slug}`} className="after:absolute after:inset-0">
          {webinar.title}
        </Link>
      </h3>
      {webinar.subtitle && (
        <p className="text-body-sm text-text-muted mt-2">{webinar.subtitle}</p>
      )}
      <Speakeri webinar={webinar} />
    </Card>
  )
}
