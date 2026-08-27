import { redirect } from 'next/navigation'

import { Navigatie } from '@/components/admin/navigatie'
import { Toaster } from '@/components/ui/sonner'
import { getAdminUser } from '@/lib/supabase/auth'

/**
 * Poarta panoului.
 *
 * `proxy.ts` verifică doar dacă există o sesiune. Aici se verifică dacă adresa
 * e pe lista albă — o singură interogare per randare de pagină, nu per cerere.
 */
export default async function AdminLayout({ children }: LayoutProps<'/admin'>) {
  const utilizator = await getAdminUser()

  if (!utilizator) redirect('/login')

  return (
    <div className="flex min-h-svh flex-col md:flex-row">
      <Navigatie utilizator={utilizator} />
      <div className="min-w-0 flex-1 pb-20 md:pb-0">{children}</div>
      <Toaster />
    </div>
  )
}
