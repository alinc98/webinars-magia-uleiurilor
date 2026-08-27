import { NextResponse } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'

import { marcheazaLogin } from '@/lib/supabase/auth'
import { createServerSupabase } from '@/lib/supabase/server'

/**
 * Ținta magic link-ului: schimbă ce vine din URL pe o sesiune în cookie.
 *
 * Supabase poate trimite două lucruri diferite, în funcție de cum e configurat
 * template-ul de email:
 *
 * - `code` — fluxul PKCE, cel implicit. Linkul trece întâi prin
 *   `/auth/v1/verify` al Supabase, care redirecționează aici cu un cod.
 * - `token_hash` — dacă template-ul e personalizat să folosească `{{ .TokenHash }}`.
 *
 * Le acceptăm pe amândouă, ca schimbarea template-ului să nu rupă
 * autentificarea.
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const tokenHash = url.searchParams.get('token_hash')
  const type = url.searchParams.get('type') as EmailOtpType | null
  const next = url.searchParams.get('next')

  const destinatie = next?.startsWith('/') ? next : '/admin'
  const supabase = await createServerSupabase()

  const rezultat = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : tokenHash && type
      ? await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
      : null

  if (!rezultat) {
    return NextResponse.redirect(new URL('/login?eroare=lipsa', url.origin))
  }

  if (rezultat.error || !rezultat.data.user?.email) {
    console.error('Confirmarea a eșuat:', rezultat.error?.message)
    return NextResponse.redirect(new URL('/login?eroare=invalid', url.origin))
  }

  await marcheazaLogin(rezultat.data.user.email)

  return NextResponse.redirect(new URL(destinatie, url.origin))
}
