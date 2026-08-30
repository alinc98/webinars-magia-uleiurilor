/**
 * Conversii între „ora de perete" românească și momentul absolut.
 *
 * Câmpul `datetime-local` trimitea un șir fără fus — „2026-09-23T22:00" — iar
 * `new Date()` îl citea în fusul procesului. Pe Vercel procesul e pe UTC, deci
 * ora scrisă de om se salva ca UTC și reapărea cu trei ore mai târziu. Local,
 * unde procesul e pe ora României, ieșea corect: exact felul de eroare care
 * trece de testele de pe laptop.
 *
 * Aici nu depindem nici de fusul serverului, nici de al browserului. Omul
 * lucrează în ora României, indiferent unde se află, iar în bază ajunge un
 * moment absolut.
 */

const ZONA = 'Europe/Bucharest'

export type PartiOra = {
  an: number
  luna: number
  zi: number
  ora: number
  minut: number
}

const FORMATOR = new Intl.DateTimeFormat('en-CA', {
  timeZone: ZONA,
  hour12: false,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
})

/** Momentul absolut → ora de perete din România. */
export function inOraRomaniei(instant: Date): PartiOra {
  const p = Object.fromEntries(
    FORMATOR.formatToParts(instant).map((x) => [x.type, x.value])
  ) as Record<string, string>

  return {
    an: Number(p.year),
    luna: Number(p.month),
    zi: Number(p.day),
    // Unele implementări dau „24" pentru miezul nopții.
    ora: Number(p.hour) % 24,
    minut: Number(p.minute),
  }
}

function caUtc(p: PartiOra) {
  return Date.UTC(p.an, p.luna - 1, p.zi, p.ora, p.minut)
}

/**
 * Ora de perete din România → momentul absolut.
 *
 * Pornim presupunând că e UTC și corectăm cu diferența observată. A doua
 * trecere e pentru schimbarea de oră: prima corecție poate muta momentul peste
 * graniță, unde offsetul e altul.
 */
export function dinOraRomaniei(p: PartiOra): Date {
  const tinta = caUtc(p)
  let ts = tinta

  for (let i = 0; i < 2; i++) {
    ts += tinta - caUtc(inOraRomaniei(new Date(ts)))
  }

  return new Date(ts)
}

const LUNI = [
  'ianuarie',
  'februarie',
  'martie',
  'aprilie',
  'mai',
  'iunie',
  'iulie',
  'august',
  'septembrie',
  'octombrie',
  'noiembrie',
  'decembrie',
]

/** „24 septembrie 2026, 01:00" */
export function scrieOra(p: PartiOra) {
  const doua = (n: number) => String(n).padStart(2, '0')
  return `${p.zi} ${LUNI[p.luna - 1]} ${p.an}, ${doua(p.ora)}:${doua(p.minut)}`
}

export const NUME_LUNI = LUNI

/** Luni prima, ca în calendarul românesc. */
export const ZILE_SCURTE = ['L', 'Ma', 'Mi', 'J', 'V', 'S', 'D']

/**
 * Zilele afișate într-o grilă de lună: zilele lunii, plus atâtea celule goale
 * la început cât să cadă prima zi în dreptul zilei ei din săptămână.
 */
export function grilaLunii(an: number, luna: number): (number | null)[] {
  const prima = new Date(Date.UTC(an, luna - 1, 1))
  // getUTCDay(): 0 = duminică. Vrem 0 = luni.
  const decalaj = (prima.getUTCDay() + 6) % 7
  const zile = new Date(Date.UTC(an, luna, 0)).getUTCDate()

  return [
    ...Array.from({ length: decalaj }, () => null),
    ...Array.from({ length: zile }, (_, i) => i + 1),
  ]
}
