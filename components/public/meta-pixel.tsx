'use client'

import { usePathname } from 'next/navigation'
import Script from 'next/script'
import { useEffect, useRef } from 'react'

import { useConsimtamant } from '@/components/public/consimtamant'

declare global {
  interface Window {
    fbq?: ((...args: unknown[]) => void) & { queue?: unknown[] }
    _fbq?: unknown
  }
}

/**
 * Pixelul Meta, montat **numai după acceptarea cookie-urilor**.
 *
 * Stă în layout-ul public, nu în pagini: montat pe fiecare pagină în parte,
 * lipsea de pe cele la care nu s-a gândit nimeni — pagina cu lista a stat aşa,
 * fără pixel, deşi e chiar pagina pe care aterizează lumea din meniul
 * WordPress. O pagină publică nouă îl primeşte acum fără să-şi amintească
 * cineva.
 *
 * Trimite `PageView`. `ViewContent` îl trimite `UrmareteViewContent`, montat
 * doar unde înseamnă ceva, iar `Lead` îl trimite formularul, cu acelaşi
 * `event_id` ca evenimentul de server, ca Meta să le deduplice
 * (vezi lib/meta-capi.ts).
 */
export function MetaPixel({ pixelId }: { pixelId?: string }) {
  const consimtamant = useConsimtamant()
  const activ = Boolean(pixelId) && consimtamant?.marketing === true
  const cale = usePathname()
  const ultimaCale = useRef<string | null>(null)

  // Scriptul de mai jos raportează `PageView` o singură dată, la încărcare.
  // Stând în layout, nu se mai remontează la navigarea dintre pagini — iar
  // fără asta, cine intră pe listă şi de acolo pe o întâlnire e numărat o
  // singură dată, pe listă. Comparăm cu calea anterioară, nu cu „prima
  // randare": în dev, StrictMode rulează efectele de două ori şi ar trimite
  // un PageView în plus la fiecare pagină.
  useEffect(() => {
    if (!activ) return
    if (ultimaCale.current === null || ultimaCale.current === cale) {
      ultimaCale.current = cale
      return
    }
    ultimaCale.current = cale
    window.fbq?.('track', 'PageView')
  }, [activ, cale])

  if (!activ) return null

  return (
    <Script id="meta-pixel" strategy="afterInteractive">
      {`
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${pixelId}');
fbq('track', 'PageView');
      `}
    </Script>
  )
}

/**
 * `ViewContent` la jumătatea paginii.
 *
 * Separat de pixel fiindcă are alt domeniu de aplicare: pixelul trebuie să fie
 * peste tot, dar „a citit jumătate" înseamnă ceva doar pe pagina unei
 * întâlniri. Pe o listă sau pe pagina de mulţumire ar fi zgomot.
 *
 * Nu încarcă nimic singur: dacă vizitatorul n-a acceptat cookie-urile, `fbq`
 * nu există şi apelul nu se întâmplă.
 */
export function UrmareteViewContent() {
  useEffect(() => {
    let trimis = false
    const laScroll = () => {
      if (trimis) return
      const inaltime =
        document.documentElement.scrollHeight - window.innerHeight
      if (inaltime <= 0) return
      if (window.scrollY / inaltime >= 0.5) {
        trimis = true
        window.fbq?.('track', 'ViewContent')
        window.removeEventListener('scroll', laScroll)
      }
    }

    window.addEventListener('scroll', laScroll, { passive: true })
    return () => window.removeEventListener('scroll', laScroll)
  }, [])

  return null
}

/** Trimite `Lead` din browser, cu id-ul partajat cu evenimentul de server. */
export function trimiteLeadPixel(eventId: string) {
  window.fbq?.('track', 'Lead', {}, { eventID: eventId })
}
