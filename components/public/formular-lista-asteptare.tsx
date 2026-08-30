'use client'

import { useState } from 'react'

import { intratPeListaAsteptare } from '@/lib/ga4'
import { LINKURI } from '@/lib/linkuri'
import { citesteTracking } from '@/lib/utm'
import { listaAsteptareSchema } from '@/lib/validations/inscriere'

type Props = {
  /** Setat doar când e vorba de un eveniment plin, nu de starea goală a hub-ului. */
  webinarSlug?: string
  eticheta?: string
}

export function FormularListaAsteptare({
  webinarSlug,
  eticheta = 'Anunță-mă',
}: Props) {
  const [stare, setStare] = useState<'formular' | 'trimite' | 'gata'>('formular')
  const [erori, setErori] = useState<Record<string, string>>({})
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
    const payload = {
      name: String(formData.get('name') ?? ''),
      email: String(formData.get('email') ?? ''),
      consent: formData.get('consent') === 'on',
      webinar_slug: webinarSlug,
      website: String(formData.get('website') ?? ''),
      tracking: citesteTracking(new URLSearchParams(window.location.search), {
        referrer: document.referrer || undefined,
        landingPage: window.location.pathname,
      }),
    }

    const local = listaAsteptareSchema.safeParse(payload)
    if (!local.success) {
      const out: Record<string, string> = {}
      for (const issue of local.error.issues) {
        out[issue.path.join('.') || 'form'] ??= issue.message
      }
      setErori(out)
      return
    }

    setStare('trimite')
    try {
      const raspuns = await fetch('/api/lista-asteptare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const rezultat = await raspuns.json()

      if (!raspuns.ok || !rezultat.ok) {
        if (rezultat.errors) setErori(rezultat.errors)
        setEroareGenerala(rezultat.message ?? 'Ceva n-a mers. Încearcă din nou.')
        setStare('formular')
        return
      }

      intratPeListaAsteptare(webinarSlug)
      setStare('gata')
    } catch {
      setEroareGenerala('Nu am putut trimite formularul. Verifică conexiunea.')
      setStare('formular')
    }
  }

  if (stare === 'gata') {
    return (
      <p role="status" className="text-sm">
        Gata. Îți scriem imediat ce se anunță ceva.
      </p>
    )
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      // Eroarea de sub un câmp dispare imediat ce omul începe să-l corecteze.
      // Altfel rămâne acolo după ce a fost reparată și pagina pare stricată.
      onInput={stergeErori}
      className="flex flex-col gap-3">
      <div aria-hidden className="hidden">
        <input name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="wl-name" className="text-sm font-medium">
          Nume
        </label>
        <input id="wl-name" name="name" required autoComplete="name" className="camp" />
        {erori.name && <p className="text-destructive text-sm">{erori.name}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="wl-email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="wl-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="camp"
        />
        {erori.email && <p className="text-destructive text-sm">{erori.email}</p>}
      </div>

      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" name="consent" className="mt-1" />
        <span>
          Sunt de acord cu prelucrarea datelor conform{' '}
          <a
            href={LINKURI.confidentialitate}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            politicii de confidențialitate
          </a>
          .
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
        disabled={stare === 'trimite'}
        className="bg-secondary text-secondary-foreground min-h-[48px] rounded-xl px-6 font-medium disabled:opacity-60"
      >
        {stare === 'trimite' ? 'Se trimite…' : eticheta}
      </button>
    </form>
  )
}
