'use client'

import { useState, useTransition } from 'react'
import { Archive, ArchiveRestore, Pencil, Trash2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import { useActiuneFormular } from '@/lib/formular'

import {
  dezarhiveazaSpeaker,
  salveazaSpeaker,
  stergeSauArhiveazaSpeaker,
  type StareSpeaker,
} from './actions'

type Speaker = {
  id: string
  name: string
  role_title: string | null
  bio_short: string | null
  photo_url: string | null
  instagram_url: string | null
  facebook_url: string | null
  website_url: string | null
  is_default: boolean
  archived_at: string | null
  webinarii: number
}

const initial: StareSpeaker = { ok: false }

export function ListaSpeakeri({ speakeri }: { speakeri: Speaker[] }) {
  const [inEditare, setInEditare] = useState<Speaker | null>(null)
  const [deschis, setDeschis] = useState(false)
  const [deSters, setDeSters] = useState<Speaker | null>(null)
  const [inCurs, porneste] = useTransition()

  const activi = speakeri.filter((s) => !s.archived_at)
  const arhivati = speakeri.filter((s) => s.archived_at)

  return (
    <div className="px-5 py-6 md:px-8">
      <Button
        onClick={() => {
          setInEditare(null)
          setDeschis(true)
        }}
      >
        Speaker nou
      </Button>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {activi.map((s) => (
          <article key={s.id} className="rounded-lg border p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium">{s.name}</p>
                {s.role_title && (
                  <p className="text-muted-foreground text-sm">{s.role_title}</p>
                )}
              </div>
              {s.is_default && <Badge variant="secondary">implicit</Badge>}
            </div>

            {s.bio_short && (
              <p className="text-muted-foreground mt-2 line-clamp-3 text-sm">{s.bio_short}</p>
            )}

            <div className="mt-3 flex items-center justify-between">
              <span className="text-muted-foreground text-xs">
                {s.webinarii === 0
                  ? 'niciun eveniment'
                  : `${s.webinarii} ${s.webinarii === 1 ? 'eveniment' : 'evenimente'}`}
              </span>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setInEditare(s)
                    setDeschis(true)
                  }}
                >
                  <Pencil className="size-4" />
                  <span className="sr-only">Editează {s.name}</span>
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setDeSters(s)}>
                  {s.webinarii > 0 ? (
                    <Archive className="size-4" />
                  ) : (
                    <Trash2 className="size-4" />
                  )}
                  <span className="sr-only">
                    {s.webinarii > 0 ? 'Arhivează' : 'Șterge'} {s.name}
                  </span>
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {arhivati.length > 0 && (
        <section className="mt-8">
          <h2 className="text-muted-foreground text-sm font-medium">Arhivați</h2>
          <ul className="mt-2 flex flex-col gap-2">
            {arhivati.map((s) => (
              <li key={s.id} className="flex items-center justify-between rounded-md border p-3">
                <span className="text-sm">{s.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={inCurs}
                  onClick={() => porneste(() => dezarhiveazaSpeaker(s.id))}
                >
                  <ArchiveRestore className="size-4" />
                  Readu
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <DialogSpeaker
        deschis={deschis}
        setDeschis={setDeschis}
        speaker={inEditare}
        key={inEditare?.id ?? 'nou'}
      />

      <Dialog open={Boolean(deSters)} onOpenChange={(v) => !v && setDeSters(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {deSters && deSters.webinarii > 0 ? 'Arhivează speakerul' : 'Șterge speakerul'}
            </DialogTitle>
            <DialogDescription>
              {deSters && deSters.webinarii > 0
                ? `${deSters.name} a participat la ${deSters.webinarii} ${deSters.webinarii === 1 ? 'eveniment' : 'evenimente'}, deci nu poate fi șters — paginile lor ar rămâne cu goluri. Îl arhivăm: dispare din selectorul de la webinarii noi, dar rămâne pe paginile trecute.`
                : `${deSters?.name} nu apare la niciun eveniment, deci poate fi șters definitiv.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeSters(null)}>
              Renunță
            </Button>
            <Button
              variant={deSters && deSters.webinarii > 0 ? 'default' : 'destructive'}
              disabled={inCurs}
              onClick={() => {
                const id = deSters!.id
                setDeSters(null)
                porneste(() => stergeSauArhiveazaSpeaker(id))
              }}
            >
              {deSters && deSters.webinarii > 0 ? 'Arhivează' : 'Șterge definitiv'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function DialogSpeaker({
  deschis,
  setDeschis,
  speaker,
}: {
  deschis: boolean
  setDeschis: (v: boolean) => void
  speaker: Speaker | null
}) {
  const { stare, onSubmit, inCurs: seTrimite } = useActiuneFormular(
    (s: StareSpeaker, fd: FormData) => salveazaSpeaker(speaker?.id ?? null, s, fd),
    initial
  )
  const [bio, setBio] = useState(speaker?.bio_short ?? '')
  const e = stare.erori ?? {}

  if (stare.ok && deschis) setTimeout(() => setDeschis(false), 0)

  return (
    <Dialog open={deschis} onOpenChange={setDeschis}>
      <DialogContent className="max-h-[85svh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{speaker ? 'Editează speakerul' : 'Speaker nou'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sp-name">Nume</Label>
            <Input id="sp-name" name="name" defaultValue={speaker?.name} required />
            {e.name && <p className="text-destructive text-sm">{e.name}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sp-role">Rol sau titlu scurt</Label>
            <Input
              id="sp-role"
              name="role_title"
              defaultValue={speaker?.role_title ?? ''}
              placeholder="Aromaterapeut, 8 ani experiență"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between">
              <Label htmlFor="sp-bio">Descriere</Label>
              <span
                className={
                  bio.length > 250 ? 'text-amber-600 text-xs' : 'text-muted-foreground text-xs'
                }
              >
                {bio.length}/250
              </span>
            </div>
            <Textarea
              id="sp-bio"
              name="bio_short"
              rows={4}
              value={bio}
              onChange={(ev) => setBio(ev.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sp-photo">Link poză</Label>
            <Input id="sp-photo" name="photo_url" defaultValue={speaker?.photo_url ?? ''} />
            {/* TODO(M5): încărcare cu decupare pătrată în Supabase Storage. */}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sp-ig">Instagram</Label>
              <Input id="sp-ig" name="instagram_url" defaultValue={speaker?.instagram_url ?? ''} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sp-fb">Facebook</Label>
              <Input id="sp-fb" name="facebook_url" defaultValue={speaker?.facebook_url ?? ''} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sp-web">Site</Label>
              <Input id="sp-web" name="website_url" defaultValue={speaker?.website_url ?? ''} />
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-md border p-3">
            <Switch id="sp-default" name="is_default" defaultChecked={speaker?.is_default} />
            <div>
              <Label htmlFor="sp-default">Preselectat la webinar nou</Label>
              <p className="text-muted-foreground text-sm">
                O singură persoană poate fi preselectată.
              </p>
            </div>
          </div>

          {stare.mesaj && !stare.ok && (
            <p className="text-destructive text-sm">{stare.mesaj}</p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={seTrimite}>
              {seTrimite ? 'Se salvează…' : 'Salvează'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
