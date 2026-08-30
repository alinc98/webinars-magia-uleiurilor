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
  formateazaDataOra,
  formateazaDurata,
  formateazaOra,
} from '@/lib/format'

type Props = ContextEmail & { cand: '24h' | 'scurt' }

/**
 * Reamintirile: cea cu o zi înainte și cea scurtă.
 *
 * Cea scurtă pleacă la o oră la evenimentele online și la trei la cele fizice —
 * de la un atelier omul trebuie să plece de acasă (brief §8). Offsetul îl
 * decide cron-ul; aici se schimbă doar tonul.
 *
 * Aceeași voce ca la confirmare: salut pe nume, semnătura Andreei, invitația
 * de a răspunde. Şi fără promisiuni: textul dinainte spunea „vorbim despre
 * lucruri pe care le poți folosi chiar de a doua zi, fără să cumperi nimic" —
 * adevărat cât timp toate întâlnirile erau gratuite, fals de când există preț.
 *
 * Linkul de intrare trăiește doar aici. Confirmarea nu-l mai conține, deci
 * mesajele astea sunt singura cale a omului către eveniment.
 */
export function EmailReminder({
  name,
  webinar,
  siteUrl,
  unsubscribeUrl,
  cand,
}: Props) {
  const online = webinar.format === 'online'
  const laFataLocului = webinar.format === 'fizic'

  if (cand === 'scurt') {
    // Se citește pe telefon, adesea în picioare. Ora, calea de intrare, atât.
    return (
      <Sablon
        preview={`Începem la ${formateazaOra(webinar.startsAt)}.`}
        unsubscribeUrl={unsubscribeUrl}
      >
        <Titlu>
          {laFataLocului ? 'E timpul să pornești' : 'Începem în curând'}
        </Titlu>

        <Paragraf>
          Bună, {name}! <strong>{webinar.title}</strong> începe la ora{' '}
          {formateazaOra(webinar.startsAt)}.
        </Paragraf>

        {online && webinar.joinUrl && (
          <Buton href={webinar.joinUrl}>Intră la eveniment</Buton>
        )}

        {laFataLocului && (
          <>
            <Detalii
              randuri={[
                ['Unde', webinar.venueName ?? '—'],
                [
                  'Adresă',
                  [webinar.address, webinar.city].filter(Boolean).join(', '),
                ],
              ]}
            />
            {webinar.mapUrl && (
              <Buton href={webinar.mapUrl}>Deschide harta</Buton>
            )}
          </>
        )}

        <Paragraf>
          Ne vedem imediat!
          <br />
          Andreea
        </Paragraf>
      </Sablon>
    )
  }

  const randuri: [string, string][] = [
    ['Când', formateazaDataOra(webinar.startsAt)],
    ['Durată', formateazaDurata(webinar.durationMin)],
  ]
  if (laFataLocului && webinar.venueName) {
    randuri.push(['Unde', webinar.venueName])
  }
  if (laFataLocului && webinar.address) {
    randuri.push([
      'Adresă',
      [webinar.address, webinar.city].filter(Boolean).join(', '),
    ])
  }

  return (
    <Sablon
      preview={`Mâine: ${webinar.title}.`}
      unsubscribeUrl={unsubscribeUrl}
    >
      <Titlu>Bună, {name}! 🌿</Titlu>

      <Paragraf>
        Îți scriu ca să-ți amintesc că mâine avem{' '}
        <strong>{webinar.title}</strong>.
      </Paragraf>

      <Detalii randuri={randuri} />

      {online && webinar.joinUrl && (
        <>
          <Subtitlu>Linkul de intrare</Subtitlu>
          <Paragraf>
            Îl folosești mâine, la ora de mai sus. Salvează-l sau lasă-ți
            mesajul ăsta la îndemână.
          </Paragraf>
          <Buton href={webinar.joinUrl}>Intră la eveniment</Buton>
        </>
      )}

      {laFataLocului && webinar.mapUrl && (
        <Buton href={webinar.mapUrl}>Deschide în Google Maps</Buton>
      )}

      {laFataLocului && webinar.venueNotes && (
        <>
          <Subtitlu>Bine de știut înainte să pleci de acasă</Subtitlu>
          <Paragraf>{webinar.venueNotes}</Paragraf>
        </>
      )}

      <Paragraf>
        Dacă apare ceva și nu mai poți participa, poți răspunde direct la acest
        email. Mesajul tău ajunge la mine.
      </Paragraf>

      <Paragraf>
        Ne vedem mâine!
        <br />
        <br />
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
