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

export const env = {
  supabaseUrl: () => need('NEXT_PUBLIC_SUPABASE_URL'),
  supabaseAnonKey: () => need('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  supabaseServiceRoleKey: () => need('SUPABASE_SERVICE_ROLE_KEY'),
  cronSecret: () => need('CRON_SECRET'),
  siteUrl: () => process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
}
