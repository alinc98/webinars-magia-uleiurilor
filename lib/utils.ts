import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

/**
 * `tailwind-merge` nu cunoaște numele noastre de tokeni, așa că nu poate ști
 * dacă `text-h1` e o mărime sau o culoare. Le vede ca fiind amândouă `text-*`,
 * le declară în conflict și îl păstrează doar pe ultimul.
 *
 * Efectul era că `cn('text-h1 text-text-heading')` producea doar culoarea, iar
 * titlurile rămâneau la 16px — pe toată partea publică, fără niciun semn.
 *
 * Declarăm explicit ce e mărime și ce e culoare.
 */
const MARIMI_TEXT = [
  'display',
  'h1',
  'h2',
  'h3',
  'h4',
  'body-lg',
  'body',
  'body-sm',
  'caption',
  'overline',
]

const CULORI_TEXT = ['text-body', 'text-muted', 'text-heading', 'text-on-dark', 'gold-text']

const twMerge = extendTailwindMerge({
  override: {
    classGroups: {
      'font-size': [{ text: [...MARIMI_TEXT, (v: string) => /^(\[|\()/.test(v)] }],
    },
  },
  extend: {
    classGroups: {
      'text-color': [{ text: CULORI_TEXT }],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
