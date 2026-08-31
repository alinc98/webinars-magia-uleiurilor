# Evenimente pe mai multe zile și pe intervale orare

## 1. Ce cere

Unele evenimente — și online, și la fața locului — se întind pe mai multe zile,
câteva ore în fiecare zi. Un atelier de trei zile, 10:00–14:00, nu e „un
eveniment de 720 de minute" și nici „un eveniment de trei zile".

Azi platforma știe un singur lucru: un moment de start și o durată în minute.
Din el se scriu pagina publică, insignele, fișierul de calendar, emailurile și
reamintirile. Deci schimbarea nu e un câmp în plus, e o schimbare de model.

## 2. Modelul: sesiuni, nu „start și sfârșit"

Prima variantă la îndemână e o coloană `ends_at` lângă `starts_at`. E greșită.
Un atelier de trei zile, 10:00–14:00, ar deveni un bloc continuu de la 23
septembrie 10:00 la 25 septembrie 14:00 — adică trei zile blocate în calendarul
omului, inclusiv nopțile, și un „durează 3 zile" pe pagină în loc de „3 zile ×
4 ore".

Modelul corect e o listă: **fiecare eveniment are una sau mai multe sesiuni**,
fiecare cu început și sfârșit. Cazul de azi — o singură întâlnire — e exact
cazul cu o sesiune, deci nimic din ce funcționează acum nu devine excepție.

### 2.1 Dar `starts_at` rămâne pe `webinars`

Tentația a doua e să mutăm totul în tabelul de sesiuni și să ștergem `starts_at`
din `webinars`. Ar strica mult: coloana e folosită la sortarea hub-ului, la
sortarea listei din admin, la indexuri, în cele trei funcții de revendicare a
reamintirilor, în garda din `register_for_webinar` și în `dashboard_stats`.
Sortarea unui tabel după o coloană dintr-un tabel copil nu se exprimă în
PostgREST fără să rescriem fiecare interogare.

Deci: **`webinars.starts_at` și `webinars.ends_at` rămân, dar devin derivate** —
prima sesiune și ultima sesiune, ținute la zi de un trigger. Sursa adevărului e
tabelul de sesiuni; coloanele de pe părinte sunt un rezumat pe care baza îl
garantează. Tot ce sortează, filtrează și revendică rămâne neatins.

## 3. Migrația

`supabase/migrations/2026XXXXXXXXXX_sesiuni.sql`

### 3.1 Tabelul

```sql
create table webinar_sessions (
  id         uuid primary key default gen_random_uuid(),
  webinar_id uuid not null references webinars(id) on delete cascade,
  starts_at  timestamptz not null,
  ends_at    timestamptz not null,
  -- „Ziua 1: Fundamentele". Opțional; când lipsește, pagina scrie „Ziua 1".
  label      text,

  constraint webinar_sessions_interval check (ends_at > starts_at)
);

create unique index webinar_sessions_fara_dubluri
  on webinar_sessions (webinar_id, starts_at);

create index webinar_sessions_webinar_idx
  on webinar_sessions (webinar_id, starts_at);
```

Fără `sort_order`: ordinea unei liste de date e data. Un eveniment în care
ziua 2 apare înaintea zilei 1 n-are înțeles.

### 3.2 Coloana `ends_at` pe părinte

```sql
alter table webinars add column ends_at timestamptz;
```

Nullable, nu `not null`: la inserarea unui webinar nou sesiunile încă nu există.
Trigger-ul o umple imediat după.

### 3.3 Trigger-ul care ține rezumatul la zi

```sql
create function sincronizeaza_program()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_webinar uuid := coalesce(new.webinar_id, old.webinar_id);
begin
  update webinars w
  set starts_at    = s.prima,
      ends_at      = s.ultima,
      duration_min = s.minute
  from (
    select min(starts_at) as prima,
           max(ends_at)   as ultima,
           greatest(sum(extract(epoch from (ends_at - starts_at)) / 60)::int, 1) as minute
    from webinar_sessions
    where webinar_id = v_webinar
  ) s
  where w.id = v_webinar and s.prima is not null;

  return null;
end;
$$;

create trigger webinar_sessions_sincronizare
  after insert or update or delete on webinar_sessions
  for each row execute function sincronizeaza_program();
```

`and s.prima is not null` e important: între ștergerea sesiunilor vechi și
inserarea celor noi tabelul e gol pentru o clipă, iar `starts_at` e `not null`.
Trigger-ul lasă atunci valorile vechi în loc să cadă. Fereastra aia nu se vede
oricum din afară, pentru că scrierea trece prin RPC-ul de la §3.5.

