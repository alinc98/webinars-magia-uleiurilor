'use client'

import { usePathname } from 'next/navigation'
import Script from 'next/script'
import { useEffect, useRef } from 'react'

import { useConsimtamant } from '@/components/public/consimtamant'

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

/**
 * Google Analytics 4, cu Consent Mode v2.
 *
 * Spre deosebire de pixelul Meta, scriptul se încarcă de la început — dar cu
 * toate semnalele pe `denied`. În starea aia GA4 nu pune niciun cookie; trimite
 * doar semnale anonime, din care Google estimează statistic ce lipsește. Fără
 * asta, cine refuză dispare complet din rapoarte, iar în România refuză destui
 * cât să conteze.
 *
 * Promisiunea din banner rămâne adevărată: „fără acceptul tău nu se încarcă
 * niciun cookie". Consent Mode chiar asta face — separă încărcarea scriptului
 * de scrierea cookie-urilor.
 *
 * Totul într-un singur script inline, inclusiv injectarea lui `gtag.js`, ca
 * ordinea să fie garantată: semnalele trebuie să ajungă în `dataLayer`
 * înaintea momentului în care Google îl citește. Două etichete `<Script>`
 * separate n-ar da nicio garanție de ordine.
 */
export function GA4({ id }: { id?: string }) {
  const consimtamant = useConsimtamant()
  const cale = usePathname()
  const ultimaCale = useRef<string | null>(null)

  // Actualizarea, la răspunsul omului. `null` înseamnă că n-a răspuns încă:
  // rămân valorile implicite, adică refuz.
  useEffect(() => {
    if (!id || !consimtamant) return

    window.gtag?.('consent', 'update', {
      analytics_storage: consimtamant.analiza ? 'granted' : 'denied',
      ad_storage: consimtamant.marketing ? 'granted' : 'denied',
      ad_user_data: consimtamant.marketing ? 'granted' : 'denied',
      ad_personalization: consimtamant.marketing ? 'granted' : 'denied',
    })
  }, [id, consimtamant])

  // `gtag('config')` raportează o singură vizualizare, la încărcare. Scriptul
  // stă în layout şi nu se remontează la navigare — aceeaşi capcană ca la
  // Meta, unde am pierdut vizualizările dintre pagini. Comparăm cu calea
  // anterioară, nu cu „prima randare": în dev, StrictMode rulează efectele de
  // două ori şi ar raporta câte una în plus.
  useEffect(() => {
    if (!id) return

    if (ultimaCale.current === null || ultimaCale.current === cale) {
      ultimaCale.current = cale
      return
    }
    ultimaCale.current = cale
    window.gtag?.('event', 'page_view')
  }, [id, cale])

  if (!id) return null

  return (
    <Script id="ga4" strategy="afterInteractive">
      {`
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
gtag('consent', 'default', {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
  wait_for_update: 500
});
gtag('js', new Date());
gtag('config', '${id}');
var s = document.createElement('script');
s.async = true;
s.src = 'https://www.googletagmanager.com/gtag/js?id=${id}';
document.head.appendChild(s);
      `}
    </Script>
  )
}
