import { redirect } from 'next/navigation'

import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminUser } from '@/lib/supabase/auth'

/** Dreptul de acces (GDPR, brief §10): toate datele unui contact, dintr-un clic. */
export async function GET(
  _request: Request,
  ctx: RouteContext<'/admin/leaduri/[id]/export'>
) {
  if (!(await getAdminUser())) redirect('/login')

  const { id } = await ctx.params
  const supabase = createAdminClient()

  const [contact, inscrieri, activitati, emailuri, asteptare] = await Promise.all([
    supabase.from('contacts').select('*').eq('id', id).maybeSingle(),
    supabase.from('registrations').select('*, webinars(title, slug, starts_at)').eq('contact_id', id),
    supabase.from('activities').select('*').eq('contact_id', id).order('created_at'),
    supabase.from('email_log').select('*').eq('contact_id', id).order('created_at'),
    supabase.from('waitlist').select('*').eq('contact_id', id),
  ])

  if (!contact.data) return new Response('Nu am găsit contactul.', { status: 404 })

  const pachet = {
    exportat_la: new Date().toISOString(),
    contact: contact.data,
    inscrieri: inscrieri.data ?? [],
    activitati: activitati.data ?? [],
    emailuri: emailuri.data ?? [],
    lista_de_asteptare: asteptare.data ?? [],
  }

  return new Response(JSON.stringify(pachet, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="contact-${id}.json"`,
      'Cache-Control': 'no-store',
    },
  })
}