`duration_min` rămâne, dar devine **suma minutelor**, calculată de bază. Nu se
mai afișează nicăieri (§6) — o ținem doar pentru că e în tipurile generate, în
`webinars_public` și în selectul emailurilor, iar ștergerea ei ar clătina fișiere
care n-au treabă cu schimbarea asta.

### 3.4 Backfill

```sql
insert into webinar_sessions (webinar_id, starts_at, ends_at)
select id, starts_at, starts_at + make_interval(mins => duration_min)
from webinars;
```

Fiecare eveniment existent devine un eveniment cu o singură sesiune, identică
cu ce era. Trigger-ul rescrie apoi `ends_at` pe părinte.

### 3.5 Scrierea, într-o singură tranzacție

```sql
create function set_webinar_sessions(p_webinar_id uuid, p_sessions jsonb)
returns void
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if jsonb_array_length(p_sessions) = 0 then
    raise exception 'Un eveniment are nevoie de cel puțin o întâlnire.';
  end if;

  delete from webinar_sessions where webinar_id = p_webinar_id;

  insert into webinar_sessions (webinar_id, starts_at, ends_at, label)
  select p_webinar_id,
         (s->>'starts_at')::timestamptz,
         (s->>'ends_at')::timestamptz,
         nullif(btrim(coalesce(s->>'label', '')), '')
  from jsonb_array_elements(p_sessions) s;
end;
$$;

grant execute on all routines in schema public to service_role;
revoke all on all routines in schema public from anon, authenticated;
```

Șterge și rescrie, nu diff: lista are două-trei rânduri, iar un diff ar aduce
identificatori pe care formularul ar trebui să-i poarte degeaba.

### 3.6 View-ul, recreat

`webinars_public` selectează `w.*`, iar Postgres expandează asta o singură dată,
la creare — la fel ca la `useful_info` și la preț. Deci `ends_at` nu apare de la
sine. Drop și recreare, cu un lateral în plus:

```sql
left join lateral (
  select jsonb_agg(
           jsonb_build_object('starts_at', se.starts_at,
                              'ends_at',   se.ends_at,
                              'label',     se.label)
           order by se.starts_at
         ) as sessions
  from webinar_sessions se
  where se.webinar_id = w.id
) ses on true
```

Granturile revin singure, prin `alter default privileges` din migrația de RLS.

### 3.7 Două filtre care devin greșite

Ambele întreabă `starts_at >= now()`. Pentru un eveniment de trei zile aflat în
ziua a doua, asta e fals — și evenimentul dispare de pe hub fix în timp ce se
desfășoară. Se schimbă în `ends_at >= now()`:

- `dashboard_stats()`, la `next_webinar` și la lista de evenimente viitoare
  (`20260827220000_view_uri_si_functii.sql`, în jur de rândul 431);
- `getWebinariiHub()`, în `lib/webinars/queries.ts:57`.

Garda din `register_for_webinar` **rămâne** pe `starts_at`: înscrierile se
închid când începe prima întâlnire. La un atelier de trei zile, cine se înscrie
în ziua a treia n-are ce recupera.

## 4. Validare și acțiune

`lib/validations/webinar.ts`:

- `starts_at` și `duration_min` ies din schemă.
- intră `sessions`, cu aceeași regulă de moment absolut ca acum — regexul care
  cere `Z` sau un decalaj explicit, ca ora să nu se mai poată strecura naivă:

```ts
sessions: z
  .array(
    z.object({
      starts_at: z.string().regex(ISO_CU_FUS, 'Alege data și ora.'),
      ends_at:   z.string().regex(ISO_CU_FUS, 'Alege ora de final.'),
      label:     optional(120),
    }),
  )
  .min(1, 'Adaugă cel puțin o întâlnire.')
  .max(14, 'Cel mult paisprezece întâlniri.')
  .superRefine(verificaProgram)
```

`verificaProgram` verifică trei lucruri, cu eroarea pusă pe rândul vinovat:
finalul după început, fără suprapuneri, și — după sortare — fără două sesiuni
identice.

`app/(admin)/admin/webinarii/actions.ts`:

- `citesteFormular` citește sesiunile ca liste paralele, exact cum citește azi
  întrebările FAQ: `formData.getAll('sesiune_start' | 'sesiune_end' | 'sesiune_label')`,
  împerecheate pe index, cu rândurile complet goale aruncate.
