import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'

export type TextConsimtamant = { version: string; body: string }

/** Textul de consimțământ afișat acum sub formulare. */
export async function getTextConsimtamant(): Promise<TextConsimtamant | null> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('consent_texts')
    .select('version, body')
    .eq('is_current', true)
    .maybeSingle()

  return data
}

/** Doar versiunea, pentru a o salva pe contact la înscriere. */
export async function textCurentDeConsimtamant(): Promise<string | null> {
  return (await getTextConsimtamant())?.version ?? null
}
