import type { Tracking } from '@/lib/validations/inscriere'

const CHEI_UTM = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
] as const

/**
 * Citește UTM-urile și `fbclid` din query string.
 *
 * Se salvează în două locuri diferite, intenționat (brief §9): pe contact prima
 * atingere, pe înscriere ultima. Așa vezi în admin și de unde a auzit omul
 * prima dată de tine, și care reclamă l-a convins de data asta.
 */
export function citesteTracking(
  params: URLSearchParams,
  extra: { referrer?: string; landingPage?: string } = {}
): Tracking {
  const tracking: Tracking = {}

  for (const cheie of CHEI_UTM) {
    const valoare = params.get(cheie)?.trim()
    if (valoare) tracking[cheie] = valoare.slice(0, 200)
  }

  const fbclid = params.get('fbclid')?.trim()
  if (fbclid) tracking.fbclid = fbclid.slice(0, 500)

  if (extra.referrer) tracking.referrer = extra.referrer.slice(0, 1000)
  if (extra.landingPage) tracking.landing_page = extra.landingPage.slice(0, 500)

  return tracking
}
