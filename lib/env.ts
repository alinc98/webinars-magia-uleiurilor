import 'server-only'

/**
 * Citirea variabilelor de mediu într-un singur loc, cu eroare explicită la
 * pornire în loc de `undefined` care se propagă până într-un mesaj obscur.
 */
function need(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(
      `Variabila de mediu ${name} lipsește. Vezi .env.example și completează .env.local.`
    )
  }
  return value
}

/**
 * Normalizează un URL de bază venit dintr-o variabilă de mediu.
 *
 * `new URL('/cale', 'exemplu.ro')` aruncă `TypeError: Invalid URL`, fiindcă
 * baza n-are schemă. Într-o Server Action asta devine un 500 opac — exact ce
 * s-a întâmplat la prima autentificare în producție, unde valoarea fusese
 * lipită fără `https://`.
 *
 * Acceptăm și forma fără schemă, tăiem slash-ul final, și returnăm `null` dacă
 * tot nu iese ceva valid — ca apelantul să poată cădea pe antetul `Host`.
 */
export function normalizeazaUrlDeBaza(valoare?: string | null): string | null {
  const curat = valoare?.trim().replace(/\/+$/, '')
  if (!curat) return null

  const cuSchema = /^https?:\/\//i.test(curat) ? curat : `https://${curat}`

  try {
    return new URL(cuSchema).origin
  } catch {
    console.error(`NEXT_PUBLIC_SITE_URL nu e un URL valid: ${JSON.stringify(valoare)}`)
    return null
  }
}

export const env = {
  supabaseUrl: () => need('NEXT_PUBLIC_SUPABASE_URL'),
  supabaseAnonKey: () => need('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  supabaseServiceRoleKey: () => need('SUPABASE_SERVICE_ROLE_KEY'),
  cronSecret: () => need('CRON_SECRET'),
  siteUrl: () =>
    normalizeazaUrlDeBaza(process.env.NEXT_PUBLIC_SITE_URL) ?? 'http://localhost:3000',
}
