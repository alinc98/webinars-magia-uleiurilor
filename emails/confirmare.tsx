import { Buton, Detalii, Discret, Paragraf, Sablon, Titlu } from './componente'
import type { ContextEmail } from './tipuri'
import { ETICHETA_FORMAT, formateazaDataOra } from '@/lib/format'

/**
 * Confirmarea de înscriere.
 *
 * La evenimentele fizice, conținutul e altul, nu doar alt link: adresa,
 * notele practice și harta iau locul linkului de Zoom (brief §8).
 */
export function EmailConfirmare({
  name,
  webinar,
  siteUrl,
  unsubscribeUrl,
  calendarUrl,
}: ContextEmail) {
  const online = webinar.format !== 'fizic'
  const laFataLocului = webinar.format !== 'online'

  const randuri: [string, string][] = [
    ['Când', formateazaDataOra(webinar.startsAt)],
    ['Durată', `${webinar.durationMin} minute`],
    ['Format', ETICHETA_FORMAT[webinar.format]!],
  ]
  if (laFataLocului && webinar.venueName) randuri.push(['Unde', webinar.venueName])
  if (laFataLocului && webinar.address) {
    randuri.push(['Adresă', [webinar.address, webinar.city].filter(Boolean).join(', ')])
  }

  return (
    <Sablon preview={`Te-ai înscris: ${webinar.title}`} unsubscribeUrl={unsubscribeUrl}>
      <Titlu>Gata, {name}. Te-ai înscris.</Titlu>
      <Paragraf>
        Ți-am rezervat locul la <strong>{webinar.title}</strong>. Ai mai jos tot
        ce îți trebuie ca să ajungi.
      </Paragraf>

      <Detalii randuri={randuri} />

      {online && webinar.joinUrl && (
        <>
          <Buton href={webinar.joinUrl}>Intră în întâlnire</Buton>
          <Discret>
            Linkul funcționează în ziua evenimentului. Ți-l retrimitem cu o oră
            înainte, ca să nu-l cauți prin inbox.
          </Discret>
        </>
      )}

      {laFataLocului && webinar.mapUrl && (
        <Buton href={webinar.mapUrl}>Deschide în Google Maps</Buton>
      )}

      {laFataLocului && webinar.venueNotes && (
        <>
          <Paragraf>
            <strong>Bine de știut înainte să pleci de acasă</strong>
          </Paragraf>
          <Paragraf>{webinar.venueNotes}</Paragraf>
        </>
      )}

      {calendarUrl && (
        <Discret>
          Ai atașat și fișierul pentru calendar. Îl poți adăuga și direct în{' '}
          <a href={calendarUrl}>Google Calendar</a>.
        </Discret>
      )}

      <Paragraf>
        Dacă apare ceva și nu mai poți ajunge, răspunde la mesajul ăsta — nu e o
        adresă automată.
      </Paragraf>

      <Discret>
        Pagina evenimentului: {siteUrl}/webinar/{webinar.slug}
      </Discret>
    </Sablon>
  )
}
