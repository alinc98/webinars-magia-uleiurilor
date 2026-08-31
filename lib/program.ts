/**
 * Programul unui eveniment: una sau mai multe întâlniri.
 *
 * Tot ce ține de scris programul pe ecran stă aici, nu în `lib/format.ts`:
 * regulile sunt câteva și se leagă între ele, iar fișierul celălalt ar fi
 * devenit un depozit.
 *
 * Nimic de aici nu depinde de fusul procesului sau al browserului. Orele se
 * citesc prin `inOraRomaniei`, deci un eveniment arată la fel pe Vercel, pe
 * laptop și în telefonul cuiva aflat în altă țară.
 */

import { inOraRomaniei, NUME_LUNI, type PartiOra } from '@/lib/ora'

export type Sesiune = {
  starts_at: string
  ends_at: string
  label?: string | null
}

/**
 * Sesiunile, dintr-un `jsonb` sau dintr-un rând adus prin PostgREST.
 *
 * Sortăm chiar dacă view-ul o face deja: în emailuri sesiunile vin ca resursă
 * încorporată, unde ordinea nu e garantată. O listă de zile în altă ordine
 * decât cea cronologică n-ar fi o eroare vizibilă, ci una citită greșit.
 */
export function sesiuniDin(brut: unknown): Sesiune[] {
  if (!Array.isArray(brut)) return []

  return (brut as Sesiune[])
    .filter(
      (s) =>
        s && typeof s.starts_at === 'string' && typeof s.ends_at === 'string',
    )
    .slice()
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at))
}

const doua = (n: number) => String(n).padStart(2, '0')

function ceas(p: PartiOra) {
  return `${doua(p.ora)}:${doua(p.minut)}`
}

/** Numărul de zile calendaristice între două date, în ora României. */
function zileIntre(a: PartiOra, b: PartiOra) {
  const zi = (p: PartiOra) => Date.UTC(p.an, p.luna - 1, p.zi)
  return Math.round((zi(b) - zi(a)) / 86_400_000)
}

/**
 * În română, „de" se pune la numeralele de la 20 în sus, apoi după numărul
 * format din ultimele două cifre. Aceeași regulă ca la `formateazaDurata`.
 */
function numeral(n: number, unu: string, multe: string) {
  if (n === 1) return `1 ${unu}`
  const ultimele = n % 100
  const cuDe = ultimele === 0 || ultimele >= 20
  return `${n}${cuDe ? ' de' : ''} ${multe}`
}

/** „19:00–20:30" */
export function formateazaInterval(s: Sesiune) {
  return `${ceas(inOraRomaniei(new Date(s.starts_at)))}–${ceas(inOraRomaniei(new Date(s.ends_at)))}`
}

/**
 * Intervalul de zile, cât se poate de scurt fără să devină ambiguu.
 *
 * „23–25 septembrie 2026", nu „23 septembrie 2026 – 25 septembrie 2026": luna
 * și anul se repetă doar când chiar se schimbă.
 */
function intervalZile(prima: PartiOra, ultima: PartiOra) {
  const zi = (p: PartiOra) => `${p.zi} ${NUME_LUNI[p.luna - 1]} ${p.an}`

  if (zileIntre(prima, ultima) === 0) return zi(prima)
  if (prima.an !== ultima.an) return `${zi(prima)} – ${zi(ultima)}`
  if (prima.luna !== ultima.luna)
    return `${prima.zi} ${NUME_LUNI[prima.luna - 1]} – ${zi(ultima)}`
  return `${prima.zi}–${ultima.zi} ${NUME_LUNI[ultima.luna - 1]} ${ultima.an}`
}

/** Toate întâlnirile încep și se termină la aceleași ore. */
function aceleasiOre(parti: { start: PartiOra; final: PartiOra }[]) {
  const prima = parti[0]
  return parti.every(
    (p) =>
      p.start.ora === prima.start.ora &&
      p.start.minut === prima.start.minut &&
      p.final.ora === prima.final.ora &&
      p.final.minut === prima.final.minut,
  )
}

/** Zilele se țin lanț: 23, 24, 25. */
function zileLaRand(parti: { start: PartiOra }[]) {
  return parti.every(
    (p, i) => i === 0 || zileIntre(parti[i - 1].start, p.start) === 1,
  )
}

/**
 * Doar zilele, fără ore: „23–25 septembrie 2026".
 *
 * Pentru arhivă, unde ora la care a început ceva încheiat nu mai interesează
 * pe nimeni.
 */
export function formateazaZile(sesiuni: Sesiune[]): string {
  if (sesiuni.length === 0) return ''
  return intervalZile(
    inOraRomaniei(new Date(sesiuni[0].starts_at)),
    inOraRomaniei(new Date(sesiuni[sesiuni.length - 1].starts_at)),
  )
}

/**
 * Rândul de sub titlu, pe carduri și în insigne.
 *
 * Trei forme, încercate în ordine:
 *
 *   o întâlnire                    23 septembrie 2026, 19:00–20:30
 *   zile la rând, aceleași ore     23–25 septembrie 2026 · 10:00–14:00
 *   orice altceva                  23 septembrie – 5 octombrie 2026 · 3 întâlniri
 *
 * A doua e cazul obișnuit al unui atelier pe zile și merită să arate bine, nu
 * doar să fie corectă.
 */
