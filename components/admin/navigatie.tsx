'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  CalendarDays,
  LayoutDashboard,
  LogOut,
  Settings,
  Users,
  UserSquare2,
  Globe,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import type { AdminUser } from '@/lib/supabase/auth'

const INTRARI = [
  { href: '/admin', eticheta: 'Panou', Icoana: LayoutDashboard, exact: true },
  { href: '/admin/webinarii', eticheta: 'Webinarii', Icoana: CalendarDays },
  { href: '/admin/speakeri', eticheta: 'Speakeri', Icoana: UserSquare2 },
  { href: '/admin/leaduri', eticheta: 'Lead-uri', Icoana: Users },
  { href: '/admin/pagina-publica', eticheta: 'Pagina publică', Icoana: Globe },
  { href: '/admin/setari', eticheta: 'Setări', Icoana: Settings },
]

/** Cele patru intrări cele mai folosite de pe telefon, în ziua evenimentului. */
const PE_MOBIL = ['/admin', '/admin/webinarii', '/admin/leaduri', '/admin/setari']

export function Navigatie({ utilizator }: { utilizator: AdminUser }) {
  const cale = usePathname()

  const esteActiv = (href: string, exact?: boolean) =>
    exact ? cale === href : cale === href || cale.startsWith(`${href}/`)

  return (
    <>
      <aside className="bg-sidebar hidden w-60 shrink-0 flex-col border-r md:flex">
        <div className="px-5 py-5">
          <p className="text-sm font-semibold">Magia Uleiurilor</p>
          <p className="text-muted-foreground text-xs">Panou de administrare</p>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 px-3">
          {INTRARI.map(({ href, eticheta, Icoana, exact }) => (
            <Link
              key={href}
              href={href}
              aria-current={esteActiv(href, exact) ? 'page' : undefined}
              className={cn(
                'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm',
                esteActiv(href, exact)
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'hover:bg-accent'
              )}
            >
              <Icoana className="size-4 shrink-0" />
              {eticheta}
            </Link>
          ))}
        </nav>

        <div className="border-t px-3 py-3">
          <p className="truncate px-2 text-xs" title={utilizator.email}>
            {utilizator.name ?? utilizator.email}
          </p>
          <form action="/auth/iesire" method="post">
            <button
              type="submit"
              className="hover:bg-accent mt-1 flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm"
            >
              <LogOut className="size-4" />
              Ieși din cont
            </button>
          </form>
        </div>
      </aside>

      {/* Pe mobil sidebar-ul devine bară jos: Andreea verifică înscrierile de pe
          telefon în ziua evenimentului (brief §17). */}
      <nav className="bg-background fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t md:hidden">
        {INTRARI.filter((i) => PE_MOBIL.includes(i.href)).map(
          ({ href, eticheta, Icoana, exact }) => (
            <Link
              key={href}
              href={href}
              aria-current={esteActiv(href, exact) ? 'page' : undefined}
              className={cn(
                'flex flex-col items-center gap-1 py-2.5 text-[11px]',
                esteActiv(href, exact) ? 'text-primary font-medium' : 'text-muted-foreground'
              )}
            >
              <Icoana className="size-5" />
              {eticheta}
            </Link>
          )
        )}
      </nav>
    </>
  )
}