- `starts_at: new Date(...).toISOString()` dispare din `valori`.
- după `sincronizeazaSpeakeri`, un apel nou:
  `supabase.rpc('set_webinar_sessions', { p_webinar_id: webinarId, p_sessions: sesiuni })`.
- la inserare, webinarul se creează cu `starts_at` = startul primei sesiuni
  (coloana e `not null`), iar trigger-ul îl confirmă o clipă mai târziu.

## 5. Formularul din admin

Secțiunea **Programare** devine o listă. Pentru fiecare rând:

| Câmp | Control |
|---|---|
| Începe | `SelectorDataOra` — cel existent, nemodificat |
| Se termină | `SelectorOra` — component nou, doar orele și minutele |
| Etichetă | `Input` opțional: „Ziua 1: Fundamentele" |

`SelectorOra` e cele două coloane derulante din `SelectorDataOra`, scoase într-un
component separat pe care îl folosesc amândouă. Nu se dublează codul, se împarte.

**Ora de final e pe aceeași zi cu începutul.** Dacă e mai mică sau egală, o
citim ca fiind a doua zi, iar sub câmp scrie explicit „se termină a doua zi" —
altfel un atelier de seară, 22:00–01:00, n-ar avea cum să fie exprimat.

Butoane:

- **Adaugă o zi** — clonează ultimul rând, cu data mutată cu o zi înainte și
  aceleași ore. E cazul obișnuit; nimeni nu vrea să reintroducă 10:00–14:00 de
  trei ori.
- **Șterge** pe fiecare rând, ascuns când a mai rămas unul singur.

Un eveniment cu o singură întâlnire arată aproape ca azi: un rând, fără listă
vizibilă în jurul lui. Complexitatea apare doar dacă o ceri.

## 6. Afișarea publică

Fișier nou, `lib/program.ts`, ca `lib/format.ts` să nu ajungă un depozit:

```ts
export type Sesiune = { starts_at: string; ends_at: string; label?: string | null }

formateazaInterval(s)          // „19:00–20:30"
formateazaProgramScurt(lista)  // pentru insigne și carduri
formateazaProgramLung(lista)   // rândurile din tabelul de detalii
rezumatProgram(lista)          // „3 întâlniri · 12 ore în total"
urmatoareaSesiune(lista, acum) // pentru bara de sus
```

`formateazaProgramScurt` are trei forme, în ordinea în care le încearcă:

| Caz | Rezultat |
|---|---|
| o sesiune | `23 septembrie 2026, 19:00–20:30` |
| zile consecutive, aceleași ore | `23–25 septembrie 2026 · 10:00–14:00` |
| orice altceva | `23 sept – 25 sept 2026 · 3 întâlniri` |

A doua formă e cazul real al Andreei și merită să arate bine, nu doar corect.

Ce se schimbă la afișare:

- **`app/(public)/webinar/[slug]/page.tsx`** — rândul „Durata: 720 de minute"
  dispare. În locul lui, „Program", cu lista sesiunilor sub el; insigna cu data
  ia `formateazaProgramScurt`, iar cea verde ia `rezumatProgram`.
- **`app/(public)/page.tsx`** — cardurile și evenimentul evidențiat iau tot
  `formateazaProgramScurt`.
- **`components/brand/bara-sticky.tsx`** — primește lista, nu un singur moment.
  Numărătoarea merge spre **următoarea** sesiune, nu spre prima. În timpul unei
  sesiuni scrie „În desfășurare", iar între zile revine la numărătoare. Textul
  „Următoarea întâlnire se anunță în curând" apare abia după ultima sesiune —
  azi ar fi apărut în seara primei zile.
- **`app/(public)/inscriere-confirmata/page.tsx`** — același rând de program.

Insigna „720 de minute" e motivul pentru care `duration_min` nu se mai afișează
nicăieri: numărul e corect și nu spune nimic.

## 7. Calendar

`lib/ics.ts` primește o listă de sesiuni și scrie **câte un `VEVENT` pentru
fiecare**, într-un singur `VCALENDAR`. UID-urile se derivă din cel al
evenimentului: `slug-s1@…`, `slug-s2@…` — altfel calendarele suprascriu
intrările între ele. Alarma de o oră rămâne pe fiecare.

`app/api/calendar/[slug]/route.ts` doar transmite lista.

**Google Calendar** nu știe să primească mai multe evenimente printr-un link de
tip `TEMPLATE`. Deci în `components/public/butoane-calendar.tsx`:

