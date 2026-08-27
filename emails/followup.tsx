import { Buton, Discret, Paragraf, Sablon, Titlu } from './componente'
import type { ContextEmail } from './tipuri'

type Props = ContextEmail & { aParticipat: boolean }

/**
 * Cele două follow-up-uri de la 2h după eveniment.
 *
 * Prezenții și absenții primesc mesaje diferite: unii au nevoie de bonus și
 * înregistrare, ceilalți de un motiv să revină (brief §8).
 */
export function EmailFollowUp({
  name,
  webinar,
  siteUrl,
  unsubscribeUrl,
  aParticipat,
}: Props) {
  const fizic = webinar.format === 'fizic'

  if (aParticipat) {
    return (
      <Sablon preview="Mulțumesc că ai fost acolo" unsubscribeUrl={unsubscribeUrl}>
        <Titlu>Mulțumesc că ai fost acolo, {name}</Titlu>
        <Paragraf>
          Mi-a făcut plăcere să te am alături la <strong>{webinar.title}</strong>.
        </Paragraf>

        {webinar.bonusTitle && (
          <Paragraf>
            Ți-am pregătit <strong>{webinar.bonusTitle}</strong>, așa cum am promis.
          </Paragraf>
        )}

        {/* La evenimentele fizice nu există înregistrare: se trimit fotografii
            de la eveniment și invitația la următorul (brief §8). */}
        {!fizic && webinar.recordingUrl && (
          <Buton href={webinar.recordingUrl}>Vezi înregistrarea</Buton>
        )}
        {fizic && <Buton href={`${siteUrl}/`}>Vezi ce urmează</Buton>}
      </Sablon>
    )
  }

  return (
    <Sablon preview="Ne-am văzut fără tine, dar am păstrat tot" unsubscribeUrl={unsubscribeUrl}>
      <Titlu>Ne-am văzut fără tine, {name}</Titlu>
      <Paragraf>
        Se întâmplă — programul nu ține cont de întâlniri. Ce am discutat la{' '}
        <strong>{webinar.title}</strong> rămâne disponibil.
      </Paragraf>

      {!fizic && webinar.recordingUrl && (
        <Buton href={webinar.recordingUrl}>Vezi înregistrarea</Buton>
      )}

      <Paragraf>
        Dacă preferi să fim în aceeași cameră, ai lista întâlnirilor care urmează.
      </Paragraf>
      <Buton href={`${siteUrl}/`}>Vezi următoarele întâlniri</Buton>

      <Discret>Fără grabă. Vin des.</Discret>
    </Sablon>
  )
}
