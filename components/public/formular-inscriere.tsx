'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { trimiteLeadPixel } from '@/components/public/meta-pixel'
import { citesteTracking } from '@/lib/utm'
import { inscriereSchema } from '@/lib/validations/inscriere'

type Props = {
  slug: string
  /** Textul acceptat, venit din admin cu versionare (brief §10). */
  textConsimtamant?: string
  /** La `hibrid` se cere și modul de participare (brief §12.8). */
  format: 'online' | 'fizic' | 'hibrid'
  eticheta?: string
}

type Erori = Record<string, string>

export function FormularInscriere({
  slug,
  format,
  textConsimtamant,
  eticheta = 'Vreau să particip',
}: Props) {
  const router = useRouter()
  const [seTrimite, setSeTrimite] = useState(false)
  const [erori, setErori] = useState<Erori>({})
  const [eroareGenerala, setEroareGenerala] = useState<string | null>(null)

  function stergeErori() {
    if (Object.keys(erori).length > 0) setErori({})
    if (eroareGenerala) setEroareGenerala(null)
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErori({})
    setEroareGenerala(null)

    const formData = new FormData(event.currentTarget)
    // Același id pentru pixel și pentru Conversions API: fără el, Meta numără
    // aceeași înscriere de două ori (brief §9).
    const eventId = crypto.randomUUID()

    const payload = {
      slug,
      event_id: eventId,
      name: String(formData.get('name') ?? ''),
      email: String(formData.get('email') ?? ''),
      phone: String(formData.get('phone') ?? ''),
      consent: formData.get('consent') === 'on',
      attendance_preference:
        format === 'hibrid'
          ? (String(formData.get('attendance_preference') ?? '') as 'fizic' | 'online')
          : undefined,
      website: String(formData.get('website') ?? ''),
      tracking: citesteTracking(new URLSearchParams(window.location.search), {
        referrer: document.referrer || undefined,
        landingPage: window.location.pathname,
      }),
    }

    // Aceeași schemă ca pe server: greșelile de completare se văd fără drum dus-întors.
    const local = inscriereSchema.safeParse(payload)
    if (!local.success) {
      const out: Erori = {}
      for (const issue of local.error.issues) {
        const cheie = issue.path.join('.') || 'form'
        out[cheie] ??= issue.message
      }
      setErori(out)
      return
    }

    setSeTrimite(true)
    try {
      const raspuns = await fetch('/api/inscriere', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const rezultat = await raspuns.json()

      if (!raspuns.ok || !rezultat.ok) {
        if (rezultat.errors) setErori(rezultat.errors)
        setEroareGenerala(rezultat.message ?? 'Ceva n-a mers. Încearcă din nou.')
        return
      }

      // Pixelul e montat doar dacă vizitatorul a acceptat cookie-urile; dacă
      // nu, apelul e inofensiv și rămâne doar semnalul de server.
      trimiteLeadPixel(eventId)

      router.push(`/inscriere-confirmata?w=${encodeURIComponent(slug)}`)
    } catch {
      setEroareGenerala('Nu am putut trimite formularul. Verifică conexiunea.')
    } finally {
      setSeTrimite(false)
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      // Eroarea de sub un câmp dispare imediat ce omul începe să-l corecteze.
      // Altfel rămâne acolo după ce a fost reparată și pagina pare stricată.
      onInput={stergeErori}
      className="flex flex-col gap-4">
      {/* Capcană pentru boți: ascunsă vizual și pentru cititoarele de ecran. */}
      <div aria-hidden className="hidden">
        <label htmlFor="website">Site web</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <Camp id="name" eticheta="Nume" eroare={erori.name}>
        <input
          id="name"
          name="name"
          required
          autoComplete="name"
          className="camp"
          aria-invalid={Boolean(erori.name)}
        />
      </Camp>

      <Camp id="email" eticheta="Email" eroare={erori.email}>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          className="camp"
          aria-invalid={Boolean(erori.email)}
        />
      </Camp>

      <Camp id="phone" eticheta="Telefon (opțional)" eroare={erori.phone}>
        <input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          className="camp"
          aria-invalid={Boolean(erori.phone)}
        />
      </Camp>

      {format === 'hibrid' && (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium">Cum vrei să participi?</legend>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="attendance_preference" value="fizic" defaultChecked />
            La fața locului
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="attendance_preference" value="online" />
            Online
          </label>
        </fieldset>
      )}

      <label className="flex items-start gap-3 text-sm">
        {/* Nebifat implicit — cerință GDPR, brief §10. */}
        <input type="checkbox" name="consent" className="mt-1" />
        <span>
          {textConsimtamant ?? 'Sunt de acord cu prelucrarea datelor mele personale.'}{' '}
          <a href="/confidentialitate" className="underline">
            Politica de confidențialitate
          </a>
        </span>
      </label>
      {erori.consent && <p className="text-destructive text-sm">{erori.consent}</p>}

      {eroareGenerala && (
        <p role="alert" className="text-destructive text-sm">
          {eroareGenerala}
        </p>
      )}

      <button
        type="submit"
        disabled={seTrimite}
        className="bg-primary text-primary-foreground min-h-[52px] w-full rounded-xl px-6 font-medium disabled:opacity-60"
      >
        {seTrimite ? 'Se trimite…' : eticheta}
      </button>

      <p className="text-muted-foreground text-center text-sm">
        Nu trimitem spam. Te poți dezabona oricând.
      </p>
    </form>
  )
}

function Camp({
  id,
  eticheta,
  eroare,
  children,
}: {
  id: string
  eticheta: string
  eroare?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {eticheta}
      </label>
      {children}
      {eroare && (
        <p className="text-destructive text-sm" role="alert">
          {eroare}
        </p>
      )}
    </div>
  )
}
