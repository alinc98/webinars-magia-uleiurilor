import { z } from 'zod'

/**
 * O singură definiție pentru formularul din browser, pentru validarea din
 * Server Action și pentru tipuri. Mesajele sunt în română fiindcă ajung direct
 * sub câmpuri.
 */

const nume = z
  .string()
  .trim()
  .min(2, 'Scrie-ți numele.')
  .max(120, 'Numele e prea lung.')

const email = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, 'Adresa e prea lungă.')
  .pipe(z.email('Verifică adresa de email.'))

// Numerele românești, cu sau fără prefix, cu spații sau puncte. Câmpul e
// opțional: fiecare câmp obligatoriu în plus taie din conversii (brief §12.10).
const telefon = z
  .string()
  .trim()
  .regex(/^[+()\d\s.-]{9,20}$/, 'Verifică numărul de telefon.')
  .optional()
  .or(z.literal('').transform(() => undefined))

const consimtamant = z.literal(true, {
  error: 'Trebuie să accepți politica de confidențialitate.',
})

/** Câmp-capcană: umplut înseamnă bot. Nu e afișat și nu e citit de screen readere. */
const honeypot = z
  .string()
  .max(0)
  .optional()
  .or(z.literal('').transform(() => undefined))

export const trackingSchema = z
  .object({
    utm_source: z.string().max(200).optional(),
    utm_medium: z.string().max(200).optional(),
    utm_campaign: z.string().max(200).optional(),
    utm_content: z.string().max(200).optional(),
    utm_term: z.string().max(200).optional(),
    fbclid: z.string().max(500).optional(),
    referrer: z.string().max(1000).optional(),
    landing_page: z.string().max(500).optional(),
  })
  .default({})

export const inscriereSchema = z.object({
  slug: z.string().min(1),
  name: nume,
  email,
  phone: telefon,
  consent: consimtamant,
  /** Doar la evenimentele hibride (brief §12.8). */
  attendance_preference: z.enum(['fizic', 'online']).optional(),
  website: honeypot,
  tracking: trackingSchema,
})

export const listaAsteptareSchema = z.object({
  name: nume,
  email,
  consent: consimtamant,
  interest: z.enum(['online', 'fizic', 'ambele']).optional(),
  /** Setat doar la „anunță-mă dacă se eliberează un loc" pe un eveniment plin. */
  webinar_slug: z.string().optional(),
  website: honeypot,
  tracking: trackingSchema,
})

export const replaySchema = z.object({
  slug: z.string().min(1),
  name: nume,
  email,
  consent: consimtamant,
  website: honeypot,
  tracking: trackingSchema,
})

export type InscriereInput = z.input<typeof inscriereSchema>
export type ListaAsteptareInput = z.input<typeof listaAsteptareSchema>
export type ReplayInput = z.input<typeof replaySchema>
export type Tracking = z.infer<typeof trackingSchema>
