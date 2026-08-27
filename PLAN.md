# Plan de implementare — varianta pe planuri gratuite

## Platformă webinarii + mini-CRM — Magia Uleiurilor Esențiale

Însoțește `brief-webinar-crm-magia-uleiurilor.md` v2.0. Brieful spune **ce** construim; documentul ăsta spune **în ce ordine**, **cu ce decizii luate** și **ce se pierde** dacă totul rămâne pe planuri gratuite.

**Stare la 27 august 2026:** repo gol, remote `alinc98/webinars-magia-uleiurilor`. Design-ul de admin există în Claude Design (§19.1). Design-ul paginilor publice nu e făcut încă — prompt-ul din §16 nu a fost rulat.

**Două abateri de la brief, cerute explicit:** fără Drizzle, și totul pe planuri gratuite.

---

## 1. Fără Drizzle — cum arată accesul la date

Brieful împarte rolurile: Drizzle pentru interogări, `supabase-js` pentru auth, storage și realtime. Eliminăm prima jumătate și rămâne **un singur mod de a vorbi cu baza de date**.

### Ce se schimbă

| Aspect     | În brief (Drizzle)                            | Acum                                                         |
| ---------- | --------------------------------------------- | ------------------------------------------------------------ |
| Schema     | `db/schema.ts` în TypeScript                  | Fișiere `.sql` în `supabase/migrations/`, versionate în repo |
| Migrații   | `drizzle-kit`                                 | Supabase CLI (`supabase migration new` / `db push`)          |
| Tipuri     | Derivate din schema TS                        | `supabase gen types typescript` → `lib/database.types.ts`    |
| Interogări | Query builder Drizzle                         | `supabase-js` cu client `service_role`, pe server            |
| Conexiune  | `DATABASE_URL` + `DIRECT_URL`, pooler pe 6543 | **Niciuna.** Totul prin HTTP spre PostgREST                  |

Câștigul real nu e „un tool mai puțin", ci **dispariția conexiunii directe la Postgres**: fără pooler de configurat, fără `prepare: false`, fără epuizare de conexiuni în serverless, fără două string-uri de conexiune care se pot încurca între dev și prod. Pe planul gratuit, unde limita de conexiuni e mai mică, ăsta e un avantaj concret, nu unul teoretic.

### Ce devine mai greu, și cum rezolvăm

PostgREST e excelent la citiri simple și slab la orice are agregări sau mai multe scrieri legate. Trei situații din proiectul ăsta intră în categoria a doua:

**1. Înscrierea trebuie să fie atomică.** Verifică locurile → upsert contact → insert înscriere → insert activitate. Patru operațiuni care nu au voie să se execute pe jumătate. PostgREST nu are tranzacții pe mai multe cereri.

→ **O funcție plpgsql**, `register_for_webinar(...)`, apelată cu `supabase.rpc()`. Face tot înăuntru, într-o singură tranzacție, cu `SELECT ... FOR UPDATE` pe rândul de webinar pentru capacitate. E soluția corectă indiferent de ORM — cu Drizzle ar fi trebuit oricum să juggle-uiești o tranzacție din aplicație, ceea ce e mai fragil.

**2. Lista de lead-uri cu filtre și numărul de webinarii per contact.**

→ **Un view**, `contacts_with_stats`. PostgREST filtrează, sortează și paginează pe view-uri exact ca pe tabele, deci filtrele din `searchParams` merg direct.

**3. Cifrele de pe dashboard și graficul pe zile.**

→ **Două funcții RPC**, `dashboard_stats()` și `leads_per_day(days int)`, fiecare returnând `json`.

Total: aproximativ patru funcții și trei view-uri, toate SQL simplu în fișierele de migrație. Pentru partea de raportare e mai curat decât un query builder.

### Regula care nu se încalcă

Există **două** clienți Supabase, cu roluri strict separate:

- `lib/supabase/server.ts` — cheia `anon` + sesiunea utilizatorului, prin `@supabase/ssr`. **Doar pentru auth.** Nu citește date de business.
- `lib/supabase/admin.ts` — cheia `service_role`. Toate citirile și scrierile de business, exclusiv pe server. **Niciodată importat într-o componentă marcată `"use client"`.**

Un ESLint rule sau o simplă convenție de naming care face greșeala evidentă merită cele zece minute de setup.

### RLS: activat peste tot, cu zero politici

