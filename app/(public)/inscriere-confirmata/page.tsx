import type { Metadata } from 'next'

import { formateazaDataOra } from '@/lib/format'
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

      {/* TODO(M3): buton „adaugă în calendar" (.ics + Google Calendar) */}
      {/* TODO(M5): reamintirea bonusului și o singură invitație discretă spre Instagram */}
    </main>
  )
}
