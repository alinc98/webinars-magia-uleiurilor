'use client'

import { useActionState, useEffect, useId, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { sugereazaSlug } from '@/lib/validations/webinar'
import type { StareFormular } from '@/app/(admin)/admin/webinarii/actions'

export type SpeakerOptiune = {
  id: string
  name: string
  role_title: string | null
  is_default: boolean
}

export type ValoriWebinar = {
  id?: string
  title?: string
  slug?: string
  subtitle?: string | null
  description?: string | null
  learning_points?: string[]
  for_whom?: string[]
  bonus_title?: string | null
  bonus_description?: string | null
  starts_at?: string
  duration_min?: number
  format?: 'online' | 'fizic' | 'hibrid'
  join_url?: string | null
  venue_name?: string | null
  address?: string | null
  city?: string | null
  county?: string | null
  map_url?: string | null
  venue_notes?: string | null
  capacity?: number | null
  cover_image_url?: string | null
  status?: string
  listed?: boolean
  is_featured?: boolean
  replay_public?: boolean
  recording_url?: string | null
  seo_title?: string | null
  seo_description?: string | null
  speaker_ids?: string[]
  gazda_id?: string
}

const initial: StareFormular = { ok: false }

/** `2026-09-14T19:00:00Z` → `2026-09-14T22:00`, ce așteaptă datetime-local. */
function pentruInput(iso?: string) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function FormularWebinar({
  actiune,
  valori,
  speakeri,
}: {
  actiune: (stare: StareFormular, formData: FormData) => Promise<StareFormular>
  valori: ValoriWebinar
  speakeri: SpeakerOptiune[]
}) {
  const [stare, trimite, seTrimite] = useActionState(actiune, initial)
  const idFormular = useId()

  const [format, setFormat] = useState(valori.format ?? 'online')
  useSincronizat(valori.format ?? 'online', setFormat)
  const [slug, setSlug] = useState(valori.slug ?? '')
  const [slugAtins, setSlugAtins] = useState(Boolean(valori.slug))
  const [replayPublic, setReplayPublic] = useState(valori.replay_public ?? false)
  useSincronizat(valori.replay_public ?? false, setReplayPublic)

  const implicit = speakeri.find((s) => s.is_default)
  const [alesi, setAlesi] = useState<string[]>(
    valori.speaker_ids ?? (implicit && !valori.id ? [implicit.id] : [])
  )
  const [gazda, setGazda] = useState<string | undefined>(
    valori.gazda_id ?? (implicit && !valori.id ? implicit.id : undefined)
  )
  useSincronizat((valori.speaker_ids ?? []).join(','), (lista) =>
    setAlesi(lista ? lista.split(',') : [])
  )
  useSincronizat(valori.gazda_id, setGazda)

  const online = format !== 'fizic'
  const laFataLocului = format !== 'online'
  const e = stare.erori ?? {}

  function comutaSpeaker(id: string, bifat: boolean) {
    setAlesi((curent) => {
      if (bifat) {
        if (curent.includes(id) || curent.length >= 3) return curent
        return [...curent, id]
      }
      if (gazda === id) setGazda(undefined)
      return curent.filter((x) => x !== id)
    })
  }

  return (
    <form action={trimite} className="flex flex-col gap-8 px-5 py-6 md:px-8">
      <Sectiune titlu="Informații de bază">
        <Camp eticheta="Titlu" id={`${idFormular}-title`} eroare={e.title}>
          <Input
            id={`${idFormular}-title`}
            name="title"
            defaultValue={valori.title}
            required
            onChange={(ev) => {
              if (!slugAtins) setSlug(sugereazaSlug(ev.target.value))
            }}
          />
        </Camp>

        <Camp
          eticheta="Slug"
          id={`${idFormular}-slug`}
          eroare={e.slug}
          hint={`Pagina va fi la /webinar/${slug || '…'}`}
        >
          <Input
            id={`${idFormular}-slug`}
            name="slug"
            value={slug}
            required
            onChange={(ev) => {
              setSlug(ev.target.value)
              setSlugAtins(true)
            }}
          />
        </Camp>

        <Camp eticheta="Subtitlu" id={`${idFormular}-subtitle`} eroare={e.subtitle}>
          <Input id={`${idFormular}-subtitle`} name="subtitle" defaultValue={valori.subtitle ?? ''} />
        </Camp>

        <Camp eticheta="Descriere" id={`${idFormular}-description`} eroare={e.description}>
          <Textarea
            id={`${idFormular}-description`}
            name="description"
            rows={4}
            defaultValue={valori.description ?? ''}
          />
        </Camp>
      </Sectiune>

      <Sectiune titlu="Conținutul paginii">
        <Camp
          eticheta="Ce vei învăța"
          id={`${idFormular}-learning`}
          hint="Un punct pe rând. Cinci e numărul potrivit."
        >
          <Textarea
            id={`${idFormular}-learning`}
            name="learning_points"
            rows={5}
            defaultValue={(valori.learning_points ?? []).join('\n')}
          />
        </Camp>

        <Camp eticheta="Pentru cine e" id={`${idFormular}-forwhom`} hint="Un punct pe rând.">
          <Textarea
            id={`${idFormular}-forwhom`}
            name="for_whom"
            rows={4}
            defaultValue={(valori.for_whom ?? []).join('\n')}
          />
        </Camp>

        <div className="grid gap-4 md:grid-cols-2">
          <Camp eticheta="Titlul bonusului" id={`${idFormular}-bonus`}>
            <Input id={`${idFormular}-bonus`} name="bonus_title" defaultValue={valori.bonus_title ?? ''} />
          </Camp>
          <Camp eticheta="Descrierea bonusului" id={`${idFormular}-bonusd`}>
            <Input
              id={`${idFormular}-bonusd`}
              name="bonus_description"
              defaultValue={valori.bonus_description ?? ''}
            />
          </Camp>
        </div>
      </Sectiune>

      <Sectiune titlu="Speakeri" descriere="Cel mult trei. Gazda apare prima pe pagină.">
        {speakeri.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Nu există niciun speaker încă. Adaugă unul din secțiunea Speakeri.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {speakeri.map((s) => {
              const bifat = alesi.includes(s.id)
              return (
                <li key={s.id} className="flex items-center gap-3 rounded-md border p-3">
                  <Checkbox
                    id={`sp-${s.id}`}
                    checked={bifat}
                    disabled={!bifat && alesi.length >= 3}
                    onCheckedChange={(v) => comutaSpeaker(s.id, v === true)}
                  />
                  <label htmlFor={`sp-${s.id}`} className="min-w-0 flex-1 text-sm">
                    <span className="font-medium">{s.name}</span>
                    {s.role_title && (
                      <span className="text-muted-foreground"> · {s.role_title}</span>
                    )}
                  </label>
                  {bifat && (
                    <label className="flex items-center gap-1.5 text-xs">
                      <input
                        type="radio"
                        name="gazda_id"
                        value={s.id}
                        checked={gazda === s.id}
                        onChange={() => setGazda(s.id)}
                      />
                      gazdă
                    </label>
                  )}
                  {bifat && <input type="hidden" name="speaker_ids" value={s.id} />}
                </li>
              )
            })}
          </ul>
        )}
        {e.speaker_ids && <p className="text-destructive text-sm">{e.speaker_ids}</p>}
      </Sectiune>

      <Sectiune titlu="Programare">
        <div className="grid gap-4 md:grid-cols-3">
          <Camp eticheta="Data și ora" id={`${idFormular}-start`} eroare={e.starts_at}>
            <Input
              id={`${idFormular}-start`}
              name="starts_at"
              type="datetime-local"
              defaultValue={pentruInput(valori.starts_at)}
              required
            />
          </Camp>
          <Camp eticheta="Durată (minute)" id={`${idFormular}-durata`} eroare={e.duration_min}>
            <Input
              id={`${idFormular}-durata`}
              name="duration_min"
              type="number"
              min={1}
              defaultValue={valori.duration_min ?? 60}
              required
            />
          </Camp>
          <Camp
            eticheta="Capacitate"
            id={`${idFormular}-cap`}
            hint="Lasă gol pentru nelimitat."
            eroare={e.capacity}
          >
            <Input
              id={`${idFormular}-cap`}
              name="capacity"
              type="number"
              min={1}
              defaultValue={valori.capacity ?? ''}
            />
          </Camp>
        </div>

        <fieldset>
          <legend className="mb-2 text-sm font-medium">Format</legend>
          <div className="flex flex-wrap gap-4">
            {(['online', 'fizic', 'hibrid'] as const).map((v) => (
              <label key={v} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="format"
                  value={v}
                  checked={format === v}
                  onChange={() => setFormat(v)}
                />
                {v === 'online' ? 'Online' : v === 'fizic' ? 'La fața locului' : 'Hibrid'}
              </label>
            ))}
          </div>
        </fieldset>

        {/* Câmpurile irelevante dispar, nu rămân goale și dezactivate (brief §7.2). */}
        {online && (
          <Camp
            eticheta="Link de acces"
            id={`${idFormular}-join`}
            eroare={e.join_url}
            hint="Zoom, Meet sau altceva. Necesar la publicare."
          >
            <Input id={`${idFormular}-join`} name="join_url" defaultValue={valori.join_url ?? ''} />
          </Camp>
        )}

        {laFataLocului && (
          <div className="grid gap-4 md:grid-cols-2">
            <Camp eticheta="Denumirea locației" id={`${idFormular}-venue`} eroare={e.venue_name}>
              <Input id={`${idFormular}-venue`} name="venue_name" defaultValue={valori.venue_name ?? ''} />
            </Camp>
            <Camp eticheta="Adresă" id={`${idFormular}-addr`} eroare={e.address}>
              <Input id={`${idFormular}-addr`} name="address" defaultValue={valori.address ?? ''} />
            </Camp>
            <Camp eticheta="Oraș" id={`${idFormular}-city`} eroare={e.city}>
              <Input id={`${idFormular}-city`} name="city" defaultValue={valori.city ?? ''} />
            </Camp>
            <Camp eticheta="Județ" id={`${idFormular}-county`}>
              <Input id={`${idFormular}-county`} name="county" defaultValue={valori.county ?? ''} />
            </Camp>
            <Camp eticheta="Link de hartă" id={`${idFormular}-map`}>
              <Input id={`${idFormular}-map`} name="map_url" defaultValue={valori.map_url ?? ''} />
            </Camp>
            <Camp
              eticheta="Note practice"
              id={`${idFormular}-notes`}
              hint="Parcare, cum ajungi, ce să aduci."
            >
              <Textarea
                id={`${idFormular}-notes`}
                name="venue_notes"
                rows={3}
                defaultValue={valori.venue_notes ?? ''}
              />
            </Camp>
          </div>
        )}
      </Sectiune>

      <Sectiune titlu="Vizibilitate">
        <Camp eticheta="Status" id={`${idFormular}-status`} eroare={e.status}>
          <select
            id={`${idFormular}-status`}
            name="status"
            defaultValue={valori.status ?? 'draft'}
            className="border-input h-9 w-full rounded-md border px-3 text-sm"
          >
            <option value="draft">Ciornă</option>
            <option value="published">Publicat</option>
            <option value="live">În desfășurare</option>
            <option value="ended">Încheiat</option>
            <option value="cancelled">Anulat</option>
          </select>
        </Camp>

        <Comutator
          nume="listed"
          eticheta="Afișează în listă"
          descriere="Dezactivat, webinarul are pagină funcțională dar nu apare pe pagina publică."
          implicit={valori.listed ?? true}
        />
        <Comutator
          nume="is_featured"
          eticheta="Evidențiază pe pagina principală"
          descriere="Ocupă locul mare din capul listei. Îl deselectează automat pe cel anterior."
          implicit={valori.is_featured ?? false}
        />
        <Comutator
          nume="replay_public"
          eticheta="Înregistrare publică"
          descriere="După încheiere, înregistrarea se deblochează contra email."
          implicit={replayPublic}
          onChange={setReplayPublic}
        />

        {replayPublic && (
          <Camp eticheta="Link înregistrare" id={`${idFormular}-rec`} eroare={e.recording_url}>
            <Input
              id={`${idFormular}-rec`}
              name="recording_url"
              defaultValue={valori.recording_url ?? ''}
            />
          </Camp>
        )}
      </Sectiune>

      <Sectiune titlu="SEO">
        <Camp eticheta="Titlu SEO" id={`${idFormular}-seot`}>
          <Input id={`${idFormular}-seot`} name="seo_title" defaultValue={valori.seo_title ?? ''} />
        </Camp>
        <Camp eticheta="Descriere SEO" id={`${idFormular}-seod`}>
          <Textarea
            id={`${idFormular}-seod`}
            name="seo_description"
            rows={2}
            defaultValue={valori.seo_description ?? ''}
          />
        </Camp>
        <input type="hidden" name="cover_image_url" value={valori.cover_image_url ?? ''} />
      </Sectiune>

      <div className="bg-background sticky bottom-0 -mx-5 flex flex-wrap items-center gap-3 border-t px-5 py-3 md:-mx-8 md:bottom-0 md:px-8">
        <Button type="submit" disabled={seTrimite}>
          {seTrimite ? 'Se salvează…' : 'Salvează'}
        </Button>
        {valori.slug && (
          <Button variant="outline" asChild>
            <a href={`/webinar/${valori.slug}`} target="_blank" rel="noreferrer">
              Previzualizează
            </a>
          </Button>
        )}
        {stare.mesaj && (
          <p
            role="status"
            className={stare.ok ? 'text-sm text-emerald-600' : 'text-destructive text-sm'}
          >
            {stare.mesaj}
          </p>
        )}
      </div>
    </form>
  )
}