Brieful spune „RLS pe toate tabelele, cu excepție pentru webinariile publicate". Excepția nu e necesară — paginile publice citesc prin `service_role`, pe server, care oricum ignoră RLS.

Deci: `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` pe toate tabelele, **fără să scrii nicio politică**. Zero politici înseamnă zero acces pentru cheia `anon` vizibilă în browser. Rolul `service_role` trece pe deasupra.

Fără Drizzle, asta devine mai importantă decât era: acum aceeași bibliotecă e folosită și în browser (pentru auth), și pe server. RLS e singurul lucru care separă cele două căi.

---

## 2. Ce pierzi pe planurile gratuite

Trei limite contează cu adevărat. Restul se rezolvă fără compromis.

### 2.1 Vercel Cron nu funcționează pe Hobby — și nu e o problemă

Hobby permite **două cron job-uri, declanșate o dată pe zi**. Reminderele de 24h și 1h sunt imposibile.

**Soluție: GitHub Actions.** Un workflow programat din 15 în 15 minute care face un `curl` spre `/api/cron/reminders` cu `CRON_SECRET` în header. Repo-ul e deja pe GitHub, deci nu e furnizor nou.

```yaml
on:
  schedule:
    - cron: '*/15 * * * *'
```

Un job de ~15 secunde × 2880 rulări/lună ≈ 720 minute, sub cele 2.000 gratuite pentru repo privat. Pe repo public e nelimitat.

**Atenție la un lucru:** cron-ul GitHub poate întârzia, uneori 5–20 de minute, la ore de vârf. Pentru reminderul de 24h e irelevant. Pentru cel de 1h e tolerabil dacă job-ul **caută tot ce e scadent într-o fereastră**, nu doar ce e scadent exact acum. Combinat cu idempotența de la 3.3, întârzierile și rularea dublă nu produc nici emailuri pierdute, nici duplicate.

Bonus: același mecanism acoperă și backup-ul, și keep-alive-ul de la 2.2. Un singur loc, trei job-uri.

### 2.2 Supabase Free pune proiectul în pauză după 7 zile fără trafic

Nu se întâmplă în timpul unei campanii — orice cerere resetează contorul. Se întâmplă **între campanii**, exact când nu te uiți, și atunci pagina publică e moartă.

**Soluție:** un al doilea workflow GitHub Actions, o dată pe zi, care face `curl` spre `/api/health`, care face o interogare trivială în bază. Cinci linii de YAML.

Alte limite ale planului gratuit, în context:

| Limită                       | Cât înseamnă concret                                             |
| ---------------------------- | ---------------------------------------------------------------- |
| 500 MB bază de date          | Zeci de mii de contacte. Nu e o constrângere reală.              |
| 1 GB storage                 | ~500 de coperți și poze de speakeri în WebP. Suficient ani buni. |
| 2 proiecte per organizație   | Exact dev + prod. Fix ce ne trebuie, fără rezervă.               |
| Fără backup automat          | Rezolvat cu `pg_dump` săptămânal în GitHub Actions.              |
| Fără transformări de imagine | Vezi 2.4.                                                        |

### 2.3 Resend Free: 100 de emailuri pe zi — ăsta e adevăratul prag

Prima limită care se lovește, și nu e nici Vercel, nici Supabase.

Un webinar cu 200 de înscriși generează, grupat în jurul unei singure zile: 200 de remindere la 24h, 200 la 1h, 200 de follow-up-uri. **Peste 600 de emailuri într-o zi, față de o limită de 100.** Nu e o degradare, e o defecțiune: oamenii nu primesc linkul de Zoom.

Ce se poate face gratuit:

- **Sub ~30 de înscriși per webinar, funcționează.** 30 × 3 emailuri = 90/zi. Pentru primul webinar de test e exact suficient.
- Peste atât, cron-ul trebuie să eșaloneze trimiterile pe mai multe zile — ceea ce distruge sensul unui reminder de 1h.

**Recomandarea mea:** ăsta e primul loc unde merită cheltuiți bani, înaintea Vercel Pro și înaintea Supabase Pro. Resend cu 20 $/lună acoperă 50.000 de emailuri. Dacă bugetul de reclame e de 300 €, 20 $ pentru ca înscrișii să primească efectiv linkul nu e o decizie grea.

Până atunci, planul e construit complet și funcționează — doar cu plafonul ăsta deasupra.

