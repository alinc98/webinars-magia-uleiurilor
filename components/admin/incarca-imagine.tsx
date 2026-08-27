'use client'

import { ImageUp, Loader2, X } from 'lucide-react'
import { useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

/**
 * Redimensionează și decupează în browser, înainte de încărcare.
 *
 * `patrat` decupează din centru la raport 1:1 — pozele de speaker apar în
 * cercuri și în carduri pătrate, iar o poză verticală tăiată de CSS ajunge cu
 * bărbia sau fruntea în afara cadrului.
 *
 * Ieșirea e WebP: planul gratuit n-are transformări de imagine în Supabase,
 * iar optimizatorul Vercel are un plafon lunar. Aici le ocolim pe amândouă
 * (PLAN.md §2.4).
 */
async function pregatesteImaginea(
  fisier: File,
  { latura, patrat }: { latura: number; patrat: boolean }
): Promise<File> {
  const bitmap = await createImageBitmap(fisier)

  let sx = 0
  let sy = 0
  let sw = bitmap.width
  let sh = bitmap.height

  if (patrat) {
    const l = Math.min(bitmap.width, bitmap.height)
    sx = Math.round((bitmap.width - l) / 2)
    sy = Math.round((bitmap.height - l) / 2)
    sw = l
    sh = l
  }

  const raport = patrat ? 1 : sh / sw
  const latimeFinala = Math.min(latura, sw)
  const inaltimeFinala = Math.round(latimeFinala * raport)

  const panza = document.createElement('canvas')
  panza.width = latimeFinala
  panza.height = inaltimeFinala

  const context = panza.getContext('2d')
  if (!context) throw new Error('Browserul nu poate procesa imaginea.')

  context.imageSmoothingQuality = 'high'
  context.drawImage(bitmap, sx, sy, sw, sh, 0, 0, latimeFinala, inaltimeFinala)
  bitmap.close()

  const blob = await new Promise<Blob | null>((rezolva) =>
    panza.toBlob(rezolva, 'image/webp', 0.85)
  )
  if (!blob) throw new Error('Nu am putut converti imaginea.')

  return new File([blob], 'imagine.webp', { type: 'image/webp' })
}

export function IncarcaImagine({
  nume,
  eticheta,
  valoare,
  folder,
  patrat = false,
  latura = 1200,
  hint,
}: {
  nume: string
  eticheta: string
  valoare?: string | null
  folder: string
  patrat?: boolean
  latura?: number
  hint?: string
}) {
  const [url, setUrl] = useState(valoare ?? '')
  const [inCurs, setInCurs] = useState(false)
  const [eroare, setEroare] = useState<string | null>(null)
  const input = useRef<HTMLInputElement>(null)

  async function alege(fisier: File) {
    setEroare(null)
    setInCurs(true)
    try {
      const pregatit = await pregatesteImaginea(fisier, { latura, patrat })

      const formData = new FormData()
      formData.append('fisier', pregatit)
      formData.append('folder', folder)

      const raspuns = await fetch('/api/upload', { method: 'POST', body: formData })
      const rezultat = await raspuns.json()

      if (!raspuns.ok || !rezultat.ok) {
        setEroare(rezultat.message ?? 'Nu am putut încărca imaginea.')
        return
      }
      setUrl(rezultat.url)
    } catch (e) {
      setEroare(e instanceof Error ? e.message : 'Nu am putut procesa imaginea.')
    } finally {
      setInCurs(false)
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={`${nume}-fisier`}>{eticheta}</Label>

      {/* Valoarea reală trimisă cu formularul. */}
      <input type="hidden" name={nume} value={url} />

      <div className="flex items-start gap-3">
        {url ? (
          // Imaginea vine din Storage și e deja la dimensiunea finală; `img`
          // simplu, ca să nu consume din plafonul de optimizare.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt=""
            className={
              patrat
                ? 'border-admin-border size-20 shrink-0 rounded-md border object-cover'
                : 'border-admin-border h-20 w-32 shrink-0 rounded-md border object-cover'
            }
          />
        ) : (
          <div
            className={
              (patrat ? 'size-20' : 'h-20 w-32') +
              ' border-admin-border text-text-muted flex shrink-0 items-center justify-center rounded-md border border-dashed'
            }
          >
            <ImageUp className="size-5" aria-hidden />
          </div>
        )}

        <div className="flex min-w-0 flex-col gap-1.5">
          <input
            ref={input}
            id={`${nume}-fisier`}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) alege(f)
              e.target.value = ''
            }}
          />

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={inCurs}
              onClick={() => input.current?.click()}
            >
              {inCurs ? <Loader2 className="size-4 animate-spin" /> : <ImageUp className="size-4" />}
              {inCurs ? 'Se încarcă…' : url ? 'Schimbă imaginea' : 'Alege o imagine'}
            </Button>

            {url && !inCurs && (
              <Button type="button" variant="ghost" size="sm" onClick={() => setUrl('')}>
                <X className="size-4" />
                Scoate
              </Button>
            )}
          </div>

          {eroare ? (
            <p role="alert" className="text-destructive text-xs">
              {eroare}
            </p>
          ) : (
            <p className="text-text-muted text-xs">
              {hint ??
                (patrat
                  ? 'Se decupează pătrat din centru. JPG, PNG sau WebP.'
                  : 'JPG, PNG sau WebP.')}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
