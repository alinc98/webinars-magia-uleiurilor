'use client'

import Script from 'next/script'
import { useEffect } from 'react'

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
 * Evenimentele:
 * - `PageView` la încărcare
 * - `ViewContent` la 50% scroll
 * - `Lead` îl trimite formularul, cu același `event_id` ca evenimentul de
 *   server, ca Meta să le deduplice (vezi lib/meta-capi.ts)
 */
export function MetaPixel({ pixelId }: { pixelId?: string }) {
  const consimtamant = useConsimtamant()
  const activ = Boolean(pixelId) && consimtamant?.marketing === true

  useEffect(() => {
    if (!activ) return

    let trimis = false
    const laScroll = () => {
      if (trimis) return
      const inaltime = document.documentElement.scrollHeight - window.innerHeight
      if (inaltime <= 0) return
      if (window.scrollY / inaltime >= 0.5) {
        trimis = true
        window.fbq?.('track', 'ViewContent')
        window.removeEventListener('scroll', laScroll)
      }
    }

    window.addEventListener('scroll', laScroll, { passive: true })
    return () => window.removeEventListener('scroll', laScroll)
  }, [activ])

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

/** Trimite `Lead` din browser, cu id-ul partajat cu evenimentul de server. */
export function trimiteLeadPixel(eventId: string) {
  window.fbq?.('track', 'Lead', {}, { eventID: eventId })
}
