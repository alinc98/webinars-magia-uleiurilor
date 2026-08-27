'use server'

import { headers } from 'next/headers'
import { z } from 'zod'

import { normalizeazaUrlDeBaza } from '@/lib/env'
import { estePeListaAlba } from '@/lib/supabase/auth'
import { createServerSupabase } from '@/lib/supabase/server'

const schema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email('Verifică adresa de email.')),
  redirectTo: z.string().optional(),
})

export type StareLogin = { ok: boolean; mesaj?: string }

export async function trimiteMagicLink(
  _stare: StareLogin,
  formData: FormData
): Promise<StareLogin> {
  const rezultat = schema.safeParse({
    email: formData.get('email'),
    redirectTo: formData.get('redirectTo') || undefined,
  })

  if (!rezultat.success) {
    return { ok: false, mesaj: rezultat.error.issues[0]?.message ?? 'Verifică adresa.' }
  }

  const { email, redirectTo } = rezultat.data

  // Verificăm lista albă *înainte* de a trimite, ca o adresă străină să nu
  // primească niciodată un link. `proxy.ts` și layout-ul verifică din nou.
  if (!(await estePeListaAlba(email))) {
    // Răspuns identic cu cel de succes: altfel formularul devine un instrument
    // de aflat care adrese au acces la panou.
    return { ok: true }
  }

  const antete = await headers()
  // Dacă variabila lipsește sau e greșită, cădem pe gazda cererii — mai bine
  // un link corect decât o autentificare care pică.
  const origine =
    normalizeazaUrlDeBaza(process.env.NEXT_PUBLIC_SITE_URL) ??
    normalizeazaUrlDeBaza(
      `${antete.get('x-forwarded-proto') ?? 'https'}://${antete.get('host')}`
    )

  if (!origine) {
    console.error('Nu am putut determina originea pentru linkul de autentificare.')
    return { ok: false, mesaj: 'Nu am putut trimite linkul. Încearcă din nou.' }
  }

  const destinatie = new URL('/auth/confirmare', origine)
  if (redirectTo?.startsWith('/')) destinatie.searchParams.set('next', redirectTo)

  const supabase = await createServerSupabase()
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: destinatie.toString() },
  })

  if (error) {
    console.error('signInWithOtp a eșuat:', error.message)
    return { ok: false, mesaj: 'Nu am putut trimite linkul. Încearcă din nou.' }
  }

  return { ok: true }
}
