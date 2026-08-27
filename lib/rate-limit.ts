import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Rate limiting pe Postgres, prin funcția `check_rate_limit`.
 *
 * Un tabel și un COUNT acoperă complet nevoia unui formular cu câteva sute de
 * trimiteri pe zi, fără să adăugăm un al patrulea furnizor. Vezi PLAN.md §1.
 */
/**
 * Pragul e deliberat generos.
 *
 * Operatorii de mobil din România folosesc masiv CGNAT: zeci de utilizatori
 * reali pot împărți un singur IP public. Pe trafic plătit, un prag strâns
 * blochează înscrieri adevărate — adică exact banii cheltuiți pe reclamă.
 * Un rând de spam se șterge cu o interogare; un lead pierdut, nu.
 *
 * Apărarea principală împotriva boților e honeypot-ul, care e independent de
 * IP și se verifică înaintea acestei funcții.
 */
export async function verificaRateLimit(
  bucket: string,
  { max = 30, windowMinutes = 10 } = {}
): Promise<boolean> {
  const supabase = createAdminClient()

  const { data, error } = await supabase.rpc('check_rate_limit', {
    p_bucket: bucket,
    p_max: max,
    p_window: `${windowMinutes} minutes`,
  })

  if (error) {
    // Dacă verificarea însăși pică, lăsăm cererea să treacă: un formular de
    // înscriere care refuză lumea în timpul unei campanii e mai scump decât
    // câteva trimiteri nelimitate.
    console.error('check_rate_limit a eșuat:', error.message)
    return true
  }

  return data === true
}

/** IP-ul clientului, așa cum îl vede Vercel. */
export function ipClient(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]!.trim()
  return headers.get('x-real-ip')?.trim() || 'necunoscut'
}