### 2.4 Optimizarea de imagini, ocolită complet

Vercel Hobby limitează imaginile procesate de `next/image`, iar transformările de imagine din Supabase Storage nu sunt pe planul gratuit.

**Soluție care le evită pe amândouă:** redimensionăm la upload, în admin. Coperta se salvează direct ca WebP la 1200 px lățime, poza de speaker ca pătrat de 400 px. Se servesc ca atare, cu `unoptimized`. Zero procesare la runtime, fișiere mai mici decât ar fi ieșit oricum din optimizatorul automat, și niciun plafon de atins.

E și practică mai bună, nu doar workaround.

### 2.5 Analytics

Vercel Analytics pe Hobby are un plafon de evenimente. **Cloudflare Web Analytics** e gratuit, nelimitat și fără cookie-uri — deci și fără consimțământ suplimentar. Brieful îl dă deja ca alternativă echivalentă în §5. Nu se pierde nimic.

### 2.6 Termenii Vercel Hobby

Planul Hobby e destinat folosirii non-comerciale. O pagină de campanie plătită pentru o clientă e uz comercial.

În practică, aplicarea e rară și de obicei începe cu un email. Riscul nu e mărimea amenzii, ci **momentul**: dacă apare o suspendare, apare când site-ul are trafic, adică în mijlocul campaniei.

Recomandarea pragmatică: **construiește tot pe Hobby, treci pe Pro în ziua în care pornește bugetul de reclame.** Până atunci nu e uz comercial, e dezvoltare. Iar 20 $ în ziua în care începi să plătești Meta e o rotunjire.

Dacă vrei să rămâi gratuit inclusiv în campanie, alternativa cu termeni permisivi e Netlify pe planul gratuit. Nu o recomand pentru un proiect Next.js 15 cu App Router — suportul e bun, dar nu nativ, și nu merită să afli asta cu bugetul pornit.

### 2.7 Recapitulare cost

| Serviciu                   | Plan              | Cost         |
| -------------------------- | ----------------- | ------------ |
| Vercel                     | Hobby             | 0 $          |
| Supabase ×2                | Free              | 0 $          |
| Resend                     | Free — **100/zi** | 0 $          |
| GitHub Actions             | inclus            | 0 $          |
| Cloudflare DNS + Analytics | Free              | 0 $          |
| Sentry                     | Developer         | 0 $          |
| **Total**                  |                   | **0 $/lună** |

**Ordinea în care merită cheltuit, dacă se cheltuie:**

1. **Resend 20 $** — la primul webinar cu peste ~30 de înscriși. Fără el, funcționalitatea de bază cedează.
2. **Vercel Pro 20 $** — în ziua în care pornește bugetul de reclame. Termeni curați și cron nativ, dacă vrei să scapi de GitHub Actions.
3. **Supabase Pro 25 $** — cel mai târziu dintre toate. Când baza depășește 500 MB sau când vrei PITR. Poate dura un an.

---

## 3. Corecții tehnice la brief

Independente de discuția despre planuri gratuite.

### 3.1 Reminderul de 3h pentru evenimente fizice n-are coloană

§8 îl descrie în text, §6 are doar `reminder_1h_sent_at`. Redenumesc coloana în **`reminder_short_sent_at`**, cu offset-ul calculat din `webinars.format`: 1h la `online`, 3h la `fizic` și `hibrid`.

### 3.2 Normalizarea emailului

`contacts.email` se face lowercase și trim **înainte** de inserare, cu index unic pe forma normalizată. Altfel `Ana@x.ro` și `ana@x.ro` devin doi contacți și CRM-ul se strică exact așa cum avertizează brieful în §6 că nu trebuie.

### 3.3 Idempotența cron-ului nu e opțională

Rulare la 15 minute, plus reîncercări, plus întârzieri GitHub → dublă trimitere garantată la un moment dat.

```sql
UPDATE registrations SET reminder_24h_sent_at = now()
WHERE id = ANY($1) AND reminder_24h_sent_at IS NULL
RETURNING id;
```

Marchezi **înainte** de a trimite, și trimiți doar rândurile returnate. Endpoint-ul verifică `Authorization: Bearer ${CRON_SECRET}` — altfel oricine îl poate declanșa în buclă.

### 3.4 Capacitatea și suprarezervarea

