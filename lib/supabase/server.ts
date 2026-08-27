import 'server-only'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

import type { Database } from '@/lib/database.types'
import { env } from '@/lib/env'

/**
 * Clientul cu cheia publishable și sesiunea utilizatorului.
 *
 * **Doar pentru autentificare.** Nu citește date de business: RLS e activat pe
 * toate tabelele fără nicio politică, deci rolul `authenticated` nu vede nimic.
 * Datele se iau prin createAdminClient(), după ce sesiunea a fost verificată.
 */
export async function createServerSupabase() {
  const cookieStore = await cookies()

  return createServerClient<Database>(env.supabaseUrl(), env.supabaseAnonKey(), {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options)
          }
        } catch {
          // Apelat dintr-un Server Component: refresh-ul de sesiune se face în
          // proxy.ts, deci se poate ignora aici.
        }
      },
    },
  })
}
