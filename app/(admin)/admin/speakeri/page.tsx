import { Antet } from '@/components/admin/antet'
import { createAdminClient } from '@/lib/supabase/admin'

import { ListaSpeakeri } from './lista'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const supabase = createAdminClient()

  const [{ data: speakeri }, { data: legaturi }] = await Promise.all([
    supabase.from('speakers').select('*').order('is_default', { ascending: false }).order('name'),
    supabase.from('webinar_speakers').select('speaker_id'),
  ])

  const aparitii = new Map<string, number>()
  for (const l of legaturi ?? []) {
    aparitii.set(l.speaker_id, (aparitii.get(l.speaker_id) ?? 0) + 1)
  }

  return (
    <>
      <Antet
        titlu="Speakeri"
        descriere="Bibliotecă de persoane, independentă de evenimente. Se introduc o dată și se refolosesc."
      />
      <ListaSpeakeri
        speakeri={(speakeri ?? []).map((s) => ({
          ...s,
          webinarii: aparitii.get(s.id) ?? 0,
        }))}
      />
    </>
  )
}
