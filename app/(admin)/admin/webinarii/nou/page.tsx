import { Antet } from '@/components/admin/antet'
import { FormularWebinar } from '@/components/admin/formular-webinar'
import { createAdminClient } from '@/lib/supabase/admin'

import { salveazaWebinarNou } from '../actions-wrapper'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const supabase = createAdminClient()
  const { data: speakeri } = await supabase
    .from('speakers')
    .select('id, name, role_title, is_default')
    .is('archived_at', null)
    .order('is_default', { ascending: false })
    .order('name')

  return (
    <>
      <Antet
        titlu="Webinar nou"
        descriere="Pagina publică există imediat ce alegi statusul Publicat."
      />
      <FormularWebinar
        actiune={salveazaWebinarNou}
        valori={{ listed: true, format: 'online', status: 'draft' }}
        speakeri={speakeri ?? []}
      />
    </>
  )
}
