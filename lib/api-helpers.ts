import 'server-only'

import { NextResponse } from 'next/server'
import type { ZodType, ZodError } from 'zod'

import { ipClient, verificaRateLimit } from '@/lib/rate-limit'

/** Mesajele întoarse formularului. Cheia vine din jsonb-ul funcțiilor din bază. */
const MESAJE: Record<string, string> = {
  consent_required: 'Trebuie să accepți politica de confidențialitate.',
  webinar_not_found: 'Evenimentul nu mai există.',
  webinar_not_open: 'Înscrierile la acest eveniment nu sunt deschise.',
  webinar_past: 'Evenimentul a avut deja loc.',
  replay_unavailable: 'Înregistrarea nu e disponibilă pentru acest eveniment.',
  full: 'Nu mai sunt locuri libere.',
  already_registered: 'Ești deja înscris. Verifică-ți emailul.',
  already_on_waitlist: 'Ești deja pe listă. Îți scriem când se anunță ceva.',
  rate_limited: 'Prea multe încercări. Încearcă din nou peste câteva minute.',
  invalid: 'Verifică datele completate.',
  server_error: 'Ceva n-a mers. Încearcă din nou.',
}

export function raspunsEroare(reason: string, status = 400) {
  return NextResponse.json(
    { ok: false, reason, message: MESAJE[reason] ?? MESAJE.server_error },
    { status }
  )
}

function erori(error: ZodError): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of error.issues) {
    const cheie = issue.path.join('.') || 'form'
    out[cheie] ??= issue.message
  }
  return out
}

/**
 * Pașii comuni ai celor trei endpoint-uri publice, în ordinea în care contează:
 * honeypot înainte de orice muncă, rate limit înainte de a atinge baza,
 * validare înainte de a apela funcția.
 */
export async function citesteCerere<T>(
  request: Request,
  schema: ZodType<T>,
  bucket: string,
  optiuni: { max?: number; windowMinutes?: number } = {}
): Promise<
  { ok: true; date: T } | { ok: false; raspuns: NextResponse }
> {
  let brut: unknown
  try {
    brut = await request.json()
  } catch {
    return { ok: false, raspuns: raspunsEroare('invalid') }
  }

  // Honeypot: răspundem cu succes fals, ca botul să nu învețe că l-am prins.
  const website = (brut as { website?: unknown })?.website
  if (typeof website === 'string' && website.length > 0) {
    return {
      ok: false,
      raspuns: NextResponse.json({ ok: true, status: 'ok' }, { status: 200 }),
    }
  }

  const ip = ipClient(request.headers)
  const permis = await verificaRateLimit(`${bucket}:${ip}`, optiuni)
  if (!permis) {
    return { ok: false, raspuns: raspunsEroare('rate_limited', 429) }
  }

  const rezultat = schema.safeParse(brut)
  if (!rezultat.success) {
    return {
      ok: false,
      raspuns: NextResponse.json(
        { ok: false, reason: 'invalid', message: MESAJE.invalid, errors: erori(rezultat.error) },
        { status: 422 }
      ),
    }
  }

  return { ok: true, date: rezultat.data }
}
