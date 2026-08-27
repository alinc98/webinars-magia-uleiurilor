import { Buton, Detalii, Discret, Paragraf, Sablon, Titlu } from './componente'
import type { ContextEmail } from './tipuri'
import { formateazaDataOra, formateazaOra } from '@/lib/format'

type Props = ContextEmail & { cand: '24h' | 'scurt' }

/**
 * Reminderele de 24h și cel scurt.
 *
 * Cel scurt e la 1h la evenimentele online și la 3h la cele fizice — oamenii
 * trebuie să plece de acasă (brief §8). Offsetul îl decide cron-ul; aici doar
 * se schimbă tonul.
 */
export function EmailReminder({
  name,
  webinar,
  siteUrl,
  unsubscribeUrl,
  cand,
}: Props) {
  const online = webinar.format !== 'fizic'
  const laFataLocului = webinar.format !== 'online'

  if (cand === 'scurt') {
    // Optimizat pentru mobil: linkul și ora, nimic altceva.
    return (
      <Sablon preview={`Începem la ${formateazaOra(webinar.startsAt)}`} unsubscribeUrl={unsubscribeUrl}>
        <Titlu>{laFataLocului ? 'E timpul să pornești' : 'Începem în curând'}</Titlu>
        <Paragraf>
          <strong>{webinar.title}</strong>, la ora{' '}
          {formateazaOra(webinar.startsAt)}.
        </Paragraf>

        {online && webinar.joinUrl && <Buton href={webinar.joinUrl}>Intră acum</Buton>}

        {laFataLocului && (
          <>
            <Detalii
              randuri={[
                ['Unde', webinar.venueName ?? '—'],
                ['Adresă', [webinar.address, webinar.city].filter(Boolean).join(', ')],
              ]}
            />
            {webinar.mapUrl && <Buton href={webinar.mapUrl}>Deschide harta</Buton>}
          </>
        )}
      </Sablon>
    )
  }

  const randuri: [string, string][] = [['Când', formateazaDataOra(webinar.startsAt)]]
  if (laFataLocului && webinar.venueName) randuri.push(['Unde', webinar.venueName])
  if (laFataLocului && webinar.address) {
    randuri.push(['Adresă', [webinar.address, webinar.city].filter(Boolean).join(', ')])
  }
  randuri.push(['Durată', `${webinar.durationMin} minute`])

  return (
    <Sablon preview={`Mâine: ${webinar.title}`} unsubscribeUrl={unsubscribeUrl}>
      <Titlu>Ne vedem mâine, {name}</Titlu>
      <Paragraf>
        Îți reamintesc de <strong>{webinar.title}</strong>. Vorbim despre lucruri
        pe care le poți folosi chiar de a doua zi, fără să cumperi nimic.
      </Paragraf>

      <Detalii randuri={randuri} />

      {online && webinar.joinUrl && <Buton href={webinar.joinUrl}>Salvează linkul</Buton>}
      {laFataLocului && webinar.mapUrl && (
        <Buton href={webinar.mapUrl}>Deschide în Google Maps</Buton>
      )}
      {laFataLocului && webinar.venueNotes && <Paragraf>{webinar.venueNotes}</Paragraf>}

      <Discret>
        Pagina evenimentului: {siteUrl}/webinar/{webinar.slug}
      </Discret>
    </Sablon>
  )
}
