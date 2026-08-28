'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  CalendarDays,
  Globe,
  LayoutDashboard,
  LogOut,
  Settings,
  UserSquare2,
  Users,
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

/** Cele patru intrări folosite de pe telefon, în ziua evenimentului. */
const PE_MOBIL = ['/admin', '/admin/webinarii', '/admin/leaduri', '/admin/setari']

export function Navigatie({ utilizator }: { utilizator: AdminUser }) {
  const cale = usePathname()

  const esteActiv = (href: string, exact?: boolean) =>
    exact ? cale === href : cale === href || cale.startsWith(`${href}/`)

  return (
    <>
      {/*
        `self-start` e cheia, nu `sticky`: într-un rând flex, bara se întindea
        implicit pe toată înălțimea containerului, iar un element cât părintele
        lui n-are unde să se lipească. Așa are exact înălțimea ecranului și
        rămâne pe loc. `overflow-y-auto` o salvează pe ferestrele scunde, unde
        „Ieși din cont" ar cădea sub marginea de jos.
      */}
      <aside className="bg-admin-shell sticky top-0 hidden h-svh w-52 shrink-0 flex-col self-start overflow-y-auto py-3 md:flex">
        <div className="text-sage-200 px-3 pb-3 text-[13px] font-semibold">
          Magia Uleiurilor · Admin
        </div>

        <nav className="flex flex-1 flex-col">
          {INTRARI.map(({ href, eticheta, Icoana, exact }) => {
            const activ = esteActiv(href, exact)
            return (
              <Link
                key={href}
                href={href}
                aria-current={activ ? 'page' : undefined}
                className={cn(
                  'flex h-10 items-center gap-2.5 px-3 text-sm',
                  // Indicatorul auriu e singurul loc din admin unde apare aurul.
                  activ
                    ? 'bg-white/12 font-semibold text-white shadow-[inset_3px_0_0_var(--color-gold-300)]'
                    : 'text-sage-100 hover:bg-white/8'
                )}
              >
                <Icoana className="size-4 shrink-0" />
                {eticheta}
              </Link>
            )
          })}
        </nav>

        <div className="mt-3 border-t border-white/10 px-3 pt-3">
          <p className="text-sage-200 truncate text-xs" title={utilizator.email}>
            {utilizator.name ?? utilizator.email}
          </p>
          <form action="/auth/iesire" method="post">
            <button
              type="submit"
              className="text-sage-100 mt-1 flex h-8 w-full items-center gap-2 text-sm hover:text-white"
            >
              <LogOut className="size-4" />
              Ieși din cont
            </button>
          </form>
        </div>
      </aside>

      {/* Pe mobil, bară de navigație jos (brief §17). */}
      <nav className="bg-admin-shell fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 md:hidden">
        {INTRARI.filter((i) => PE_MOBIL.includes(i.href)).map(
          ({ href, eticheta, Icoana, exact }) => {
            const activ = esteActiv(href, exact)
            return (
              <Link
                key={href}
                href={href}
                aria-current={activ ? 'page' : undefined}
                className={cn(
                  'flex flex-col items-center gap-1 py-2.5 text-[11px]',
                  activ
                    ? 'font-semibold text-white shadow-[inset_0_3px_0_var(--color-gold-300)]'
                    : 'text-sage-200'
                )}
              >
                <Icoana className="size-5" />
                {eticheta}
              </Link>
            )
          }
        )}
      </nav>
    </>
  )
}