- o singură sesiune → cele două butoane de azi, neschimbate;
- mai multe → un singur buton, „Adaugă toate cele 3 întâlniri (.ics)".
  Fișierul se importă și în Google Calendar, deci nimeni nu pierde nimic.

Evenimentul GA4 `add_to_calendar` primește `metoda: 'ics_multiplu'` pentru cazul
nou, ca rapoartele să nu amestece două lucruri diferite.

## 8. Emailuri

`emails/tipuri.ts` — `DateWebinar` schimbă `startsAt` + `durationMin` pe
`sesiuni: Sesiune[]`.

`lib/email/destinatar.ts` — selectul devine
`'…, webinar_sessions(starts_at, ends_at, label), …'`. PostgREST aduce copiii
într-un singur apel; nu e nevoie de o a doua interogare.

`emails/confirmare.tsx` și `emails/reminder.tsx` — rândurile „Când" și „Durată"
devin un singur rând „Program", cu o linie per sesiune. La un eveniment cu o
singură întâlnire, iese exact textul de azi, deci vocea rescrisă acum câteva
zile rămâne neatinsă.

`emails/anunt-lista.tsx` la fel. `emails/followup.tsx` nu se trimite, dar
tipurile trebuie să compileze — se actualizează odată cu celelalte.

Antetul din `lib/email/trimite.ts:99` („`titlu — data`") ia
`formateazaProgramScurt`.

## 9. Reamintirile — o decizie de luat

Cele trei funcții de revendicare folosesc `webinars.starts_at`, care rămâne
prima sesiune. Deci **fără nicio schimbare, reamintirile pleacă înainte de prima
zi** — cu 24h, și apoi cu 1h (online) sau 3h (fizic).

Pentru un atelier de trei zile, asta e incomplet: în ziua a doua și a treia
nimeni nu mai primește nimic.

Reamintirea per sesiune nu încape în modelul de acum: starea trimiterii stă pe
`registrations`, câte o coloană per tip de reamintire, deci o înscriere nu poate
ține minte decât o trimitere. Ar cere un tabel `session_reminders`
`(registration_id, session_id, kind, sent_at)` și rescrierea celor două funcții
de revendicare.

**Recomandarea mea:** faza asta rămâne pe prima sesiune, iar reamintirea per zi
se face separat, după ce vedem un eveniment de mai multe zile trecând printr-un
ciclu întreg. E o schimbare care merită făcută pe date reale, nu pe presupuneri —
și e singura bucată din plan care se poate amâna fără să lase ceva pe jumătate.

## 10. Ce nu se schimbă

Sortările, indexurile, ISR-ul și `getSlugsPublicate`, capacitatea și lista de
așteptare, prețul, prezența, GA4 și Meta, exporturile CSV, retenția. Toate
depind de `webinars.starts_at`, care înseamnă în continuare același lucru:
momentul în care începe evenimentul.

## 11. Ordinea

1. Migrația: tabel, trigger, `ends_at`, backfill, RPC, view recreat, cele două
   filtre din §3.7. O singură migrație, tranzacțională — ori intră toată, ori
   nimic.
2. `supabase gen types` → `lib/database.types.ts`.
3. `lib/program.ts`, cu formatările. Se poate verifica izolat, înainte să atingă
   vreo pagină.
4. Schema de validare și acțiunea.
5. `SelectorOra` scos din `SelectorDataOra`, apoi lista de sesiuni din formular.
6. Paginile publice, bara de sus, pagina de mulțumire.
7. `lib/ics.ts` și butoanele de calendar.
8. Emailurile.
9. `supabase/seed.sql`, ca baza locală să pornească cu sesiuni.

## 12. Riscuri

- **Recrearea view-ului.** `dashboard_stats()` îl folosește, dar are corp-șir și
  se leagă la execuție, deci nu blochează drop-ul. Verificat deja la migrația de
  preț și la cea de scoatere a hibridului.
- **Fereastra fără sesiuni.** Ștergerea și inserarea trec prin RPC, într-o
  singură tranzacție, iar trigger-ul nu scrie când tabelul e gol. Fără RPC, un
  eșec la jumătate ar lăsa un eveniment fără program și cu `starts_at` vechi.
- **Ora de final peste miezul nopții.** Regula „mai mic înseamnă a doua zi" e
  corectă, dar invizibilă dacă nu scrie pe ecran. De-aia textul de sub câmp face
  parte din implementare, nu din finisaj.
- **Evenimentele existente.** Backfill-ul le duce la o sesiune, identică. După
  migrație verific direct în bază că `starts_at` și `duration_min` au rămas
  aceleași valori pe cele două evenimente reale.
