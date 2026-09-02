const ZONA = 'Europe/Bucharest'

const data = new Intl.DateTimeFormat('ro-RO', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: ZONA,
})

const dataScurta = new Intl.DateTimeFormat('ro-RO', {
  day: 'numeric',
  month: 'short',
  timeZone: ZONA,
})

const ora = new Intl.DateTimeFormat('ro-RO', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: ZONA,
})

export function formateazaData(iso: string) {
  return data.format(new Date(iso))
}

export function formateazaDataScurta(iso: string) {
  return dataScurta.format(new Date(iso))
}

export function formateazaOra(iso: string) {
  return ora.format(new Date(iso))
}

/** „14 septembrie 2026, 19:00" */
export function formateazaDataOra(iso: string) {
  return `${formateazaData(iso)}, ${formateazaOra(iso)}`
}

/**
 * „45 de minute", dar „15 minute".
 *
 * În română, „de" se pune la numeralele de la 20 în sus, iar apoi după
 * numărul format din ultimele două cifre: 120 îl cere, 115 nu. Duratele
 * obişnuite sunt de 60 sau 90, unde n-ai cum să greşeşti — dar un atelier de
 * 15 minute ar fi ieşit „15 de minute".
 */
export function formateazaDurata(minute: number) {
  const ultimele = minute % 100
  const cuDe = ultimele === 0 || ultimele >= 20
  return `${minute}${cuDe ? ' de' : ''} minute`
}

export type Moneda = 'RON' | 'EUR'

/**
 * Cum se scrie fiecare monedă, după sumă.
 *
 * „150 lei" şi „150 €" — în română simbolul stă după număr, la amândouă. Nu
 * folosim `Intl.NumberFormat` cu `style: 'currency'`: acela scrie mereu
 * zecimalele, iar „150,00 lei" pe o pagină de prezentare arată a bon fiscal.
 */
const SIMBOL: Record<Moneda, string> = {
  RON: 'lei',
  EUR: '€',
}

export const ETICHETA_MONEDA: Record<Moneda, string> = {
  RON: 'lei',
  EUR: 'euro',
}

export function esteMoneda(v: string | null | undefined): v is Moneda {
  return v === 'RON' || v === 'EUR'
}

/** Moneda unui rând din bază, cu lei ca variantă sigură. */
export function monedaDin(v: string | null | undefined): Moneda {
  return esteMoneda(v) ? v : 'RON'
}

/**
 * „150 lei", „149,50 lei", „150 €".
 *
 * Fără zecimale la sumele rotunde. Virgulă, nu punct — aşa se scriu banii în
 * română, la orice monedă.
 */
export function formateazaPret(subunitate: number, moneda: Moneda = 'RON') {
  return `${sumaZecimala(subunitate)} ${SIMBOL[moneda]}`
}

/**
 * Doar numărul, pentru câmpul din admin.
 *
 * Aceeaşi regulă ca la afişare, ca precompletarea să arate „149,50", nu
 * „149,5" — altfel formularul pare că a pierdut o cifră.
 *
 * Împărţirea la o sută e aceeaşi la orice monedă din câte ne interesează, deci
 * funcţia nu are nevoie să ştie care e.
 */
export function sumaZecimala(subunitate: number) {
  const intreg = subunitate / 100
  return subunitate % 100 === 0
    ? String(intreg)
    : intreg.toFixed(2).replace('.', ',')
}

export const ETICHETA_FORMAT: Record<string, string> = {
  online: 'Online',
  fizic: 'La fața locului',
}

/**
 * „Webinar" e greșit pentru un atelier la care oamenii vin pe viu. Cuvântul se
 * schimbă după format, ca bara de sus și supratitlul să nu contrazică pagina.
 */
export function numesteEvenimentul(format: string): string {
  return format === 'online' ? 'Webinar' : 'Eveniment'
}
