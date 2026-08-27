import 'server-only'

import { createClient } from '@supabase/supabase-js'

import type { Database } from '@/lib/database.types'
import { env } from '@/lib/env'

/**
 * Clientul cu `service_role`. Ocolește RLS, deci are acces complet la tot.
 *
 * Toate citirile și scrierile de business trec pe aici, exclusiv pe server.
 * Importul `server-only` de mai sus face ca folosirea lui într-o componentă
 * `"use client"` să pice la build, nu în producție.
 *
 * Pentru autentificare se folosește celălalt client, lib/supabase/server.ts.
 */
export function createAdminClient() {
  return createClient<Database>(env.supabaseUrl(), env.supabaseServiceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
