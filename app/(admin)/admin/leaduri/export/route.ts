import { redirect } from 'next/navigation'

import { citesteFiltre, interogheazaLeaduri } from '@/lib/leaduri/filtre'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminUser } from '@/lib/supabase/auth'

type Formatare = 'text' | 'data' | 'dabu'

const COLOANE: readonly (readonly [string, string, Formatare])[] = [
  ['name', 'Nume', 'text'],
  ['email', 'Email', 'text'],
  ['phone', 'Telefon', 'text'],
  ['status', 'Status', 'text'],
  ['tags', 'Tag-uri', 'text'],
  ['registrations_count', 'Înscrieri', 'text'],
  ['attended_count', 'Prezențe', 'text'],
  ['consent_marketing', 'Consimțământ', 'dabu'],
  ['consent_at', 'Data consimțământului', 'data'],
  ['unsubscribed_at', 'Dezabonat la', 'data'],
  ['first_utm_source', 'Sursă', 'text'],
  ['first_utm_campaign', 'Campanie', 'text'],
  ['created_at', 'Primul contact', 'data'],
] as const

/**
 * Excel deschide CSV-ul cu separator după setările regionale. Pe un Windows
 * românesc, virgula e separator zecimal, deci coloanele se lipesc. Linia
 * `sep=;` de la început îi spune explicit ce să folosească.
 */
const dataRo = new Intl.DateTimeFormat('ro-RO', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Europe/Bucharest',
})

function celula(valoare: unknown, formatare: Formatare = 'text'): string {
  if (valoare === null || valoare === undefined) return ''

  // Fișierul ăsta se deschide de un om, nu de un program: un timestamp ISO și
  // un `true` nu-i spun nimic.
  if (formatare === 'data') return `"${dataRo.format(new Date(String(valoare)))}"`
  if (formatare === 'dabu') return valoare ? '"da"' : '"nu"'

  const text = Array.isArray(valoare) ? valoare.join(', ') : String(valoare)
  return `"${text.replace(/"/g, '""')}"`
}

export async function GET(request: Request) {
  if (!(await getAdminUser())) redirect('/login')

  const url = new URL(request.url)
  const searchParams = Object.fromEntries(url.searchParams.entries())
  const filtre = citesteFiltre(searchParams)

  const { data, error } = await interogheazaLeaduri(filtre, true)
  if (error) return new Response('Nu am putut genera exportul.', { status: 500 })

  const randuri = [
    'sep=;',
    COLOANE.map(([, eticheta]) => celula(eticheta)).join(';'),
    ...(data ?? []).map((c) =>
      COLOANE.map(([cheie, , formatare]) =>
        celula((c as Record<string, unknown>)[cheie], formatare)
      ).join(';')
    ),
  ]

  // BOM UTF-8: fără el, Excel afișează „ImportanÈ›Äƒ" în loc de diacritice.
  const corp = '﻿' + randuri.join('\r\n')
  const data_ = new Date().toISOString().slice(0, 10)

  // Exportul e o prelucrare de date personale — se consemnează.
  const supabase = createAdminClient()
  if ((data ?? []).length > 0) {
    await supabase.from('activities').insert(
      (data ?? []).map((c) => ({
        contact_id: c.id!,
        type: 'export' as const,
        payload: { filtre: searchParams },
      }))
    )
  }

  return new Response(corp, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="leaduri-${data_}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}
