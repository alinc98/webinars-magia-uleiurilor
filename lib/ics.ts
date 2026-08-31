import type { Sesiune } from '@/lib/program'

/**
 * Fișier .ics pentru „adaugă în calendar".
 *
 * Scris de mână, nu cu o bibliotecă: formatul de care avem nevoie e o duzină de
 * linii, iar dependințele de calendar au obiceiul de a scăpa escaparea.
 *
 * Datele se scriu în UTC (sufixul Z), deci nu e nevoie de blocul VTIMEZONE și
 * ora apare corect indiferent de fusul dispozitivului.
 *
 * Un eveniment pe mai multe zile scrie câte un `VEVENT` per întâlnire, nu unul
 * singur întins peste tot: altfel un atelier de trei dimineți ar bloca trei
 * zile întregi în calendarul omului, nopțile incluse. UID-urile primesc un
 * sufix — fără el, calendarele ar suprascrie intrările una peste alta,
 * considerându-le versiuni ale aceluiași eveniment.
 */

type OptiuniIcs = {
  uid: string
  title: string
  description?: string
  /** Una sau mai multe întâlniri. Fiecare devine un `VEVENT` separat. */
  sesiuni: Sesiune[]
  /** Zoom la online; adresa completă la evenimentele fizice. */
  location?: string
  url?: string
  organizerName?: string
  organizerEmail?: string
}

function laUtc(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '')
}

/** Virgulele, punctele și virgulă și backslash-urile au înțeles în iCalendar. */
function escapeaza(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
}

/** RFC 5545 cere linii de maximum 75 de octeți, continuate cu un spațiu. */
function plieaza(linie: string): string {
  const octeti = Buffer.from(linie, 'utf8')
  if (octeti.length <= 75) return linie

  const bucati: string[] = []
  let start = 0
  while (start < octeti.length) {
    let lungime = Math.min(start === 0 ? 75 : 74, octeti.length - start)
    // Nu tăiem în mijlocul unui caracter multi-octet: ă, â, î, ș, ț ocupă doi.
    while (lungime > 1) {
      const felie = octeti.subarray(start, start + lungime)
      if (Buffer.from(felie.toString('utf8'), 'utf8').length === felie.length)
        break
      lungime -= 1
    }
    bucati.push(
      (start === 0 ? '' : ' ') +
        octeti.subarray(start, start + lungime).toString('utf8'),
    )
    start += lungime
  }
  return bucati.join('\r\n')
}

export function construiesteIcs(optiuni: OptiuniIcs): string {
  const acum = laUtc(new Date())

  const linii = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Magia Uleiurilor//Webinarii//RO',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ]

  optiuni.sesiuni.forEach((sesiune, i) => {
    // Titlul zilei intră în `SUMMARY`, altfel calendarul ar arăta trei intrări
    // identice şi omul n-ar şti care e care.
    const titlu =
      optiuni.sesiuni.length > 1
        ? `${optiuni.title} — ${sesiune.label?.trim() || `Ziua ${i + 1}`}`
        : optiuni.title

    linii.push(
      'BEGIN:VEVENT',
      `UID:${optiuni.sesiuni.length > 1 ? `${i + 1}-` : ''}${optiuni.uid}`,
      `DTSTAMP:${acum}`,
      `DTSTART:${laUtc(new Date(sesiune.starts_at))}`,
      `DTEND:${laUtc(new Date(sesiune.ends_at))}`,
      `SUMMARY:${escapeaza(titlu)}`,
    )

    if (optiuni.description)
      linii.push(`DESCRIPTION:${escapeaza(optiuni.description)}`)
    if (optiuni.location) linii.push(`LOCATION:${escapeaza(optiuni.location)}`)
    if (optiuni.url) linii.push(`URL:${optiuni.url}`)
    if (optiuni.organizerEmail) {
      const nume = optiuni.organizerName
        ? `;CN=${escapeaza(optiuni.organizerName)}`
        : ''
      linii.push(`ORGANIZER${nume}:mailto:${optiuni.organizerEmail}`)
    }

    linii.push(
      'STATUS:CONFIRMED',
      'BEGIN:VALARM',
      'TRIGGER:-PT1H',
      'ACTION:DISPLAY',
      `DESCRIPTION:${escapeaza(titlu)}`,
      'END:VALARM',
      'END:VEVENT',
    )
  })

  linii.push('END:VCALENDAR')

  return linii.map(plieaza).join('\r\n') + '\r\n'
}

/**
 * Link „adaugă în Google Calendar", pentru cine nu vrea fișierul.
 *
 * Google primeşte un singur eveniment printr-un link de tip `TEMPLATE`, deci
 * la un atelier pe mai multe zile duce doar prima întâlnire. De-aia pagina de
 * mulţumire arată butonul ăsta numai când e o singură zi — altfel omul ar fi
 * plecat convins că şi-a pus tot atelierul în calendar.
 */
export function linkGoogleCalendar(optiuni: OptiuniIcs): string {
  const prima = optiuni.sesiuni[0]
  if (!prima) return ''

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: optiuni.title,
    dates: `${laUtc(new Date(prima.starts_at))}/${laUtc(new Date(prima.ends_at))}`,
  })
  if (optiuni.description) params.set('details', optiuni.description)
  if (optiuni.location) params.set('location', optiuni.location)

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}
