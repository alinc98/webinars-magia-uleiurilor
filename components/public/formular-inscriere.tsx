'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { BifaConsimtamant, Camp } from '@/components/brand/campuri'
import { Buton } from '@/components/brand/buton'
import { trimiteLeadPixel } from '@/components/public/meta-pixel'
import { LINKURI } from '@/lib/linkuri'
import { inscriereReusita, type DateEvenimentGa4 } from '@/lib/ga4'
import { citesteTracking } from '@/lib/utm'
import { inscriereSchema } from '@/lib/validations/inscriere'

type Props = {
  slug: string
  /** Ce raportăm către GA4 la înscriere reușită. */
  dateGa4: DateEvenimentGa4
  /** Textul acceptat, venit din admin cu versionare (brief §10). */
  textConsimtamant?: string
  eticheta?: string
}

type Erori = Record<string, string>

export function FormularInscriere({
  slug,
  dateGa4,
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
      inscriereReusita(dateGa4)

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

      <Camp
        id="name"
        name="name"
        eticheta="Nume"
        required
        autoComplete="name"
        eroare={erori.name}
        hint="Așa te salut în emailuri."
      />

      <Camp
        id="email"
        name="email"
        type="email"
        eticheta="Email"
        required
        autoComplete="email"
        inputMode="email"
        eroare={erori.email}
        hint="Aici primești linkul de acces."
      />

      <Camp
        id="phone"
        name="phone"
        type="tel"
        eticheta="Telefon"
        required
        autoComplete="tel"
        inputMode="tel"
        eroare={erori.phone}
      />


      <BifaConsimtamant id="consent" name="consent" eroare={erori.consent}>
        {textConsimtamant ?? 'Sunt de acord cu prelucrarea datelor mele personale.'}{' '}
        <a href={LINKURI.confidentialitate} target="_blank" rel="noopener noreferrer">
          Politica de confidențialitate
        </a>
      </BifaConsimtamant>

      {eroareGenerala && (
        <p role="alert" className="text-body-sm text-[#a62b1d]">
          {eroareGenerala}
        </p>
      )}

      <Buton type="submit" varianta="cta" marime="lg" latimeIntreaga disabled={seTrimite}>
        {seTrimite ? 'Se trimite…' : eticheta}
      </Buton>

      <p className="text-caption text-text-muted text-center">
        Nu trimitem spam. Te poți dezabona oricând.
      </p>
    </form>
  )
}
