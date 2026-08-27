/**
 * Fișier .ics pentru „adaugă în calendar".
 *
 * Scris de mână, nu cu o bibliotecă: formatul de care avem nevoie e o duzină de
 * linii, iar dependințele de calendar au obiceiul de a scăpa escaparea.
 *
 * Datele se scriu în UTC (sufixul Z), deci nu e nevoie de blocul VTIMEZONE și
 * ora apare corect indiferent de fusul dispozitivului.
 */

type OptiuniIcs = {
  uid: string
  title: string
  description?: string
  startsAt: string
  durationMin: number
  /** Zoom la online; adresa completă la evenimentele fizice. */
  location?: string
  url?: string
  organizerName?: string
  organizerEmail?: string
}

function laUtc(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
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
      if (Buffer.from(felie.toString('utf8'), 'utf8').length === felie.length) break
      lungime -= 1
    }
    bucati.push((start === 0 ? '' : ' ') + octeti.subarray(start, start + lungime).toString('utf8'))
    start += lungime
  }
  return bucati.join('\r\n')
}

export function construiesteIcs(optiuni: OptiuniIcs): string {
  const start = new Date(optiuni.startsAt)
  const end = new Date(start.getTime() + optiuni.durationMin * 60_000)

  const linii = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Magia Uleiurilor//Webinarii//RO',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${optiuni.uid}`,
    `DTSTAMP:${laUtc(new Date())}`,
    `DTSTART:${laUtc(start)}`,
    `DTEND:${laUtc(end)}`,
    `SUMMARY:${escapeaza(optiuni.title)}`,
  ]

  if (optiuni.description) linii.push(`DESCRIPTION:${escapeaza(optiuni.description)}`)
  if (optiuni.location) linii.push(`LOCATION:${escapeaza(optiuni.location)}`)
  if (optiuni.url) linii.push(`URL:${optiuni.url}`)
  if (optiuni.organizerEmail) {
    const nume = optiuni.organizerName ? `;CN=${escapeaza(optiuni.organizerName)}` : ''
    linii.push(`ORGANIZER${nume}:mailto:${optiuni.organizerEmail}`)
  }

  linii.push(
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT1H',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeaza(optiuni.title)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  )

  return linii.map(plieaza).join('\r\n') + '\r\n'
}

/** Link „adaugă în Google Calendar", pentru cine nu vrea fișierul. */
export function linkGoogleCalendar(optiuni: OptiuniIcs): string {
  const start = new Date(optiuni.startsAt)
  const end = new Date(start.getTime() + optiuni.durationMin * 60_000)

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: optiuni.title,
    dates: `${laUtc(start)}/${laUtc(end)}`,
  })
  if (optiuni.description) params.set('details', optiuni.description)
  if (optiuni.location) params.set('location', optiuni.location)

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}
