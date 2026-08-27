'use client'

import { ChevronDown } from 'lucide-react'
import { useState } from 'react'

import { cn } from '@/lib/utils'

/**
 * FAQ-ul.
 *
 * Un singur element deschis la un moment dat. Construit pe `<button>` +
 * `aria-expanded`, nu pe `<details>`, ca să pot controla exclusivitatea și
 * animația fără să lupt cu comportamentul nativ.
 */
export function Accordion({
  intrebari,
  deschisImplicit = 0,
}: {
  intrebari: { q: string; a: string }[]
  deschisImplicit?: number | null
}) {
  const [deschis, setDeschis] = useState<number | null>(deschisImplicit)

  return (
    <div className="divide-brand-border border-brand-border divide-y border-y">
      {intrebari.map((item, i) => {
        const activ = deschis === i
        return (
          <div key={item.q}>
            <h3>
              <button
                type="button"
                aria-expanded={activ}
                aria-controls={`faq-${i}`}
                onClick={() => setDeschis(activ ? null : i)}
                className="min-h-touch focus-visible:outline-primary-700 flex w-full items-center justify-between gap-4 py-4 text-left focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                <span className="text-body text-text-body font-medium">{item.q}</span>
                <ChevronDown
                  aria-hidden
                  className={cn(
                    'text-primary-800 size-5 shrink-0 transition-transform duration-200',
                    activ && 'rotate-180'
                  )}
                />
              </button>
            </h3>
            <div id={`faq-${i}`} hidden={!activ}>
              <p className="text-body-sm text-text-muted pb-4">{item.a}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
