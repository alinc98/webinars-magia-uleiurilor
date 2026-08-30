/**
 * Evenimentele trimise către GA4.
 *
 * Toate trec pe aici, nu direct prin `window.gtag`, din două motive: numele şi
 * parametrii sunt un contract cu rapoartele — o greşeală de tastare produce un
 * eveniment nou, tăcut, care arată ca o scădere — iar dacă vreodată se schimbă
 * numele (vezi PLAN-GA4.md §2, ciocnirea cu site-ul mare), se schimbă într-un
 * singur loc.
 *
 * `scroll`, `click`, `form_start` şi `form_submit` nu apar aici: le trimite
 * singură măsurarea îmbunătățită, care e pornită pe fluxul de date.
 */

type Parametri = Record<string, string | number | boolean | undefined>

function trimite(nume: string, parametri?: Parametri) {
  if (typeof window === 'undefined') return
  // Lipseşte când n-a fost configurat `NEXT_PUBLIC_GA4_ID`. Tăcere, nu eroare:
  // măsurarea nu are voie să strice pagina.
  window.gtag?.('event', nume, parametri)
}

export type DateEvenimentGa4 = {
  slug: string
  titlu: string
  format: 'online' | 'fizic'
  /** În bani. Lipseşte la evenimentele gratuite. */
  pretBani?: number | null
  locuriRamase?: number | null
}

function parametriEveniment(e: DateEvenimentGa4): Parametri {
  return {
    webinar_slug: e.slug,
    webinar_title: e.titlu,
    webinar_format: e.format,
    // În lei, nu în bani: rapoartele se citesc de oameni.
    webinar_price: e.pretBani != null ? e.pretBani / 100 : 0,
    locuri_ramase: e.locuriRamase ?? undefined,
  }
}

/** Deschiderea paginii unei întâlniri. */
export function vezuiEveniment(e: DateEvenimentGa4) {
  trimite('view_event', parametriEveniment(e))
}

/**
 * Înscriere reușită. Marcat ca eveniment-cheie în GA4.
 *
 * `value` şi `currency` sunt recunoscute din start, fără declarare. La
 * evenimentele gratuite trimitem 0: mai bine o valoare explicită decât una
 * lipsă, care ar face media să pară mai mare decât e.
 */
export function inscriereReusita(e: DateEvenimentGa4) {
  trimite('generate_lead', {
    ...parametriEveniment(e),
    value: e.pretBani != null ? e.pretBani / 100 : 0,
    currency: 'RON',
  })
}

/** Lista de așteptare — a unui eveniment plin, sau cea generală. */
export function intratPeListaAsteptare(slug?: string) {
  trimite('join_waitlist', { webinar_slug: slug ?? 'general' })
}

/** Adăugarea în calendar, de pe pagina de mulțumire. */
export function adaugatInCalendar(metoda: 'google' | 'ics') {
  trimite('add_to_calendar', { metoda })
}
