'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { X } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const STATUSURI = [
  ['nou', 'Nou'],
  ['contactat', 'Contactat'],
  ['interesat', 'Interesat'],
  ['client', 'Client'],
  ['inactiv', 'Inactiv'],
] as const

const ETICHETE_FILTRE: Record<string, string> = {
  q: 'Căutare',
  status: 'Status',
  tag: 'Tag',
  webinar: 'Webinar',
  de_la: 'De la',
  pana_la: 'Până la',
  sursa: 'Sursă',
}

/** Filtrele se reflectă în URL, ca pagina să poată fi salvată ca bookmark (brief §17). */
export function BaraFiltre({ webinarii }: { webinarii: { id: string; title: string }[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [cautare, setCautare] = useState(searchParams.get('q') ?? '')

  const seteaza = (cheie: string, valoare?: string) => {
    const noi = new URLSearchParams(searchParams)
    if (valoare) noi.set(cheie, valoare)
    else noi.delete(cheie)
    // Orice schimbare de filtru readuce pe prima pagină.
    noi.delete('pagina')
    router.replace(`/admin/leaduri?${noi.toString()}`)
  }

  // Căutarea nu declanșează o cerere la fiecare tastă.
  useEffect(() => {
    const curent = searchParams.get('q') ?? ''
    if (cautare === curent) return
    const t = setTimeout(() => seteaza('q', cautare || undefined), 350)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cautare])

  const active = [...searchParams.entries()].filter(
    ([k, v]) => k !== 'pagina' && v && ETICHETE_FILTRE[k]
  )

  const titluWebinar = (id: string) => webinarii.find((w) => w.id === id)?.title ?? id

  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        <Input
          placeholder="Nume, email sau telefon"
          value={cautare}
          onChange={(e) => setCautare(e.target.value)}
          className="lg:col-span-2"
          aria-label="Caută"
        />

        <select
          value={searchParams.get('status') ?? ''}
          onChange={(e) => seteaza('status', e.target.value || undefined)}
          className="border-input h-9 rounded-md border px-3 text-sm"
          aria-label="Status"
        >
          <option value="">Orice status</option>
          {STATUSURI.map(([v, t]) => (
            <option key={v} value={v}>
              {t}
            </option>
          ))}
        </select>

        <select
          value={searchParams.get('webinar') ?? ''}
          onChange={(e) => seteaza('webinar', e.target.value || undefined)}
          className="border-input h-9 rounded-md border px-3 text-sm"
          aria-label="Webinar"
        >
          <option value="">Orice webinar</option>
          {webinarii.map((w) => (
            <option key={w.id} value={w.id}>
              {w.title}
            </option>
          ))}
        </select>

        <Input
          placeholder="Tag"
          defaultValue={searchParams.get('tag') ?? ''}
          onBlur={(e) => seteaza('tag', e.target.value || undefined)}
          aria-label="Tag"
        />

        <Input
          type="date"
          value={searchParams.get('de_la') ?? ''}
          onChange={(e) => seteaza('de_la', e.target.value || undefined)}
          aria-label="De la data"
        />
        <Input
          type="date"
          value={searchParams.get('pana_la') ?? ''}
          onChange={(e) => seteaza('pana_la', e.target.value || undefined)}
          aria-label="Până la data"
        />
      </div>

      {active.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {active.map(([cheie, valoare]) => (
            <Badge key={cheie} variant="secondary" className="gap-1 pr-1">
              <span className="text-muted-foreground">{ETICHETE_FILTRE[cheie]}:</span>
              {cheie === 'webinar' ? titluWebinar(valoare) : valoare}
              <button
                type="button"
                onClick={() => {
                  if (cheie === 'q') setCautare('')
                  seteaza(cheie, undefined)
                }}
                className="hover:bg-background rounded-sm p-0.5"
                aria-label={`Scoate filtrul ${ETICHETE_FILTRE[cheie]}`}
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setCautare('')
              router.replace('/admin/leaduri')
            }}
          >
            Șterge tot
          </Button>
        </div>
      )}
    </div>
  )
}
