import { z } from 'zod'

/**
 * Câmp de text opţional. Gol înseamnă `null`, nu „lasă cum era".
 *
 * Varianta dinainte încerca `.or(z.literal(''))`, dar ramura aia nu se atingea
 * niciodată: un şir gol trece prin `z.string()`, deci `.or` n-avea ce prinde,
 * iar în bază ajungea `""`. De-acolo, `seo_title ?? title` returna şirul gol,
 * nu titlul — şi paginile salvate din admin fără titlu SEO rămâneau cu
 * `<title>` gol.
 *
 * `null`, nu `undefined`: cheile `undefined` dispar din JSON, iar PostgREST nu
 * atinge coloana. Adică un câmp golit în admin şi-ar fi păstrat vechea
 * valoare, în tăcere.
 */
const optional = (max = 2000) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null))

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

/**
 * Preţul se scrie în unităţi şi se ţine în subunitatea monedei: bani la lei,
 * cenţi la euro. Împărţirea e aceeaşi la amândouă, deci parserul nu are nevoie
 * să ştie care e moneda.
 *
 * Acceptăm şi virgula, şi punctul: pe tastatura românească virgula e
 * separatorul firesc, iar un formular care refuză „149,50" pare stricat.
 * Rotunjim la înmulţire, altfel 149.99 * 100 iese 14998.999999999998.
 */
const pret = z
  .string()
  .optional()
  .transform((v) => (v ?? '').trim().replace(/\s/g, '').replace(',', '.'))
  .pipe(
    z.union([
      z.literal(''),
      z
        .string()
        .regex(/^\d+(\.\d{1,2})?$/, 'Scrie prețul, de exemplu 150 sau 149,50.'),
    ]),
  )
  .transform((v) => (v === '' ? null : Math.round(Number(v) * 100)))
  .refine(
    (v) => v === null || v > 0,
    'Prețul trebuie să fie mai mare decât zero.',
  )

/**
 * Moment absolut, cu fus.
 *
 * Un şir naiv ca „2026-09-23T22:00" ar fi citit de `new Date()` în fusul
 * procesului — pe Vercel, UTC — şi ora ar sări cu trei ore. Refuzăm forma aia
 * aici, ca greşeala să nu se poată întoarce pe furiş dacă cineva schimbă
 * vreodată controlul din formular.
 */
const momentAbsolut = (mesaj: string) =>
  z
    .string()
    .min(1, mesaj)
    .regex(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/,
      mesaj,
    )

/**
 * Regulile unui program: fiecare întâlnire se termină după ce începe, şi două
 * întâlniri nu se calcă una pe alta.
 *
 * Eroarea se pune pe rândul vinovat, nu pe listă: altfel omul ar vedea
 * „întâlnirile se suprapun" fără să ştie care dintre ele. Verificăm pe o copie
 * sortată, dar raportăm pe indicii din formular — ordinea de pe ecran e cea pe
 * care o vede.
 */
function verificaProgram(
  sesiuni: { starts_at: string; ends_at: string }[],
  ctx: z.RefinementCtx,
) {
  const cuIndex = sesiuni
    .map((s, i) => ({
      i,
      start: Date.parse(s.starts_at),
      final: Date.parse(s.ends_at),
    }))
    .sort((a, b) => a.start - b.start)

  for (const s of cuIndex) {
    if (!(s.final > s.start)) {
      ctx.addIssue({
        code: 'custom',
        path: [s.i, 'ends_at'],
        message: 'Ora de final trebuie să fie după cea de început.',
      })
    }
  }

  for (let k = 1; k < cuIndex.length; k++) {
    const precedenta = cuIndex[k - 1]
    const curenta = cuIndex[k]
    if (curenta.start < precedenta.final) {
      ctx.addIssue({
        code: 'custom',
        path: [curenta.i, 'starts_at'],
        message:
          curenta.start === precedenta.start
            ? 'Ai două întâlniri la aceeași oră.'
            : 'Întâlnirea asta începe înainte să se termine cea dinaintea ei.',
      })
    }
  }
}

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

    // Merge în emailul de confirmare, la orice format. `venue_notes` rămâne
    // pentru ce ţine strict de un loc fizic.
    useful_info: optional(2000),

    // Programul: una sau mai multe întâlniri. Un eveniment de o seară e cazul
    // cu o singură sesiune, deci nu are ramură separată nicăieri.
    sessions: z
      .array(
        z.object({
          starts_at: momentAbsolut('Alege data și ora de început.'),
          ends_at: momentAbsolut('Alege ora la care se termină.'),
          label: optional(120),
        }),
      )
      .min(1, 'Adaugă cel puțin o întâlnire.')
      .max(14, 'Cel mult paisprezece întâlniri.')
      .superRefine(verificaProgram),
    format: z.enum(['online', 'fizic']),

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
        // `null`, ca la câmpurile de text: altfel ştergerea capacităţii n-ar
        // ajunge niciodată în bază.
        z.literal('').transform(() => null),
      ])
      .optional(),

    // Alegerea din formular. Nu se salvează nicăieri: în bază, adevărul e o
    // singură coloană, iar „gratuit" înseamnă preţ gol.
    price_mod: z.enum(['gratuit', 'platit']).default('gratuit'),
    price_bani: pret,
    // Rămâne pe lei şi la evenimentele gratuite, unde nu înseamnă nimic: o
    // coloană `not null` cu o valoare implicită e mai simplu de citit decât una
    // care poate lipsi.
    price_currency: z.enum(['RON', 'EUR']).default('RON'),
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
  .refine((d) => d.price_mod !== 'platit' || d.price_bani !== null, {
    path: ['price_bani'],
    message: 'Scrie prețul, sau treci evenimentul pe gratuit.',
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