export function formateazaProgramScurt(sesiuni: Sesiune[]): string {
  if (sesiuni.length === 0) return ''

  const parti = sesiuni.map((s) => ({
    start: inOraRomaniei(new Date(s.starts_at)),
    final: inOraRomaniei(new Date(s.ends_at)),
  }))
  const zile = intervalZile(parti[0].start, parti[parti.length - 1].start)

  if (sesiuni.length === 1) return `${zile}, ${formateazaInterval(sesiuni[0])}`
  if (aceleasiOre(parti) && zileLaRand(parti))
    return `${zile} · ${formateazaInterval(sesiuni[0])}`

  return `${zile} · ${numeral(sesiuni.length, 'întâlnire', 'întâlniri')}`
}

/**
 * Rândurile din tabelul de detalii și din emailuri: câte o linie per întâlnire.
 *
 * Titlul e eticheta scrisă în admin, sau „Ziua N" când lipsește. La un
 * eveniment cu o singură întâlnire nu are ce titlu să poarte — cine afișează
 * lista îl ignoră.
 */
export function formateazaProgramLung(
  sesiuni: Sesiune[],
): { titlu: string; interval: string }[] {
  return sesiuni.map((s, i) => {
    const p = inOraRomaniei(new Date(s.starts_at))
    return {
      titlu: s.label?.trim() || `Ziua ${i + 1}`,
      interval: `${p.zi} ${NUME_LUNI[p.luna - 1]} ${p.an}, ${formateazaInterval(s)}`,
    }
  })
}

/** Minutele însumate ale tuturor întâlnirilor. */
export function minuteTotal(sesiuni: Sesiune[]): number {
  return sesiuni.reduce(
    (t, s) =>
      t +
      (new Date(s.ends_at).getTime() - new Date(s.starts_at).getTime()) /
        60_000,
    0,
  )
}

/**
 * Cât durează, însumat: „90 de minute", „12 ore", „9 h 30 min".
 *
 * Doar durata, fără numărul de întâlniri — pe acela îl poartă deja
 * `formateazaProgramScurt`, iar cele două se afişează mereu una lângă alta.
 * Prima variantă îl scria în amândouă şi ieşea „5–19 octombrie · 3 întâlniri ·
 * 3 întâlniri · 9 h 30 min".
 *
 * Cine are nevoie de „în total" îl adaugă la locul afişării: în emailuri, unde
 * rândul se cheamă deja aşa, ar fi ieşit „În total: 12 ore în total".
 */
export function durataTotala(sesiuni: Sesiune[]): string {
  if (sesiuni.length === 0) return ''

  const minute = Math.round(minuteTotal(sesiuni))
  if (minute % 60 !== 0 && minute < 120)
    return numeral(minute, 'minut', 'minute')

  const ore = minute / 60
  return Number.isInteger(ore)
    ? numeral(ore, 'oră', 'ore')
    : `${Math.floor(ore)} h ${minute % 60} min`
}

/**
 * Rândurile de program pentru fişa din emailuri.
 *
 * O singură întâlnire scoate exact ce scotea şi înainte — „Când" şi „Durată" —
 * deci vocea rescrisă a confirmării rămâne neatinsă. Mai multe scot câte un
 * rând per zi, plus un total: la un atelier de trei dimineţi, un singur rând
 * „Durată: 720 de minute" ar fi fost corect şi nefolositor.
 */
export function randuriProgram(sesiuni: Sesiune[]): [string, string][] {
  if (sesiuni.length === 0) return []

  const zile = formateazaProgramLung(sesiuni)

  if (sesiuni.length === 1) {
    return [
      ['Când', zile[0].interval],
      ['Durată', durataTotala(sesiuni)],
    ]
  }

  return [
    ...zile.map((z): [string, string] => [z.titlu, z.interval]),
    ['În total', durataTotala(sesiuni)],
  ]
}

/** Prima întâlnire — cea spre care pleacă reamintirile. */
export function primaSesiune(sesiuni: Sesiune[]): Sesiune | undefined {
  return sesiuni[0]
}

export type StareProgram =
  | { stare: 'inainte'; sesiune: Sesiune; index: number }
  | { stare: 'in_curs'; sesiune: Sesiune; index: number }
  | { stare: 'trecut' }

/**
 * Unde ne aflăm în program, pentru numărătoarea inversă din bara de sus.
 *
 * Bara număra până acum spre `starts_at`, adică spre prima întâlnire. La un
 * eveniment de trei zile ar fi scris „următoarea se anunță în curând" în seara
 * primei zile, cu două zile de atelier încă în față.
 */
export function stareaProgramului(
  sesiuni: Sesiune[],
  acum: number = Date.now(),
): StareProgram {
  const index = sesiuni.findIndex((s) => new Date(s.ends_at).getTime() > acum)
  if (index === -1) return { stare: 'trecut' }

  const sesiune = sesiuni[index]
  const inceputa = new Date(sesiune.starts_at).getTime() <= acum

  return { stare: inceputa ? 'in_curs' : 'inainte', sesiune, index }
}
