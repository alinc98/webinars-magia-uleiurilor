import 'server-only'

import crypto from 'node:crypto'

/**
 * Conversions API.
 *
 * Pixelul din browser și evenimentul de aici trimit **același `event_id`**,
 * ceea ce îi permite Meta să le deduplice. Fără asta, o înscriere apare de
 * două ori și rata de conversie raportată e dublă față de realitate.
 *
 * Avantajul căii de server e că avem deja email, telefon și nume în bază, pe
 * care le trimitem hash-uite. Un formular WordPress n-are asta, iar match
 * rate-ul e vizibil mai slab.
 *
 * **Baza legală** (brief §10): evenimentul de server pleacă doar pentru cine a
 * bifat explicit consimțământul în formular. Bannerul de cookie-uri guvernează
 * separat pixelul din browser. Cele două sunt decizii diferite, luate
 * conștient.
 */

type EvenimentMeta = {
  eventName: 'Lead' | 'CompleteRegistration'
  eventId: string
  eventSourceUrl?: string
  email: string
  phone?: string | null
  name?: string | null
  city?: string | null
  country?: string
  fbclid?: string | null
  /** Cookie-ul `_fbp` din browser, dacă a fost trimis odată cu formularul. */
  fbp?: string | null
  clientIp?: string
  userAgent?: string
}

/** Meta cere SHA-256 peste valoarea normalizată: trim + lowercase. */
function hash(valoare?: string | null): string | undefined {
  const curat = valoare?.trim().toLowerCase()
  if (!curat) return undefined
  return crypto.createHash('sha256').update(curat).digest('hex')
}

/** Telefonul se normalizează la cifre, cu prefix de țară — 0722… → 40722… */
function hashTelefon(telefon?: string | null): string | undefined {
  if (!telefon) return undefined
  let cifre = telefon.replace(/\D/g, '')
  if (!cifre) return undefined
  if (cifre.startsWith('00')) cifre = cifre.slice(2)
  else if (cifre.startsWith('0')) cifre = `40${cifre.slice(1)}`
  return crypto.createHash('sha256').update(cifre).digest('hex')
}

/**
 * `fbc` se construiește din `fbclid`, în formatul cerut de Meta:
 * `fb.<subdomain_index>.<timestamp_ms>.<fbclid>`.
 */
function construiesteFbc(fbclid?: string | null, cand?: Date): string | undefined {
  if (!fbclid) return undefined
  return `fb.1.${(cand ?? new Date()).getTime()}.${fbclid}`
}

export async function trimiteEvenimentMeta(
  eveniment: EvenimentMeta
): Promise<{ ok: boolean; motiv?: string }> {
  const pixelId = process.env.META_PIXEL_ID
  const token = process.env.META_CAPI_TOKEN

  if (!pixelId || !token) return { ok: false, motiv: 'neconfigurat' }

  const [prenume, ...restul] = (eveniment.name ?? '').trim().split(/\s+/)

  const userData: Record<string, unknown> = {
    em: [hash(eveniment.email)].filter(Boolean),
    ph: [hashTelefon(eveniment.phone)].filter(Boolean),
    fn: [hash(prenume)].filter(Boolean),
    ln: [hash(restul.join(' '))].filter(Boolean),
    ct: [hash(eveniment.city)].filter(Boolean),
    country: [hash(eveniment.country ?? 'ro')].filter(Boolean),
    fbc: construiesteFbc(eveniment.fbclid),
    fbp: eveniment.fbp ?? undefined,
    client_ip_address: eveniment.clientIp,
    client_user_agent: eveniment.userAgent,
  }

  for (const cheie of Object.keys(userData)) {
    const valoare = userData[cheie]
    if (valoare === undefined || (Array.isArray(valoare) && valoare.length === 0)) {
      delete userData[cheie]
    }
  }

  const corp: Record<string, unknown> = {
    data: [
      {
        event_name: eveniment.eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: eveniment.eventId,
        event_source_url: eveniment.eventSourceUrl,
        action_source: 'website',
        user_data: userData,
      },
    ],
  }

  // Doar în Preview: evenimentele apar în Test Events, nu în rapoarte.
  if (process.env.META_TEST_EVENT_CODE) {
    corp.test_event_code = process.env.META_TEST_EVENT_CODE
  }

  try {
    const raspuns = await fetch(
      `https://graph.facebook.com/v21.0/${pixelId}/events?access_token=${encodeURIComponent(token)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corp),
      }
    )

    if (!raspuns.ok) {
      const text = await raspuns.text()
      console.error('CAPI a răspuns cu eroare:', raspuns.status, text.slice(0, 400))
      return { ok: false, motiv: `http_${raspuns.status}` }
    }

    return { ok: true }
  } catch (eroare) {
    // Tracking-ul nu are voie să pice înscrierea.
    console.error('CAPI a eșuat:', eroare instanceof Error ? eroare.message : eroare)
    return { ok: false, motiv: 'retea' }
  }
}
