'use client'

import { useCallback } from 'react'

import {
  FormularWebinar,
  type SpeakerOptiune,
  type ValoriWebinar,
} from '@/components/admin/formular-webinar'
import type { StareFormular } from '../actions'
import { salveazaWebinarExistent } from '../actions-wrapper'

export function EditorWebinar({
  id,
  valori,
  speakeri,
}: {
  id: string
  valori: ValoriWebinar
  speakeri: SpeakerOptiune[]
}) {
  const actiune = useCallback(
    (stare: StareFormular, formData: FormData) =>
      salveazaWebinarExistent(id, stare, formData),
    [id]
  )

  return <FormularWebinar actiune={actiune} valori={valori} speakeri={speakeri} />
}
