import type { Metadata } from 'next'

import { formateazaDataOra } from '@/lib/format'
import { linkGoogleCalendar } from '@/lib/ics'
import { getWebinarBySlug } from '@/lib/webinars/queries'

export const metadata: Metadata = {
  title: 'Te-ai înscris',
  robots: { index: false, follow: false },
}

export default async function Page(props: PageProps<'/inscriere-confirmata'>) {
  const { w } = await props.searchParams
  const slug = typeof w === 'string' ? w : undefined
  const webinar = slug ? await getWebinarBySlug(slug) : null

  return (
    <main className="mx-auto w-full max-w-[600px] px-6 py-20">
      <h1 className="font-heading text-3xl">Gata, te-ai înscris.</h1>

      <p className="mt-4">
        Ți-am trimis un email de confirmare. Dacă nu ajunge în câteva minute,
        verifică și în Promoții sau Spam.
      </p>

      {webinar && (
        <p className="text-muted-foreground mt-6">
          <strong className="text-foreground">{webinar.title}</strong>
          <br />
          {formateazaDataOra(webinar.starts_at!)}
        </p>
      )}

      {webinar?.starts_at && (
        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href={linkGoogleCalendar({
              uid: `${webinar.id}@magia-uleiurilor.ro`,
              title: webinar.title!,
              startsAt: webinar.starts_at,
              durationMin: webinar.duration_min ?? 60,
              location:
                webinar.format === 'online'
                  ? (webinar.join_url ?? undefined)
                  : [webinar.venue_name, webinar.address, webinar.city]
                      .filter(Boolean)
                      .join(', ') || undefined,
            })}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-secondary text-secondary-foreground inline-flex min-h-[48px] items-center rounded-xl px-5 text-sm font-medium"
          >
            Adaugă în Google Calendar
          </a>
          <a
            href={`/api/calendar/${webinar.slug}`}
            className="border-border inline-flex min-h-[48px] items-center rounded-xl border px-5 text-sm font-medium"
          >
            Descarcă pentru alt calendar
          </a>
        </div>
      )}

      {/* TODO(M5): reamintirea bonusului și o singură invitație discretă spre Instagram */}
    </main>
  )
}
