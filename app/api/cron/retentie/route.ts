import { NextResponse } from 'next/server'

import { env } from '@/lib/env'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

/** Anonimizarea lunară a contactelor fără activitate (brief §10). */
export async function POST(request: Request) {
  if (request.headers.get('authorization') !== `Bearer ${env.cronSecret()}`) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase.rpc('anonimizeaza_contacte_vechi')

  if (error) {
    console.error('Anonimizarea a eșuat:', error.message)
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, anonimizate: data ?? 0 })
}
