import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * În Next.js 16, `middleware.ts` s-a redenumit `proxy.ts`, iar funcția
 * exportată se numește `proxy`. Runtime-ul e `nodejs` și nu se poate configura.
 *
 * Rolul aici e dublu: reîmprospătează sesiunea Supabase (altfel expiră în
 * Server Components) și blochează accesul la panou.
 *
 * Verificarea apartenenței la `admin_users` NU se face aici: ar însemna o
 * interogare la fiecare cerere, inclusiv pentru fișiere statice. Se face în
 * layout-ul de admin, care e singurul loc prin care trece randarea panoului.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value)
          }
          response = NextResponse.next({ request })
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options)
          }
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const cale = request.nextUrl.pathname
  const esteAdmin = cale.startsWith('/admin')
  const esteLogin = cale === '/login'

  if (esteAdmin && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', cale)
    return NextResponse.redirect(url)
  }

  if (esteLogin && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin'
    url.search = ''
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Tot, mai puțin fișierele statice și imaginile. Fără excluderea asta,
     * fiecare cerere de font ar declanșa o verificare de sesiune.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
