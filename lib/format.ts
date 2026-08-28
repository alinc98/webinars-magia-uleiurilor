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

export const ETICHETA_FORMAT: Record<string, string> = {
  online: 'Online',
  fizic: 'La fața locului',
  hibrid: 'Online și la fața locului',
}

/**
 * „Webinar" e greșit pentru un atelier la care oamenii vin pe viu. Cuvântul se
 * schimbă după format, ca bara de sus și supratitlul să nu contrazică pagina.
 */
export function numesteEvenimentul(format: string): string {
  return format === 'online' ? 'Webinar' : 'Eveniment'
}
