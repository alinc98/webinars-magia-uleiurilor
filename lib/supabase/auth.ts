import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { createServerSupabase } from '@/lib/supabase/server'

export type AdminUser = {
  id: string
  email: string
  name: string | null
  role: 'owner' | 'editor'
}

/**
 * Sesiunea curentă, validată în două trepte.
 *
 * Supabase Auth spune *cine* e utilizatorul; `admin_users` spune dacă are voie
 * să intre. A doua verificare nu e redundantă: fără ea, oricine reușește să
 * obțină un cont Supabase ar avea acces la panou.
 */
export async function getAdminUser(): Promise<AdminUser | null> {
  const supabase = await createServerSupabase()

  // getUser(), nu getSession(): sesiunea din cookie nu e verificată la server.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) return null

  const admin = createAdminClient()
  const { data } = await admin
    .from('admin_users')
    .select('id, email, name, role')
    .eq('email', user.email.toLowerCase())
    .maybeSingle()

  return data ?? null
}

/** Emailul are voie să primească un magic link? Verificat înainte de a-l trimite. */
export async function estePeListaAlba(email: string): Promise<boolean> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('admin_users')
    .select('id')
    .eq('email', email.trim().toLowerCase())
    .maybeSingle()

  return Boolean(data)
}

export async function marcheazaLogin(email: string) {
  const admin = createAdminClient()
  await admin
    .from('admin_users')
    .update({ last_login_at: new Date().toISOString() })
    .eq('email', email.toLowerCase())
}