Două formulare trimise simultan pe ultimul loc trec amândouă, dacă verificarea și inserarea nu sunt în aceeași tranzacție cu `FOR UPDATE`. Rezolvat prin funcția `register_for_webinar` de la 1.

### 3.5 Realtime pe dashboard — Faza 2

Postgres Changes trece prin RLS cu JWT-ul utilizatorului, deci ar cere exact politicile `SELECT` pe care le eliminăm la punctul 1. În Faza 1: `router.refresh()` la 20 de secunde pe dashboard. Vizual identic, zero complexitate arhitecturală. Realtime e disponibil și pe planul gratuit — deci e o amânare, nu o renunțare.

---

## 4. Milestone-uri

Zile de lucru efective, nu calendaristice.

### M0 — Fundație (0,5 zile)

- `pnpm create next-app` — TypeScript, App Router, Tailwind v4, alias `@/`
- `engines.node = "24.x"` (local ai 26, Vercel rulează 24 — fără pin apar diferențe)
- shadcn/ui init
- Supabase CLI ca dev dependency; **fără Docker** — lucrăm direct pe proiectul cloud de dev
- Cele două proiecte Supabase, **ambele în `eu-central-1` Frankfurt**. Regiunea nu se mai poate schimba ulterior fără migrarea completă a bazei
- Commit, push, proiect Vercel legat de repo

_Mai scurt decât în varianta cu Drizzle: nu mai e nimic de configurat pentru conexiune._

### M1 — Schema (1 zi)

- Prima migrație: cele 9 tabele din §6, cu corecția de la 3.1
- Enum-uri native pentru `status`, `format`, `kind`, `role_label`, `email_log.status`
- Indexuri: `webinars.slug` unic, `webinars.starts_at`, `contacts.email` unic pe forma normalizată, `registrations (contact_id, webinar_id, kind)` unic, `activities.contact_id`, `registrations.webinar_id`
- A doua migrație: view-urile și funcțiile RPC de la punctul 1
- A treia migrație: RLS activat peste tot, zero politici
- `supabase gen types typescript` → `lib/database.types.ts`, comis în repo
- Seed cu date realiste în română pe proiectul de dev

**Gata când:** un `curl` spre PostgREST cu cheia `anon` nu returnează niciun rând din `contacts`.

### M2 — Fluxul public de înscriere (2,5 zile)

Partea din care iese sau nu iese primul lead. Se construiește cu markup provizoriu, fără să aștepte design-ul.

- Scheme Zod partajate în `lib/validations/` — o singură definiție pentru client, server și tipuri
- `POST /api/inscriere`: honeypot → rate limit (tabel Postgres, nu Upstash) → Zod → `rpc('register_for_webinar')` → email → CAPI
- `POST /api/lista-asteptare`, `POST /api/replay` — aceeași structură
- Captură UTM și `fbclid`: prima atingere pe `contacts`, ultima pe `registrations`
- `/webinar/[slug]` cu ISR, `revalidatePath` la publicarea din admin
- Hub la `/`, inclusiv starea goală cu formular
- `/inscriere-confirmata` cu `noindex`
- Generare `.ics` — `location` la evenimentele fizice, `join_url` la cele online
- `/api/health` pentru keep-alive-ul de la 2.2

**Gata când:** un submit real creează contact + înscriere + activitate, iar al doilea submit pe același email nu duplică nimic.

### M3 — Email (1,5 zile)

- Domeniu verificat în Resend, **regiune EU selectată la creare** (nu se schimbă după), SPF + DKIM + DMARC în Cloudflare
- Template-uri React Email: confirmare (online / fizic), reminder 24h, reminder scurt, follow-up prezenți, follow-up absenți, acces replay, anunț listă de așteptare
- Testate în Gmail, Outlook și Apple Mail — nu doar în preview-ul local. Diacriticele se rup în clienți reali, nu în preview
- Dezabonare cu token: `/dezabonare/[token]`
- `email_log` populat la fiecare trimitere
- `POST /api/webhooks/resend` cu verificare de semnătură
- `/api/cron/reminders` cu idempotența de la 3.3
- **Workflow GitHub Actions** la 15 minute, plus keep-alive zilnic, plus `pg_dump` săptămânal

**Gata când:** o înscriere de test primește confirmarea în sub 30 de secunde, cu `.ics` care se deschide corect pe telefon. Și: cron-ul rulat de două ori la rând trimite un singur email.

