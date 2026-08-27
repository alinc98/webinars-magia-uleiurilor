import { NextResponse } from 'next/server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminUser } from '@/lib/supabase/auth'

export const dynamic = 'force-dynamic'

const BUCKET = 'imagini'
const MARIME_MAXIMA = 3 * 1024 * 1024
const TIPURI = ['image/webp', 'image/jpeg', 'image/png']

/**
 * Încărcarea imaginilor din admin.
 *
 * Fișierul vine deja redimensionat din browser (vezi componenta de încărcare):
 * planul gratuit n-are transformări de imagine în Supabase, iar optimizatorul
 * Vercel are un plafon lunar. Redimensionarea la client le ocolește pe amândouă
 * și trimite fișiere mai mici decât ar fi ieșit oricum din ele (PLAN.md §2.4).
 */
export async function POST(request: Request) {
  if (!(await getAdminUser())) {
    return NextResponse.json({ ok: false, message: 'Neautorizat.' }, { status: 401 })
  }

  const formData = await request.formData()
  const fisier = formData.get('fisier')
  const folder = String(formData.get('folder') ?? 'diverse').replace(/[^a-z0-9-]/gi, '')

  if (!(fisier instanceof File)) {
    return NextResponse.json({ ok: false, message: 'Lipsește fișierul.' }, { status: 400 })
  }
  if (!TIPURI.includes(fisier.type)) {
    return NextResponse.json(
      { ok: false, message: 'Doar imagini JPG, PNG sau WebP.' },
      { status: 415 }
    )
  }
  if (fisier.size > MARIME_MAXIMA) {
    return NextResponse.json({ ok: false, message: 'Imaginea e prea mare.' }, { status: 413 })
  }

  const extensie = fisier.type === 'image/webp' ? 'webp' : fisier.type === 'image/png' ? 'png' : 'jpg'
  const cale = `${folder || 'diverse'}/${crypto.randomUUID()}.${extensie}`

  const supabase = createAdminClient()
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(cale, fisier, { contentType: fisier.type, cacheControl: '31536000', upsert: false })

  if (error) {
    console.error('Încărcarea a eșuat:', error.message)
    return NextResponse.json({ ok: false, message: 'Nu am putut încărca imaginea.' }, { status: 500 })
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(cale)

  return NextResponse.json({ ok: true, url: publicUrl })
}
