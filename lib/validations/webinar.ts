import { z } from 'zod'

const optional = (max = 2000) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .or(z.literal('').transform(() => undefined))

/** Listele editabile prin drag & drop din formular ajung ca text, un rând per punct. */
const listaDeRanduri = z
  .string()
  .optional()
  .transform((v) =>
    (v ?? '')
      .split('\n')
      .map((r) => r.trim())
      .filter(Boolean),
  )

export const webinarSchema = z
  .object({
    title: z.string().trim().min(3, 'Scrie un titlu.').max(200),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .regex(
        /^[a-z0-9]+(-[a-z0-9]+)*$/,
        'Doar litere mici, cifre și cratime. Fără spații sau diacritice.',
      ),
    subtitle: optional(300),
    description: optional(5000),

    learning_points: listaDeRanduri,
    for_whom: listaDeRanduri,

    // Perechile vin deja curăţate din acţiune: rândurile complet goale sunt
    // scoase acolo. Ce rămâne trebuie completat pe amândouă părţile — o
    // întrebare fără răspuns ar apărea pe pagină ca un acordeon care se
    // deschide în gol.
    faq: z
      .array(
        z.object({
          q: z.string().trim().min(1, 'Scrie întrebarea.').max(300),
          a: z.string().trim().min(1, 'Scrie răspunsul.').max(2000),
        }),
      )
      .max(12, 'Cel mult douăsprezece întrebări.')
      .default([]),

    bonus_title: optional(200),
    bonus_description: optional(1000),

    starts_at: z.string().min(1, 'Alege data și ora.'),
    duration_min: z.coerce.number<number>().int().positive().max(1440),
    format: z.enum(['online', 'fizic', 'hibrid']),

    join_url: optional(500),
    venue_name: optional(200),
    address: optional(300),
    city: optional(100),
    county: optional(100),
    map_url: optional(500),
    venue_notes: optional(1000),

    capacity: z
      .union([
        z.coerce.number<number>().int().positive(),
        z.literal('').transform(() => undefined),
      ])
      .optional(),
    cover_image_url: optional(500),

    status: z.enum(['draft', 'published', 'live', 'ended', 'cancelled']),
    listed: z.coerce.boolean<boolean>(),
    is_featured: z.coerce.boolean<boolean>(),
    replay_public: z.coerce.boolean<boolean>(),
    recording_url: optional(500),

    seo_title: optional(200),
    seo_description: optional(300),

    speaker_ids: z
      .array(z.string().uuid())
      .max(3, 'Cel mult trei speakeri.')
      .default([]),
    gazda_id: z.string().uuid().optional(),
  })
  // Aceleași reguli ca ale constrângerilor din bază, ca omul să vadă eroarea
  // sub câmp, nu ca un 500 venit din Postgres.
  .refine(
    (d) =>
      d.status !== 'published' || d.format === 'fizic' || Boolean(d.join_url),
    {
      path: ['join_url'],
      message: 'Un eveniment online publicat are nevoie de link de acces.',
    },
  )
  .refine(
    (d) =>
      d.status !== 'published' ||
      d.format === 'online' ||
      Boolean(d.venue_name && d.address && d.city),
    { path: ['venue_name'], message: 'Completează locația, adresa și orașul.' },
  )
  .refine((d) => !d.replay_public || Boolean(d.recording_url), {
    path: ['recording_url'],
    message: 'Ca să publici înregistrarea, ai nevoie de link.',
  })

export type WebinarInput = z.infer<typeof webinarSchema>

/** „Cum folosești uleiurile" → „cum-folosesti-uleiurile" */
export function sugereazaSlug(titlu: string): string {
  return titlu
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ș|ş/g, 's')
    .replace(/ț|ţ/g, 't')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}
