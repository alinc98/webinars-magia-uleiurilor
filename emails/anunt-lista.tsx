import { Buton, Detalii, Paragraf, Sablon, Titlu } from './componente'
import type { ContextEmail } from './tipuri'
import { ETICHETA_FORMAT, formateazaDataOra } from '@/lib/format'

/**
 * Anunțul către lista de așteptare, la publicarea unui webinar nou.
 *
 * Aici se vede cel mai clar valoarea CRM-ului propriu — pe Facebook Events
 * lista asta nu există (brief §7.3).
 */
export function EmailAnuntLista({ name, webinar, siteUrl, unsubscribeUrl }: ContextEmail) {
  return (
    <Sablon preview={`S-a anunțat: ${webinar.title}`} unsubscribeUrl={unsubscribeUrl}>
      <Titlu>Am o dată nouă, {name}</Titlu>
      <Paragraf>
        Ai cerut să afli primul când se anunță următoarea întâlnire. Uite-o:
      </Paragraf>
      <Paragraf>
        <strong>{webinar.title}</strong>
      </Paragraf>

      <Detalii
        randuri={[
          ['Când', formateazaDataOra(webinar.startsAt)],
          ['Format', ETICHETA_FORMAT[webinar.format]!],
          ['Durată', `${webinar.durationMin} minute`],
        ]}
      />

      <Buton href={`${siteUrl}/webinar/${webinar.slug}`}>Vreau să particip</Buton>
    </Sablon>
  )
}
