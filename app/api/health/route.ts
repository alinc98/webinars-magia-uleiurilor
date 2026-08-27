import { NextResponse } from 'next/server'

import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Ținta workflow-ului zilnic din GitHub Actions.
 *
 * Planul gratuit Supabase pune proiectul în pauză după 7 zile fără trafic — nu
 * în timpul unei campanii, ci între ele, exact când nu se uită nimeni. O
 * interogare trivială pe zi resetează contorul (PLAN.md §2.2).
 */
export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = createAdminClient()
  const { error } = await supabase.from('webinars').select('id').limit(1)

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 503 })
  }

  return NextResponse.json({ ok: true })
}
