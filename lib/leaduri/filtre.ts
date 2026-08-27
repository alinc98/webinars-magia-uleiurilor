import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/lib/database.types'

export type FiltreLeaduri = {
  q?: string
  status?: Database['public']['Enums']['contact_status']
  tag?: string
  webinar?: string
  de_la?: string
  pana_la?: string
  sursa?: string
  pagina: number
}

const STATUSURI = ['nou', 'contactat', 'interesat', 'client', 'inactiv'] as const
export const PE_PAGINA = 50

export function citesteFiltre(
  searchParams: Record<string, string | string[] | undefined>
): FiltreLeaduri {
  const unul = (cheie: string) => {
    const v = searchParams[cheie]
    const valoare = Array.isArray(v) ? v[0] : v
    return valoare?.trim() || undefined
  }

  const status = unul('status')

  return {
    q: unul('q'),
    status: (STATUSURI as readonly string[]).includes(status ?? '')
      ? (status as FiltreLeaduri['status'])
      : undefined,
    tag: unul('tag'),
    webinar: unul('webinar'),
    de_la: unul('de_la'),
    pana_la: unul('pana_la'),
    sursa: unul('sursa'),
    pagina: Math.max(1, Number(unul('pagina') ?? 1) || 1),
  }
}

/**
 * Filtrarea pe webinar are nevoie de un pas în plus: `contacts_with_stats` ține
 * webinariile într-un `uuid[]`, iar PostgREST filtrează pe array cu `contains`.
 */
export async function interogheazaLeaduri(filtre: FiltreLeaduri, pentruExport = false) {
  const supabase = createAdminClient()

  let interogare = supabase
    .from('contacts_with_stats')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (filtre.q) {
    const termen = `%${filtre.q}%`
    interogare = interogare.or(
      `name.ilike.${termen},email.ilike.${termen},phone.ilike.${termen}`
    )
  }
  if (filtre.status) interogare = interogare.eq('status', filtre.status)
  if (filtre.tag) interogare = interogare.contains('tags', [filtre.tag])
  if (filtre.webinar) interogare = interogare.contains('webinar_ids', [filtre.webinar])
  if (filtre.sursa) interogare = interogare.eq('first_utm_source', filtre.sursa)
  if (filtre.de_la) interogare = interogare.gte('created_at', filtre.de_la)
  if (filtre.pana_la) {
    // Interval inclusiv: „până la 14 sept" trebuie să prindă și 14 sept, ora 23:59.
    const pana = new Date(filtre.pana_la)
    pana.setDate(pana.getDate() + 1)
    interogare = interogare.lt('created_at', pana.toISOString())
  }

  if (!pentruExport) {
    const de_la = (filtre.pagina - 1) * PE_PAGINA
    interogare = interogare.range(de_la, de_la + PE_PAGINA - 1)
  }

  return interogare
}

export function areFiltreActive(filtre: FiltreLeaduri) {
  return Boolean(
    filtre.q ||
      filtre.status ||
      filtre.tag ||
      filtre.webinar ||
      filtre.de_la ||
      filtre.pana_la ||
      filtre.sursa
  )
}
