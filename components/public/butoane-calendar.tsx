'use client'

import { adaugatInCalendar } from '@/lib/ga4'

/**
 * Butoanele de calendar de pe pagina de mulțumire.
 *
 * Au devenit component de client doar ca să poată raporta ce a ales omul.
 * Măsurarea îmbunătățită trimite oricum un `click` pe linkurile externe, dar nu
 * spune *care* dintre ele — iar diferența dintre Google Calendar și fișierul
 * descărcat spune ceva despre publicul care vine.
 *
 * La un eveniment pe mai multe zile rămâne doar fișierul. Un link de tip
 * `TEMPLATE` duce în Google Calendar o singură întâlnire, iar butonul ar fi
 * trimis omul mai departe convins că şi-a pus tot atelierul în calendar.
 * Fișierul se importă și în Google, deci nimeni nu pierde nimic.
 */
export function ButoaneCalendar({
  linkGoogle,
  linkIcs,
  intalniri = 1,
}: {
  linkGoogle: string
  linkIcs: string
  intalniri?: number
}) {
  const singura = intalniri <= 1

  return (
    <div className="mt-3 flex flex-col gap-3 sm:flex-row">
      {singura && (
        <a
          href={linkGoogle}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => adaugatInCalendar('google')}
          className="border-primary-800 text-primary-800 hover:bg-primary-50 min-h-touch inline-flex flex-1 items-center justify-center rounded-full border-[1.5px] px-6 text-center font-semibold whitespace-nowrap"
        >
          Google Calendar
        </a>
      )}
      <a
        href={linkIcs}
        onClick={() => adaugatInCalendar(singura ? 'ics' : 'ics_multiplu')}
        className={
          singura
            ? 'border-brand-border text-text-muted hover:bg-surface min-h-touch inline-flex flex-1 items-center justify-center rounded-full border px-6 text-center font-medium whitespace-nowrap'
            : 'border-primary-800 text-primary-800 hover:bg-primary-50 min-h-touch inline-flex flex-1 items-center justify-center rounded-full border-[1.5px] px-6 text-center font-semibold'
        }
      >
        {singura
          ? 'Alt calendar (.ics)'
          : `Adaugă toate cele ${intalniri} întâlniri`}
      </a>
    </div>
  )
}