### M4 — Admin, Faza 1 (3 zile)

- Supabase Auth magic link, **signup public dezactivat**
- `middleware.ts` — protejează `(admin)`, verifică emailul în `admin_users`, face refresh de sesiune
- CRUD webinarii cu formularul din §7.2: format condiționat, comutatoarele `listed` / `is_featured` / `replay_public`, duplicare
- `is_featured` exclusiv — dezactivarea celui anterior în aceeași tranzacție
- Upload copertă **cu redimensionare la client înainte de upload** (vezi 2.4)
- Bibliotecă de speakeri, relația `webinar_speakers` cu reordonare
- Listă de lead-uri: TanStack Table peste view-ul `contacts_with_stats`, filtre în `searchParams`, export CSV
- Administrarea hub-ului și lista de așteptare cu „Anunță lista"

**Gata când:** creezi un webinar nou de la zero în sub 5 minute și pagina publică există imediat.

### M5 — Import design (2 zile)

Două sesiuni Claude Code **separate**, cu prompt-urile din §19.1 și §19.3.

1. Rulează §16 în Claude Design pentru paginile publice, iterează pe copy și vizual
2. Rulează §18 (partea publică) **în aceeași conversație** — speakeri și evenimente fizice
3. Import admin (§19.1), sesiune proprie
4. Import public (§19.3), sesiune proprie
5. Tokenii din design system devin sursa unică în `@theme` din `globals.css`
6. Verifică ș și ț în Fraunces și Inter — cu virgulă dedesubt, nu cu sedilă

**Gata când:** LCP sub 2s pe mobil în Lighthouse, sub 500 KB pe pagina de webinar.

### M6 — Conformitate și tracking (1,5 zile)

- Banner de consimțământ cu Consent Mode — pixelul se încarcă **după** acceptare
- Pixel + CAPI cu `event_id` identic pe ambele căi, testat în Test Events
- Politică de confidențialitate și de cookies pe subdomeniu
- „Șterge definitiv contactul" — șterge contactul, anonimizează înscrierile, păstrează statistica agregată
- Export JSON al datelor unui contact
- Text de consimțământ versionat în `setari`
- Sentry pe `/api/inscriere`, cu alertă pe prima eroare
- **DPA semnat între tine și clientă**

**Gata când:** Meta Pixel Helper arată `Lead` o singură dată, deduplicat corect între browser și server.

### M7 — Lansare (1 zi)

- `webinar.magia-uleiurilor.ro` → CNAME spre Vercel, **proxy dezactivat (DNS only)**
- Variabile de mediu separate Preview (Supabase dev) / Production (Supabase prod). `SUPABASE_SERVICE_ROLE_KEY` fără prefix `NEXT_PUBLIC_`, marcat sensitive
- Test end-to-end cu adresă reală, de pe telefon
- Verificat că `pg_dump`-ul produce un dump efectiv restaurabil — un backup netestat nu e backup
- Link din meniul WordPress spre hub
- **Decizia despre Vercel Pro și Resend** (vezi 2.3 și 2.6), înainte de a porni bugetul
- Buget de test 3–5 zile, o singură reclamă

**Total M0–M7: ~13 zile de lucru.**

---

## 5. Ce blochează ce

**Nimic din M0–M4 nu depinde de clientă.** Backendul, API-urile, fluxurile de email și tot adminul se construiesc cu date de test.

| De la clientă                                    | Blochează                              |
| ------------------------------------------------ | -------------------------------------- |
| Acces DNS                                        | M3 (SPF/DKIM/DMARC) și M7 (subdomeniu) |
| Email pe domeniu propriu                         | M3                                     |
| Acces Meta Business Manager                      | M6 — Pixel ID și token CAPI            |
| Logo SVG                                         | M5 — culorile exacte                   |
| 3–5 fotografii cu Andreea                        | M5                                     |
| 3 testimoniale cu acord scris                    | M5                                     |
| Data, titlul, cele 5 puncte ale primului webinar | M7                                     |
| Bonusul PDF                                      | M3 — follow-up-ul către prezenți       |
| Confirmare politică dōTERRA                      | M7 — înainte de buget                  |
| DPA semnat                                       | M7                                     |

**De cerut în prima conversație:** accesul DNS și cel la Meta. Durează cel mai mult la ea și n-au nicio legătură cu cât de departe ai ajuns cu codul.

