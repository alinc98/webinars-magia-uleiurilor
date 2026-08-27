import { Buton, Discret, Paragraf, Sablon, Titlu } from './componente'
import type { ContextEmail } from './tipuri'

/** Deblocarea unei înregistrări din arhivă, contra email (brief §11). */
export function EmailReplay({ name, webinar, siteUrl, unsubscribeUrl }: ContextEmail) {
  return (
    <Sablon preview={`Înregistrarea: ${webinar.title}`} unsubscribeUrl={unsubscribeUrl}>
      <Titlu>Poftim înregistrarea, {name}</Titlu>
      <Paragraf>
        Ai mai jos întâlnirea <strong>{webinar.title}</strong>. O poți urmări în
        ritmul tău.
      </Paragraf>

      {webinar.recordingUrl && (
        <Buton href={webinar.recordingUrl}>Vezi înregistrarea</Buton>
      )}

      <Paragraf>
        Dacă îți place cum vorbesc despre uleiuri, următoarele întâlniri sunt
        live — și acolo se pot pune întrebări.
      </Paragraf>
      <Discret>{siteUrl}</Discret>
    </Sablon>
  )
}
