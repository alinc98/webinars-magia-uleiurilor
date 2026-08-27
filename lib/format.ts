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

export const ETICHETA_FORMAT: Record<string, string> = {
  online: 'Online',
  fizic: 'La fața locului',
  hibrid: 'Online și la fața locului',
}
