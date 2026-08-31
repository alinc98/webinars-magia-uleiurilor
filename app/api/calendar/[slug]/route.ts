import { env } from '@/lib/env'
import { construiesteIcs } from '@/lib/ics'
import { formateazaProgramScurt } from '@/lib/program'
import { getWebinarBySlug, sesiuni } from '@/lib/webinars/queries'

/** Fișierul .ics servit de pe pagina de confirmare, pentru cine l-a pierdut din email. */
export async function GET(
  _request: Request,
  ctx: RouteContext<'/api/calendar/[slug]'>,
) {
  const { slug } = await ctx.params
  const webinar = await getWebinarBySlug(slug)

  const program = webinar ? sesiuni(webinar) : []

  if (!webinar || !webinar.id || program.length === 0) {
    return new Response('Nu am găsit evenimentul.', { status: 404 })
  }

  const locatie =
    webinar.format === 'online'
      ? (webinar.join_url ?? undefined)
      : [webinar.venue_name, webinar.address, webinar.city]
          .filter(Boolean)
          .join(', ')

  const ics = construiesteIcs({
    uid: `${webinar.id}@magia-uleiurilor.ro`,
    title: webinar.title!,
    description: `${webinar.title} — ${formateazaProgramScurt(program)}`,
    sesiuni: program,
    location: locatie || undefined,
    url: `${env.siteUrl()}/webinar/${webinar.slug}`,
    organizerName: 'Andreea Gligor',
  })

  return new Response(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${slug}.ics"`,
      'Cache-Control': 'no-store',
    },
  })
}
