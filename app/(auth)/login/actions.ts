'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import type { EmailOtpType } from '@supabase/supabase-js'
import { z } from 'zod'

import { normalizeazaUrlDeBaza } from '@/lib/env'
import { estePeListaAlba, marcheazaLogin } from '@/lib/supabase/auth'
import { createServerSupabase } from '@/lib/supabase/server'

const schema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email('Verifică adresa de email.')),
  redirectTo: z.string().optional(),
})

export type StareLogin = { ok: boolean; email?: string; mesaj?: string }

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
    // Răspuns identic cu cel de succes — inclusiv emailul, ca să apară și
    // pasul cu codul. Altfel formularul devine un instrument de aflat care
    // adrese au acces la panou: pe cele fără acces s-ar vedea alt ecran.
    return { ok: true, email }
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

  return { ok: true, email }
}

const schemaCod = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  cod: z
    .string()
    .trim()
    .transform((v) => v.replace(/\s/g, ''))
    // Lungimea codului e o setare de proiect (`otp_length`), acum 8. Nu o
    // fixăm aici: dacă se schimbă din panoul Supabase, formularul n-ar mai
    // accepta codul pe care tocmai l-a primit omul pe email.
    .pipe(z.string().regex(/^\d{6,10}$/, 'Codul e format numai din cifre.')),
  redirectTo: z.string().optional(),
})

export type StareCod = { mesaj?: string }

/**
 * A doua cale de intrare: codul din email, în locul butonului.
 *
 * Linkul folosește PKCE, deci verificatorul stă într-un cookie al browserului
 * care a cerut linkul — dacă emailul se deschide pe telefon, sau printr-un
 * scanner de linkuri al clientului de mail, schimbul pică. Codul nu depinde de
 * browser, așa că merge și de pe alt dispozitiv.
 */
export async function verificaCod(_stare: StareCod, formData: FormData): Promise<StareCod> {
  const rezultat = schemaCod.safeParse({
    email: formData.get('email'),
    cod: formData.get('cod'),
    redirectTo: formData.get('redirectTo') || undefined,
  })

  if (!rezultat.success) {
    return { mesaj: rezultat.error.issues[0]?.message ?? 'Verifică codul.' }
  }

  const { email, cod, redirectTo } = rezultat.data
  const supabase = await createServerSupabase()

  // Supabase notează tokenul ca `magiclink` pentru un cont existent și ca
  // `signup` pentru unul nou; `email` le acoperă pe amândouă în majoritatea
  // cazurilor, dar nu în toate. Încercăm pe rând, în loc să ghicim.
  const tipuri: EmailOtpType[] = ['email', 'magiclink']
  let user = null

  for (const type of tipuri) {
    const { data, error } = await supabase.auth.verifyOtp({ email, token: cod, type })
    if (!error && data.user?.email) {
      user = data.user
      break
    }
  }

  // Mesaj unic pentru cod greșit, cod expirat și adresă fără acces: oricare
  // dintre ele ar spune altfel ceva despre cine are cont.
  if (!user?.email) {
    return { mesaj: 'Codul nu e valid sau a expirat. Cere un link nou.' }
  }

  // Codul e tastat într-un formular public, spre deosebire de `code`-ul care
  // vine prin redirect de la Supabase. Verificăm încă o dată aici, ca acțiunea
  // să nu poată deschide o sesiune pentru un cont din afara panoului.
  if (!(await estePeListaAlba(user.email))) {
    await supabase.auth.signOut()
    return { mesaj: 'Codul nu e valid sau a expirat. Cere un link nou.' }
  }

  await marcheazaLogin(user.email)

  redirect(redirectTo?.startsWith('/') ? redirectTo : '/admin')
}
