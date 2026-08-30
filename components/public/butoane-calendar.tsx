'use client'

import { adaugatInCalendar } from '@/lib/ga4'

/**
 * Cele două butoane de calendar de pe pagina de mulțumire.
 *
 * Au devenit component de client doar ca să poată raporta ce a ales omul.
 * Măsurarea îmbunătățită trimite oricum un `click` pe linkurile externe, dar nu
 * spune *care* dintre ele — iar diferența dintre Google Calendar și fișierul
 * descărcat spune ceva despre publicul care vine.
 */
export function ButoaneCalendar({
  linkGoogle,
  linkIcs,
}: {
  linkGoogle: string
  linkIcs: string
}) {
  return (
    <div className="mt-3 flex flex-col gap-3 sm:flex-row">
      <a
        href={linkGoogle}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => adaugatInCalendar('google')}
        className="border-primary-800 text-primary-800 hover:bg-primary-50 min-h-touch inline-flex flex-1 items-center justify-center rounded-full border-[1.5px] px-6 text-center font-semibold whitespace-nowrap"
      >
        Google Calendar
      </a>
      <a
        href={linkIcs}
        onClick={() => adaugatInCalendar('ics')}
        className="border-brand-border text-text-muted hover:bg-surface min-h-touch inline-flex flex-1 items-center justify-center rounded-full border px-6 text-center font-medium whitespace-nowrap"
      >
        Alt calendar (.ics)
      </a>
    </div>
  )
}