---

## 6. Variabile de mediu

Mai puține decât în varianta cu Drizzle — nu mai există string de conexiune la runtime.

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=         # sensitive, doar server
RESEND_API_KEY=
RESEND_WEBHOOK_SECRET=
EMAIL_FROM=                        # contact@magia-uleiurilor.ro
META_PIXEL_ID=
META_CAPI_TOKEN=
META_TEST_EVENT_CODE=              # doar în preview
CRON_SECRET=
NEXT_PUBLIC_SITE_URL=
SENTRY_DSN=
```

Separat, doar ca secret în GitHub Actions pentru `pg_dump`: `SUPABASE_DB_URL`.

## 7. Structura de fișiere

Ca în §5 al briefului, cu `db/` înlocuit și cu ce lipsește de acolo:

```
supabase/
  migrations/               # SQL versionat: tabele, view-uri, funcții, RLS
  seed.sql
app/
  (public)/dezabonare/[token]/page.tsx
  (admin)/speakeri/page.tsx
  api/health/route.ts       # keep-alive Supabase
  api/webhooks/resend/route.ts
lib/
  database.types.ts         # generat, comis în repo
  supabase/
    server.ts               # anon + sesiune — DOAR auth
    admin.ts                # service_role — doar server
    middleware.ts
  validations/
  email/
  rate-limit.ts
  ics.ts
  utm.ts
.github/workflows/
  ci.yml                    # typecheck, lint, build
  cron.yml                  # remindere la 15 min
  keepalive.yml             # zilnic, împotriva pauzei Supabase
  backup.yml                # pg_dump săptămânal
```

## 8. QA înainte de a porni bugetul

- [ ] Submit dublu pe același email, webinarii diferite → un contact, două înscrieri
- [ ] Submit dublu pe același webinar → nu duplică, mesaj clar
- [ ] Honeypot completat → succes fals, fără scriere în bază
- [ ] Rate limit atins → 429, fără să blocheze utilizatori legitimi din spatele aceluiași IP mobil
- [ ] Cheia `anon` nu returnează niciun rând din `contacts`
- [ ] `service_role` nu apare în niciun bundle de client (`grep` în `.next/static`)
- [ ] `.ics` se deschide corect pe iOS și Android, cu ora corectă pentru `Europe/Bucharest`
- [ ] Cron rulat de două ori la rând → un singur email
- [ ] Cron întârziat cu 20 de minute → tot trimite, nu sare peste
- [ ] Dezabonare → cron-ul următor sare peste contact
- [ ] Diacritice corecte în emailuri, în CSV-ul exportat și în paginile publice
- [ ] Adminul utilizabil de pe telefon — tabelele devin carduri, nu se derulează orizontal
- [ ] Eveniment fizic la capacitate maximă → formular blocat, listă de așteptare funcțională
- [ ] Backup restaurat efectiv pe un proiect gol, măcar o dată

## 9. Riscuri

| Risc                                                     | Probabilitate                     | Mitigare                                                                                               |
| -------------------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------ |
| **Plafonul Resend lovit în ziua webinarului**            | **Mare, dacă webinarul reușește** | Vezi 2.3. Monitorizează numărul de înscriși; peste 30, upgrade înainte de ziua evenimentului, nu în ea |
| Cont de reclame blocat pentru copy neconform             | Medie                             | Verificare față de §4 înainte de fiecare campanie; dōTERRA nemenționat pe LP                           |
| Emailuri în spam la primele trimiteri                    | Medie                             | DMARC de la început, warm-up cu volume mici, from pe domeniu propriu                                   |
| Proiect Supabase pus în pauză între campanii             | Medie fără keep-alive, mică cu el | Workflow zilnic, vezi 2.2                                                                              |
| Suspendare Vercel Hobby pentru uz comercial              | Mică                              | Trecere pe Pro în ziua pornirii bugetului, vezi 2.6                                                    |
| Cron GitHub întârziat la ore de vârf                     | Medie                             | Fereastră de căutare, nu moment exact. Vezi 2.1                                                        |
| Trafic plătit pornit peste un bug în formular            | Mică                              | Sentry cu alertă pe `/api/inscriere`, test end-to-end obligatoriu în M7                                |
| Andreea nu reușește să creeze singură al treilea webinar | Medie                             | Criteriul de succes al proiectului. Un test cu ea, înainte de predare                                  |
