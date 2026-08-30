import {
  Buton,
  Detalii,
  Discret,
  Paragraf,
  Sablon,
  Subtitlu,
  Titlu,
} from './componente'
import type { ContextEmail } from './tipuri'
import {
  ETICHETA_FORMAT,
  formateazaDataOra,
  formateazaDurata,
  formateazaPret,
} from '@/lib/format'

/**
 * Confirmarea de înscriere.
 *
 * La evenimentele fizice conținutul e altul, nu doar alt link: adresa, harta și
 * notele practice iau locul linkului de întâlnire (brief §8).
 *
 * La cele hibride, omul a ales la înscriere cum vine. Punem în față calea pe
 * care a ales-o și o lăsăm pe cealaltă ca plasă de siguranță — două blocuri
 * egale, unul sub altul, l-ar pune să aleagă a doua oară. Când preferința
 * lipsește, arătăm ambele.
 */
export function EmailConfirmare({
  name,
  webinar,
  siteUrl,
  unsubscribeUrl,
  calendarUrl,
  preferinta,
}: ContextEmail) {
  const hibrid = webinar.format === 'hibrid'
  const alesFizic = hibrid && preferinta === 'fizic'
  const alesOnline = hibrid && preferinta === 'online'

  const arataFizic = webinar.format === 'fizic' || (hibrid && !alesOnline)
  const arataOnline = webinar.format === 'online' || (hibrid && !alesFizic)

  const randuri: [string, string][] = [
    ['Când', formateazaDataOra(webinar.startsAt)],
    ['Durată', formateazaDurata(webinar.durationMin)],
    ['Format', ETICHETA_FORMAT[webinar.format]!],
  ]
  if (webinar.priceBani != null) {
    randuri.push(['Cost', formateazaPret(webinar.priceBani)])
  }
  if (arataFizic && webinar.venueName) randuri.push(['Unde', webinar.venueName])
  if (arataFizic && webinar.address) {
    randuri.push([
      'Adresă',
      [webinar.address, webinar.city].filter(Boolean).join(', '),
    ])
  }

  return (
    <Sablon
      preview={`Data, ora și tot ce îți trebuie ca să ajungi la ${webinar.title}.`}
      unsubscribeUrl={unsubscribeUrl}
    >
      <Titlu>Bună, {name}! 🌿</Titlu>

      <Paragraf>
        Mă bucur că te-ai înscris la <strong>{webinar.title}</strong>.
      </Paragraf>

      <Paragraf>
        Mai jos găsești tot ce îți trebuie pentru participare, ca să ai la
        îndemână.
      </Paragraf>

      <Detalii randuri={randuri} />

      {/* Platforma nu încasează. Singurul lucru onest de spus e că urmează
          un mesaj — altfel omul rămâne cu o sumă şi fără nicio instrucţiune. */}
      {webinar.priceBani != null && (
        <Discret>
          Instrucțiunile de plată îți vin în curând, pe email sau telefon.
        </Discret>
      )}

      {alesFizic && (
        <Paragraf>
          Ai ales să participi <strong>la fața locului</strong>.
        </Paragraf>
      )}

      {arataFizic && webinar.mapUrl && (
        <Buton href={webinar.mapUrl}>Deschide în Google Maps</Buton>
      )}

      {arataFizic && webinar.venueNotes && (
        <>
          <Subtitlu>Bine de știut înainte să pleci de acasă</Subtitlu>
          <Paragraf>{webinar.venueNotes}</Paragraf>
        </>
      )}

      {/* Fără linkul de intrare aici, dinadins. Pleacă doar cu reamintirile,
          ca omul să-l aibă la îndemână atunci când îi trebuie şi să nu se
          piardă într-un email citit cu trei săptămâni înainte. */}
      {arataOnline && (
        <Paragraf>
          {alesOnline
            ? 'Ai ales să participi online.'
            : 'Evenimentul are loc online.'}{' '}
          Linkul de intrare îți vine pe email cu o zi înainte, și încă o dată cu
          o oră înainte de început.
        </Paragraf>
      )}

      {/* Plasa de siguranță la hibrid: cealaltă cale, discret, nu ca a doua
          invitație de a alege. */}
      {alesFizic && webinar.joinUrl && (
        <Discret>
          Dacă totuși nu poți ajunge, poți participa online — linkul vine odată
          cu reamintirile.
        </Discret>
      )}

      {alesOnline && webinar.address && (
        <Discret>
          Dacă te răzgândești și vrei să vii în persoană, ne găsești la{' '}
          {[webinar.venueName, webinar.address, webinar.city]
            .filter(Boolean)
            .join(', ')}
          .
        </Discret>
      )}

      {/* Tot blocul depinde de acelaşi lucru: fişierul .ics se ataşează şi
          linkul de Google se construieşte în aceeaşi ramură. Fără el, secţiunea
          ar promite un ataşament care nu există. */}
      {calendarUrl && (
        <>
          <Subtitlu>Adaugă evenimentul în calendar</Subtitlu>
          <Paragraf>
            Ca să îți fie mai ușor să îți amintești, îl poți pune direct în
            calendarul tău.
          </Paragraf>

          <Buton href={calendarUrl}>Adaugă în Google Calendar</Buton>

          <Discret>
            Ți-am atașat și fișierul de calendar, pentru Apple Calendar sau
            Outlook.
          </Discret>
        </>
      )}

      {webinar.usefulInfo && (
        <>
          <Subtitlu>Informații utile</Subtitlu>
          <Paragraf>{webinar.usefulInfo}</Paragraf>
        </>
      )}

      <Paragraf>
        Dacă ai întrebări sau apare ceva și nu mai poți participa, poți răspunde
        direct la acest email. Mesajul tău ajunge la mine.
      </Paragraf>

      <Paragraf>Ne vedem curând!</Paragraf>

      <Paragraf>
        Cu drag,
        <br />
        Andreea Gligor
        <br />
        Magia Uleiurilor
      </Paragraf>

      <Discret>
        Pagina evenimentului:{' '}
        <a href={`${siteUrl}/webinar/${webinar.slug}`}>
          {siteUrl}/webinar/{webinar.slug}
        </a>
      </Discret>
    </Sablon>
  )
}