function Sectiune({
  titlu,
  descriere,
  children,
}: {
  titlu: string
  descriere?: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="font-medium">{titlu}</h2>
        {descriere && <p className="text-muted-foreground text-sm">{descriere}</p>}
      </div>
      {children}
    </section>
  )
}

function Camp({
  eticheta,
  id,
  hint,
  eroare,
  children,
}: {
  eticheta: string
  id: string
  hint?: string
  eroare?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{eticheta}</Label>
      {children}
      {hint && !eroare && <p className="text-muted-foreground text-xs">{hint}</p>}
      {eroare && (
        <p className="text-destructive text-sm" role="alert">
          {eroare}
        </p>
      )}
    </div>
  )
}

/**
 * Ține starea locală în pas cu datele proaspete de la server.
 *
 * Fără asta, imediat după o salvare comutatoarele afișau valoarea dinaintea
 * ei. Nu e doar cosmetic: a doua salvare la rând ar trimite valorile vechi și
 * ar anula prima, în tăcere.
 */
function useSincronizat<T>(valoare: T, seteaza: (v: T) => void) {
  const anterior = useRef(valoare)

  useEffect(() => {
    // Se aplică doar când valoarea de la server chiar s-a schimbat, nu la
    // montare. La montare, starea inițială conține preselecția (Andreea ca
    // gazdă la un webinar nou), pe care props-urile n-o au — iar o gardă pe
    // „prima randare" n-ar rezista, fiindcă în dev StrictMode rulează efectele
    // de două ori și ar consuma-o degeaba.
    if (Object.is(anterior.current, valoare)) return
    anterior.current = valoare
    seteaza(valoare)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valoare])
}

function Comutator({
  nume,
  eticheta,
  descriere,
  implicit,
  onChange,
}: {
  nume: string
  eticheta: string
  descriere: string
  implicit: boolean
  onChange?: (v: boolean) => void
}) {
  const [pornit, setPornit] = useState(implicit)
  useSincronizat(implicit, setPornit)

  return (
    <div className="flex items-start gap-3 rounded-md border p-3">
      <Switch
        id={nume}
        name={nume}
        checked={pornit}
        onCheckedChange={(v) => {
          setPornit(v)
          onChange?.(v)
        }}
      />
      <div className="min-w-0">
        <Label htmlFor={nume}>{eticheta}</Label>
        <p className="text-muted-foreground text-sm">{descriere}</p>
      </div>
    </div>
  )
}
