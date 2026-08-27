# Brief & propunere tehnică — Platformă webinarii + mini-CRM

## Magia Uleiurilor Esențiale (Andreea Gligor)

**Client:** Andreea Gligor — aromaterapeut, 8 ani experiență, wellness advocate dōTERRA
**Site principal:** magia-uleiurilor.ro (WordPress + Elementor + WooCommerce) — rămâne neatins
**Deliverable:** aplicație separată care conține landing page-uri de webinar generate dinamic + panou de administrare cu CRM propriu
**Sursă de trafic:** campanii Meta (Facebook + Instagram), ~85% mobil
**Versiune:** 2.0 — 27 august 2026

---

## 1. Ce construim, pe scurt

O singură aplicație, cu două fețe:

**Fața publică** — pagini de înscriere ultrarapide, câte una per webinar, generate automat din datele introduse în admin. URL de forma `webinar.magia-uleiurilor.ro/uleiuri-pentru-incepatori`. Plus pagina de mulțumire.

**Fața privată** — panou de administrare unde Andreea (și tu) creați webinarii, vedeți lead-urile cu date de contact, marcați prezența, trimiteți follow-up-uri și exportați liste.

Un singur repo, un singur deploy, o singură bază de date. Nu două sisteme care trebuie sincronizate.

### De ce nu ținem asta în WordPress

Site-ul actual nu poate susține o campanie plătită:

- Toate CTA-urile de pe `/evenimente-de-aromaterapie/` duc **în afara site-ului**, pe Facebook Events. Traficul plătit pleacă înainte să se convertească — zero lead-uri, zero evenimente de pixel, nimic de retargetat.
- Două butoane sunt efectiv rupte: `#https://www.facebook.com/...` (diez în față, ancoră invalidă) și `href="#"` sub webinarul principal.
- Elementor 3.12.2 e din primăvara lui 2023. Peste el, Slider Revolution cu 11 slide-uri și WooCommerce. LCP-ul pe mobil e aproape sigur slab, iar pe trafic plătit fiecare secundă costă bani.
- Meniul cu 40+ linkuri, coșul și căutarea oferă zeci de căi de ieșire dintr-o pagină care ar trebui să aibă exact una.
- Lead-urile se împart azi între un embed Mailchimp și un formular Fluent Forms — două liste care nu comunică.

Un plugin de CRM peste WordPress ar moșteni toate problemele de mai sus. Aplicația separată nu.

---

## 2. Obiectiv și KPI

**Obiectiv unic al paginii publice:** înscrierea la webinar. Nu vindem produse, nu trimitem spre shop, nu trimitem spre Facebook.

**Obiectivul CRM-ului:** ca fiecare lead să fie recuperabil, segmentabil și contactabil șase luni mai târziu, nu doar în ziua webinarului.

| Metrică                                    | Țintă rezonabilă    |
| ------------------------------------------ | ------------------- |
| Rată de conversie LP (trafic rece Meta)    | 20–30%              |
| Show-up rate la webinar                    | 35–45% din înscriși |
| LCP mobil pe pagina publică                | sub 2,0 s           |
| Timp de creare a unui webinar nou în admin | sub 5 minute        |

---

## 3. Publicul țintă

**Primar:** femei 28–50 ani, România, mame sau femei active, interesate de soluții naturale, wellness, reducerea stresului, îngrijirea naturală a familiei. Nivel: începător. Nu cunosc dōTERRA sau abia au auzit.

**Secundar:** persoane interesate de venit suplimentar din wellness — segment separat, cu webinar și pagină proprie. CRM-ul le distinge prin tag-uri.

**Ce le blochează înscrierea:**

- „Sigur o să încerce să-mi vândă ceva."
- „Nu am timp, cât durează?"
- „Nu știu nimic despre uleiuri, o să fiu pierdută."
- „Nu pot ajunge live la ora aia."

Pagina răspunde la toate patru, explicit.

---

## 4. ⚠️ Constrângeri de conformitate (citește înainte de a scrie copy)

Aromaterapie plus reclame plătite înseamnă trei seturi de reguli suprapuse:

**Meta Advertising Policies**

- Interzis să implici cunoașterea unui atribut personal, inclusiv starea de sănătate. ❌ „Suferi de anxietate?" → ✅ „Descoperă rutine simple pentru seri mai liniștite."
- Interzise imaginile before/after și rezultatele garantate.

**Legislație RO / ANPC / ANMDMR**

- Uleiurile esențiale nu sunt medicamente. Zero afirmații de tip tratează / vindecă / previne.
- Formulează pe „susține", „ritual", „stare de bine", „echilibru".

**Politica de conformitate dōTERRA pentru advocați**

- Reguli proprii privind revendicările de sănătate, cele de venit și folosirea mărcii în reclame plătite. **Verifică versiunea curentă cu clienta înainte de lansare** — un cont de reclame blocat costă mai mult decât o pagină întârziată.

**Recomandare:** brandul din reclame și de pe LP să fie **„Magia Uleiurilor" / Andreea Gligor**. dōTERRA se menționează abia în webinar sau după înscriere.

---

## 5. Stack tehnic

### Alegerea

| Strat               | Tehnologie                                                            | De ce                                                                                                                                                                                                                                           |
| ------------------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework           | **Next.js 15**, App Router, TypeScript                                | Un singur proiect servește și pagini statice ultrarapide, și un dashboard, și API-uri. Server Components înseamnă LP-uri fără JS inutil.                                                                                                        |
| UI                  | **Tailwind CSS v4** + **shadcn/ui**                                   | Componentele de admin (tabele, formulare, dialoguri) vin gata făcute și accesibile. Pagina publică se stilizează liber, fără să moștenească aspectul de dashboard.                                                                              |
| Tabele admin        | **TanStack Table**                                                    | Sortare, filtrare, paginare, selecție multiplă pe lista de lead-uri.                                                                                                                                                                            |
| Bază de date        | **Supabase** (PostgreSQL gestionat), regiune Frankfurt `eu-central-1` | Postgres complet, plus auth, storage și realtime în același serviciu. Un singur furnizor de configurat și un singur panou de administrat. Datele rămân în UE — obligatoriu pentru GDPR cu date de contact ale unor persoane fizice din România. |
| ORM                 | **Drizzle ORM** + drizzle-kit                                         | Schema și migrațiile stau versionate în repo, nu doar în panoul Supabase. Tipuri TypeScript derivate direct din schemă. Drizzle se conectează la Postgres-ul Supabase ca la orice alt Postgres.                                                 |
| Validare            | **Zod**                                                               | O singură schemă validează formularul în browser, în Server Action și la nivel de tip.                                                                                                                                                          |
| Autentificare admin | **Supabase Auth**, magic link pe email                                | Fără parole de gestionat. Doi utilizatori, listă albă de adrese. Sesiunile se citesc în Server Components prin `@supabase/ssr`.                                                                                                                 |
| Email tranzacțional | **Resend** + **React Email**                                          | Template-uri scrise ca React, previzualizabile local. Domeniu propriu cu SPF/DKIM/DMARC pentru livrabilitate.                                                                                                                                   |
| Job-uri programate  | **Vercel Cron**                                                       | Rulează din 15 în 15 minute și trimite remindere la 24h și 1h, plus follow-up la 2h după eveniment.                                                                                                                                             |
| Stocare imagini     | **Supabase Storage**, bucket public pentru coperți                    | Upload direct din admin cu URL semnat, transformări de imagine incluse. Rămâne în același furnizor ca baza de date, deci un singur set de chei.                                                                                                 |
| Live pe dashboard   | **Supabase Realtime**                                                 | Înscrierile apar în admin fără refresh — util în ziua evenimentului. Se activează pe tabelul `registrations` printr-o singură subscriere.                                                                                                       |
| Hosting             | **Vercel**                                                            | Suport nativ pentru Next.js, ISR, cron, preview per branch.                                                                                                                                                                                     |
| DNS                 | **Cloudflare** (contul existent)                                      | `webinar.magia-uleiurilor.ro` → CNAME spre Vercel, **cu proxy dezactivat (DNS only)**, altfel se bat certificatele.                                                                                                                             |
| Analytics           | **Vercel Analytics** sau **Cloudflare Web Analytics**                 | Fără cookie-uri, deci fără consimțământ suplimentar.                                                                                                                                                                                            |
| Erori               | **Sentry**                                                            | Formularul de înscriere e singurul lucru care nu are voie să pice în tăcere în timpul unei campanii.                                                                                                                                            |

### Alternative, ca să fie decizia conștientă

- **Neon + Auth.js + Cloudflare R2 în locul Supabase** — mai mult control pe sesiuni și un lock-in mai slab, dar trei furnizori de configurat în loc de unul. Merită doar dacă apare o cerință pe care Supabase Auth n-o acoperă.
- **FastAPI + React în locul Next.js** — ai deja infrastructura asta pentru Cabana și pentru dashboard-ul SmartBill. Avantajul real ar fi refolosirea backendului existent. Dezavantajul: două deploy-uri, două seturi de tipuri, iar pagina publică nu mai beneficiază de randare pe server out of the box. Pentru acest proiect, Next.js e alegerea mai curată; FastAPI rămâne varianta corectă doar dacă decizi să pui toate proiectele în același backend.

### Cum folosim Supabase, concret

Supabase e mai multe lucruri deodată, iar dacă nu împarți rolurile de la început ajungi cu două moduri de a face aceeași operațiune. Împărțirea propusă:

- **Drizzle** pentru schemă, migrații și toate interogările din server — CRUD pe webinarii, liste de lead-uri, rapoarte. Migrațiile stau în repo și se aplică prin CI, nu se editează tabele manual din panou.
- **`supabase-js`** exclusiv pentru autentificare, storage și realtime. Astea sunt lucrurile pe care Drizzle nu le acoperă.
- **Row Level Security activat pe toate tabelele, fără excepție.** Supabase expune Postgres printr-un API public: un tabel `contacts` cu RLS dezactivat înseamnă baza ta de lead-uri accesibilă oricui are cheia `anon`, care e vizibilă în browser. Politica implicită: nimeni nu citește nimic. Excepții doar pentru citirea webinariilor cu `status = 'published'`.
- **`service_role` key rămâne strict pe server**, în variabile de mediu Vercel, niciodată într-o componentă client și niciodată prefixată cu `NEXT_PUBLIC_`.
- **Înscrierea publică nu scrie direct din browser.** Trece prin `/api/inscriere`, unde se aplică validarea Zod, rate limiting, honeypot și abia apoi scrierea cu `service_role`. Altfel oricine poate insera rânduri direct.
- **Două proiecte Supabase**, unul de dezvoltare și unul de producție, cu aceleași migrații aplicate în ambele. Nu testa pe baza cu lead-uri reale.
- **Backup:** planul gratuit nu păstrează backup-uri automate suficient de mult. Un cron săptămânal care face `pg_dump` și îl arhivează e cinci minute de muncă și te scutește de o discuție neplăcută cu clienta.

### Structura repo-ului

```
app/
  (public)/
    page.tsx                     # hub: toate webinariile, ISR
    webinar/[slug]/page.tsx      # LP generat din DB, ISR
    inregistrare/[slug]/page.tsx # deblocare replay contra email
    inscriere-confirmata/page.tsx
  (admin)/
    dashboard/page.tsx
    webinarii/page.tsx
    webinarii/[id]/page.tsx      # editare + listă înscriși
    hub/page.tsx                 # conținut hub + listă de așteptare
    leaduri/page.tsx
    leaduri/[id]/page.tsx        # fișă contact + timeline
    setari/page.tsx
  api/
    inscriere/route.ts           # POST public, rate-limited
    lista-asteptare/route.ts
    replay/route.ts
    cron/reminders/route.ts
    webhooks/resend/route.ts     # bounce, complaint, open
db/
  schema.ts                      # Drizzle
  migrations/
  policies.sql                   # politici RLS, versionate în repo
emails/                          # template-uri React Email
lib/
  supabase/
    server.ts                    # client pentru Server Components
    admin.ts                     # client cu service_role, doar server
    middleware.ts                # refresh de sesiune
  meta-capi.ts
  consent.ts
```

---

## 6. Modelul de date

```
webinars
  id, slug (unic), title, subtitle, description,
  learning_points (jsonb: string[]), for_whom (jsonb: string[]),
  faq (jsonb: {q,a}[]), bonus_title, bonus_description,
  starts_at (timestamptz), duration_min, timezone,
  format: online | fizic | hibrid,
  join_url,                     # doar online / hibrid
  venue_name, address, city, county,
  map_url, venue_notes,         # doar fizic / hibrid — parcare, cum ajungi
  capacity,
  cover_image_url,
  status: draft | published | live | ended | cancelled,
  listed (bool, default true),      # apare pe pagina hub
  is_featured (bool, default false),# ocupă locul evidențiat din hub
  sort_order (int),
  recording_url, replay_public (bool, default false),
  seo_title, seo_description,
  meta_pixel_id, utm_default,
  created_at, updated_at

speakers                       ← bibliotecă reutilizabilă
  id, name, role_title,         # ex. "Aromaterapeut, 8 ani experiență"
  bio_short (text, ~250 caractere),
  photo_url,
  instagram_url, facebook_url, website_url,
  is_default (bool),            # Andreea, preselectată la webinar nou
  created_at, updated_at

webinar_speakers               ← relația webinar ↔ speaker
  webinar_id, speaker_id,
  role_label: gazda | invitat,
  sort_order,
  PRIMARY KEY (webinar_id, speaker_id)

contacts                       ← inima CRM-ului, un rând per persoană
  id, name, email (unic), phone,
  status: nou | contactat | interesat | client | inactiv,
  tags (text[]),
  consent_marketing (bool), consent_at, consent_text_version,
  unsubscribed_at, unsubscribe_token,
  first_source, first_utm_* , first_fbclid,
  country, city,
  notes (text),
  created_at, updated_at

registrations                  ← relația persoană ↔ webinar
  id, contact_id, webinar_id,
  kind: live | inregistrare,   # înscriere la eveniment sau cerere de replay
  registered_at, utm_* , fbclid, referrer,
  landing_page,                # hub sau pagina individuală
  attended (bool), attended_minutes,
  reminder_24h_sent_at, reminder_1h_sent_at, followup_sent_at,
  UNIQUE (contact_id, webinar_id, kind)

waitlist                       ← din starea goală a paginii hub
  id, contact_id, interest,    # ex. "online", "fizic", "ambele"
  notified_at, created_at,
  UNIQUE (contact_id)

activities                     ← timeline-ul contactului
  id, contact_id, type, payload (jsonb), created_at
  # type: inscriere | cerere_inregistrare | lista_asteptare |
  #       email_trimis | email_deschis | prezenta |
  #       nota_adaugata | tag_adaugat | dezabonare | export

email_log
  id, contact_id, template, subject, provider_id,
  status: queued | sent | delivered | opened | bounced | complained,
  sent_at

admin_users
  id, email, name, role: owner | editor, last_login_at
```

**Decizia care contează:** contactul e separat de înscriere. O persoană care vine la trei webinarii e un singur contact cu trei înscrieri, nu trei rânduri duplicate. Fără asta, CRM-ul devine inutilizabil după al doilea eveniment.

**A doua decizie:** cele trei moduri de a intra în bază — înscriere la un eveniment viitor, cerere de acces la o înregistrare, și listă de așteptare — produc toate un `contact`, dar se disting prin `kind` și prin tabelul `waitlist`. Așa poți întreba mai târziu lucruri utile: cine s-a înscris live dar n-a venit niciodată, cine consumă doar înregistrări, cine așteaptă de trei luni fără să i se fi anunțat nimic.

**A treia decizie:** speakerii sunt o bibliotecă, nu câmpuri pe webinar. Andreea se introduce o dată și se preselectează automat la fiecare eveniment nou. Un invitat care revine peste patru luni se alege dintr-o listă, cu poza și descrierea deja acolo. Dacă speakerii ar fi câmpuri text pe `webinars`, aceleași date s-ar rescrie la fiecare eveniment și ar diverge — trei variante ale descrierii aceleiași persoane, cu trei poze de calități diferite.

---

## 7. Panoul de administrare

### 7.1 Dashboard

Cifre pe primul ecran: lead-uri azi / 7 zile / 30 zile, rata de conversie a paginii, înscriși la webinarul următor, show-up rate la ultimul webinar, grafic simplu al lead-urilor pe zi. Sub el, ultimele 10 înscrieri, live.

### 7.2 Webinarii

Listă cu status și număr de înscriși. Buton „Webinar nou" care deschide un formular cu:
titlu, subtitlu, descriere, 5 puncte „ce vei învăța", 4 puncte „pentru cine e", FAQ, bonus, dată și oră, durată, capacitate, imagine de copertă, slug.

**Format** — un selector cu trei opțiuni: online, fizic, hibrid. Alegerea schimbă restul formularului: online cere link de acces, fizic cere denumirea locației, adresa, orașul, județul, link de hartă și note practice (parcare, cum ajungi), iar hibrid le cere pe amândouă. Câmpurile irelevante dispar, nu rămân goale.

**Speakeri** — un selector multiplu din biblioteca de speakeri, cu maximum trei persoane, reordonabile prin drag & drop, fiecare marcată ca gazdă sau invitat. Andreea e preselectată automat la fiecare webinar nou. Buton „Adaugă speaker nou" care deschide direct formularul de creare, fără a părăsi pagina.

La salvare cu status `published`, pagina publică există instant la `/webinar/[slug]`. **Andreea nu are nevoie de tine ca să lanseze al treilea webinar.** Ăsta e criteriul după care se măsoară dacă proiectul a reușit.

Funcție de duplicare: „Copiază webinarul precedent" umple tot formularul, se schimbă doar data. Un webinar recurent se creează în 90 de secunde.

Trei comutatoare care controlează pagina hub, direct din același formular:

- **Afișează în listă** (`listed`) — dezactivat, webinarul are pagină funcțională dar nu apare public. Util pentru un eveniment promovat exclusiv prin reclame sau pentru un segment anume.
- **Evidențiază pe pagina principală** (`is_featured`) — îl urcă în locul mare din capul hub-ului. Un singur webinar poate fi evidențiat la un moment dat; adminul îl deselectează automat pe cel anterior.
- **Înregistrare publică** (`replay_public` + `recording_url`) — după încheiere, webinarul trece în secțiunea de arhivă, iar înregistrarea se deblochează contra email.

### 7.3 Pagina hub și lista de așteptare

Un ecran scurt pentru conținutul rădăcinii subdomeniului: titlul și intro-ul, textul stării goale, și ordinea manuală a cardurilor prin `sort_order`.

Alături, lista de așteptare: câți oameni așteaptă, de când, și un buton „Anunță lista" care trimite un email către toți cei cu `notified_at` gol atunci când se publică un webinar nou. Aici se vede cel mai clar valoarea CRM-ului propriu — pe Facebook Events lista aia nu există.

### 7.4 Speakeri

Bibliotecă de persoane, independentă de evenimente. Grilă de carduri cu poză, nume, rol și numărul de webinarii la care a participat.

Formular de speaker: nume, rol sau titlu scurt (ex. „Aromaterapeut, 8 ani experiență"), descriere de aproximativ 250 de caractere cu numărător de caractere vizibil, poză cu decupare pătrată la încărcare, și linkuri opționale de Instagram, Facebook și site.

Un speaker folosit la evenimente trecute nu se poate șterge — doar arhiva. Altfel paginile arhivate rămân cu goluri.

### 7.5 Detaliu webinar

Tabelul înscrișilor, cu marcare de prezență. Import CSV al raportului de participanți din Zoom, care potrivește automat după email și setează `attended` și `attended_minutes`. Butoane pentru trimiterea manuală a follow-up-ului către prezenți și, separat, către absenți — cele două grupuri primesc mesaje diferite.

### 7.6 Lead-uri

Tabel cu toate contactele: căutare după nume, email sau telefon; filtre pe status, tag-uri, webinar, interval de date, sursă UTM; selecție multiplă pentru aplicare de tag-uri în masă; export CSV al selecției.

Fișa unui contact: date de contact editabile, status, tag-uri, notă liberă, istoricul complet al înscrierilor și prezențelor, timeline de activități, istoricul emailurilor cu status de livrare, și starea consimțământului cu data și versiunea textului acceptat.

### 7.7 Setări

Pixel ID și token CAPI, expeditor și semnătură pentru email, template-urile de email editabile, textul de consimțământ cu versionare, listă albă de utilizatori admin, politica de retenție a datelor.

---

## 8. Automatizări email

Toate pornesc din aplicație, prin Resend. Fără Mailchimp în fluxul de webinar — o singură sursă de adevăr.

| Moment                                 | Mesaj                    | Conținut esențial                                                              |
| -------------------------------------- | ------------------------ | ------------------------------------------------------------------------------ |
| Instant după înscriere                 | Confirmare               | link Zoom, fișier `.ics` atașat, buton „adaugă în Google Calendar", ce urmează |
| 24h înainte                            | Reminder                 | data, ora, link, o propoziție despre ce se va discuta                          |
| 1h înainte                             | Reminder scurt           | doar link-ul și ora, optimizat pentru mobil                                    |
| 2h după, celor prezenți                | Follow-up A              | bonusul PDF, înregistrarea, un singur CTA                                      |
| 2h după, absenților                    | Follow-up B              | înregistrarea, invitație la următorul webinar                                  |
| Instant, la cererea unei înregistrări  | Acces replay             | linkul înregistrării, o invitație discretă la webinarul următor                |
| Manual, la publicarea unui webinar nou | Anunț listă de așteptare | titlul, data, buton spre pagina lui; marchează `notified_at`                   |

Fiecare email are link de dezabonare cu token, care setează `unsubscribed_at` și oprește tot ce e de marketing. Cron-ul verifică `unsubscribed_at` înainte de fiecare trimitere.

**La evenimentele fizice, aceleași momente, alt conținut.** Confirmarea conține adresa completă, linkul de hartă, notele practice și un `.ics` cu locația setată — nu cu link de Zoom. Reminderul de la 24h devine cel mai util email din tot fluxul: adresă, oră, unde se parchează, cât durează. Cel de la 1h se transformă într-unul trimis cu 3 ore înainte, pentru că oamenii trebuie să plece de acasă. Follow-up-ul nu conține înregistrare, ci fotografii de la eveniment și invitația la următorul.

Sincronizarea cu Mailchimp rămâne opțională, doar pentru newsletterul general: un job zilnic împinge contactele cu `consent_marketing = true` în lista existentă. Așa clienta își păstrează obiceiurile, dar funnel-ul nu depinde de ele.

---

## 9. Tracking Meta

| Eveniment              | Când                               | Unde                          |
| ---------------------- | ---------------------------------- | ----------------------------- |
| `PageView`             | la încărcare                       | LP                            |
| `ViewContent`          | scroll 50%                         | LP                            |
| `Lead`                 | submit reușit                      | server, la crearea înscrierii |
| `CompleteRegistration` | opțional, la confirmarea prezenței | server                        |

- Pixel în browser **plus Conversions API din server**, cu `event_id` identic pe ambele căi pentru deduplicare. Cu CAPI trimiți email, telefon și nume hash-uite (SHA-256), ceea ce crește semnificativ match rate-ul — și ai deja datele în baza ta, spre deosebire de un formular WordPress.
- `fbclid` capturat din query string și salvat pe înscriere, ca `fbc`.
- UTM-uri salvate atât pe contact (prima atingere) cât și pe înscriere (ultima atingere). Așa vezi în admin care reclamă a adus fiecare lead.
- Domeniul rădăcină e deja verificat în Meta — `facebook-domain-verification` e prezent în head-ul site-ului actual, iar verificarea acoperă și subdomeniile. Un pas mai puțin.
- Testează cu **Meta Pixel Helper** și **Test Events** în Events Manager înainte de a porni bugetul.

**Publicuri de configurat din start:** toți vizitatorii LP · vizitatori care **nu** au ajuns pe pagina de mulțumire (retargeting 3 zile) · înscriși, excluși din campania de achiziție · lookalike 1% după ~100 de lead-uri.

---

## 10. GDPR — nu e opțional când stochezi date de contact

Din momentul în care ai o bază de date proprie cu nume, email și telefon ale unor persoane fizice din România, ești în plin RGPD. Ce trebuie construit din start, nu adăugat mai târziu:

- **Consimțământ explicit**, checkbox nebifat implicit, cu textul salvat versionat în `consent_text_version`. Dacă textul se schimbă, știi cine ce a acceptat.
- **Date stocate în UE** — la crearea proiectului Supabase alege regiunea Frankfurt `eu-central-1`. Regiunea nu se poate schimba ulterior fără migrarea completă a bazei, deci e o decizie de făcut corect din primul minut.
- **Row Level Security activat pe toate tabelele.** Nu e doar bună practică: cheia `anon` a Supabase e vizibilă în browser, iar un tabel `contacts` fără RLS înseamnă baza de lead-uri expusă public. Într-un audit GDPR, asta e o breșă, nu o scăpare de configurare.
- **Dreptul la ștergere** — buton „Șterge definitiv contactul" în admin, care șterge contactul și anonimizează înscrierile păstrând doar statistica agregată.
- **Dreptul de acces** — export al tuturor datelor unui contact în JSON, dintr-un click.
- **Politică de retenție** — contactele fără activitate de 24 de luni se anonimizează automat printr-un cron lunar.
- **Banner de cookies cu Consent Mode** — pixelul se încarcă **după** acceptare. Evenimentele server-side pot fi trimise pe baza interesului legitim / a consimțământului din formular, dar documentează decizia.
- **Politică de confidențialitate proprie** pentru subdomeniu, sau link clar spre cea existentă, actualizată să acopere noua prelucrare.
- **Acord de prelucrare (DPA) între tine și clientă.** Ea e operatorul, tu ești persoana împuternicită. Un document de două pagini, dar necesar.
- Rate limiting și honeypot pe endpoint-ul public de înscriere, altfel baza se umple de spam în prima săptămână de campanie.

---

## 11. Pagina hub — toate webinariile

`webinar.magia-uleiurilor.ro` (rădăcina subdomeniului). Fiecare webinar are apoi pagina lui la `/webinar/[slug]`.

### ⚠️ Regula care contează cel mai mult

**Reclamele Meta NU trimit niciodată spre pagina hub.** Ele trimit direct pe pagina webinarului promovat.

Hub-ul adaugă un clic între reclamă și formular, iar fiecare clic în plus taie o parte semnificativă din conversii. Traficul plătit intră direct pe pagina cu formular. Hub-ul are alți vizitatori: linkul din bio Instagram, linkul din meniul site-ului WordPress, semnătura de email, cei care ajung din Google, și cei care au fost la un webinar și vor să vadă ce urmează.

Cu alte cuvinte: hub-ul e pentru trafic organic și recurent, pagina individuală e pentru trafic plătit. Ambele convertesc, dar nu pe același public.

### Structura paginii

**Antet minimal** — logo, un singur link discret spre site-ul principal. Fără meniul cu 40 de intrări.

**Intro scurt** — un H1 și două propoziții: ce sunt aceste întâlniri și pentru cine. Trei rânduri, nu o pagină de vânzare.

**Webinarul următor, evidențiat** — un card mare, tratat aproape ca un hero: imagine, titlu, dată, oră, o frază de descriere, badge-uri practice, avatarele speakerilor stivuite cu numele lor, și buton „Vreau să particip" care duce direct pe pagina lui. Dacă un webinar are `is_featured = true`, el ocupă locul ăsta; altfel, cel mai apropiat în timp.

**Următoarele evenimente** — grilă de carduri, două coloane pe desktop, unul pe mobil. Fiecare card: imagine, dată și oră, titlu, o frază, badge de format (online / fizic / hibrid, iar la cele fizice și orașul), avatare mici ale speakerilor, număr de locuri rămase dacă `capacity` e setat. Întreg cardul e clicabil.

**Stare goală, când nu e programat nimic** — și ăsta e cazul care contează, pentru că pagina va arăta așa între evenimente. Nu un mesaj gol, ci un formular: _„Nu e nimic programat în momentul ăsta. Lasă-ți adresa și afli primul când se anunță următorul."_ Nume și email, cu același checkbox de consimțământ. Contactul intră în CRM cu tag-ul `lista-asteptare`, fără rând în `registrations`. Când Andreea publică următorul webinar, are deja o listă căreia să-i trimită.

**Webinarii trecute, cu înregistrare** — secțiune separată, vizual mai discretă. Fiecare intrare cu titlu, dată și buton „Vezi înregistrarea".

Aici e partea interesantă: **înregistrarea se deblochează contra email.** Persoana completează un formular scurt, primește linkul pe email, iar tu ai un lead nou. Un webinar susținut în martie continuă să genereze contacte în octombrie. E singurul mecanism din tot sistemul care aduce lead-uri fără buget de reclame.

Se afișează doar webinariile cu `replay_public = true` — nu tot ce s-a înregistrat trebuie făcut public.

**Despre Andreea** — versiune scurtă, 60–80 de cuvinte, cu foto și link spre pagina „Despre mine" de pe site-ul principal.

**Footer** — identic cu cel al paginilor de webinar: linkuri legale, contact, ANPC și SOL.

### Ce NU punem pe pagina individuală de webinar

Pagina de webinar rămâne fără navigație. Fără meniu sus, fără listă de alte evenimente, fără „vezi și...". Un singur drum: formularul.

Singura concesie e un link discret în footer, „Vezi toate webinariile". Nimic în antet, nimic deasupra formularului. Cine a intrat din reclamă trebuie să aibă exact o singură decizie de luat.

### SEO

Hub-ul e pagina indexabilă principală a subdomeniului, cu schema `ItemList`, title și meta description proprii. Are șanse reale să prindă căutări de tipul „webinar aromaterapie" sau „curs online uleiuri esențiale", pentru că e o pagină cu conținut recurent și actualizat.

Paginile individuale rămân indexabile, cu schema `Event` completă — Google le poate afișa ca eveniment în rezultate. Setează `eventAttendanceMode` corect (`OnlineEventAttendanceMode`, `OfflineEventAttendanceMode` sau `MixedEventAttendanceMode`), `location` cu adresa reală la cele fizice, și `performer` cu speakerii. Paginile de webinar `unlisted` primesc `noindex`.

Adaugă și un link din meniul site-ului WordPress spre hub. E singura legătură necesară între cele două sisteme și îți transferă o parte din autoritatea domeniului principal.

---

## 12. Structura paginii de webinar, secțiune cu secțiune

Un singur flux vertical. Fără meniu, fără carusel, fără pop-up. CTA repetat de 3–4 ori, mereu cu același text și aceeași destinație (ancoră spre formular).

### 12.1 Bară sticky sus

`Webinar GRATUIT · [DATA], ora [ORA]` + countdown live. Discretă. După încheierea evenimentului, se transformă automat în „Următorul webinar se anunță în curând" pe baza câmpului `status`.

### 12.2 Hero

Logo mic sus-stânga, fără link. H1 orientat pe beneficiu, nu titlu poetic — de ex. _„Cum folosești uleiurile esențiale în viața de zi cu zi, fără complicații"_. Subtitlu de 1–2 rânduri care spune pentru cine e și ce pleacă omul cu el. Rând de badge-uri, cu al treilea variabil după format: 📅 data · 🕖 ora · 💻 Zoom sau 📍 oraș · ⏱ 60 min · 🎁 gratuit. Buton CTA mare. Micro-copy sub buton: _„Îți trimitem link-ul de Zoom pe email, imediat după înscriere."_ Foto reală cu Andreea, caldă și luminoasă.

Totul trebuie să încapă în primul ecran pe mobil (390×844), cu butonul vizibil fără scroll.

### 12.3 Pentru cine este

4 carduri scurte, formulate ca dorință, nu ca simptom: „Vrei să începi cu uleiurile esențiale, dar nu știi de unde" · „Cauți alternative naturale pentru rutina casei" · „Ai câteva sticluțe acasă și le folosești la întâmplare" · „Vrei să înțelegi ce e real și ce e marketing în aromaterapie".

### 12.4 Ce vei învăța

5 puncte concrete, cu verbe de acțiune, fiecare un lucru aplicabil a doua zi. Calibrare corectă: _„Cele 5 uleiuri de la care merită să pornești și de ce"_, nu _„Cum să scapi de stres"_.

### 12.5 Cine susține evenimentul

Layout-ul se schimbă în funcție de numărul de speakeri, iar diferența e intenționată:

**Un singur speaker (cazul obișnuit — doar Andreea).** Secțiune pe două coloane: foto mare în stânga, 100–120 de cuvinte în dreapta. E aceeași secțiune „Despre Andreea" ca înainte — caldă, personală, cu 2–3 elemente de credibilitate: 8 ani de experiență, certificarea AromaTouch, câți oameni a ghidat.

**Doi sau trei speakeri.** Grilă de carduri egale — foto rotundă sau pătrată, nume, rol scurt, 40–50 de cuvinte de descriere, iconițe de social opționale. Andreea apare prima, marcată ca gazdă; invitații după ea.

Motivul pentru care nu folosim același layout în ambele cazuri: cu un singur om, un card mic e rece și pierde ocazia de a construi încredere — iar încrederea în persoană e principalul motiv pentru care cineva se înscrie. Cu trei oameni, trei secțiuni lungi ar împinge formularul cu un ecran mai jos.

Un invitat e și un argument de conversie în sine. Dacă la eveniment vine cineva cunoscut în nișă, numele lui merită și în hero, sub subtitlu: _„Cu invitat special: [Nume]"_.

### 12.6 Dovadă socială

3 testimoniale scurte cu prenume și avatar. **Rescrise cu diacritice și corectate gramatical.** Cele de pe site sunt autentice, dar publicate ca atare, fără diacritice și cu prescurtări de chat. Pe o pagină pe care se pun bani, prezentarea neîngrijită scade încrederea în loc s-o crească.

### 12.7 Bonus pentru participanți

Un singur bonus, într-un card evidențiat: _„Ghid PDF: primele 5 uleiuri esențiale și 12 utilizări practice"_. Formulat ca „îl primești dacă participi live" — crește vizibil și rata de înscriere, și show-up rate-ul.

### 12.8 Detalii practice

Bloc tip fișă, cu conținut diferit după format.

**Online:** data, ora, durata, platforma, cost, dacă se înregistrează, cum se intră.

**Fizic:** data, ora, durata, denumirea locației, adresa completă, cost, locuri rămase, și note practice — parcare, cum ajungi, ce să aduci. Adaugă o hartă statică cu marker și un buton „Deschide în Google Maps". O hartă interactivă încărcată prin iframe adaugă câteva sute de kilobytes și un cookie terț înainte de consimțământ; o imagine statică cu link rezolvă același lucru fără nicio dintre probleme.

**Hibrid:** ambele coloane, una lângă alta, cu o întrebare clară în formular — „Cum vrei să participi: la fața locului sau online?" — salvată pe înscriere.

La evenimentele fizice, capacitatea nu mai e decorativă. Afișează locurile rămase și blochează formularul când se ajunge la limită, cu opțiunea de a trece pe lista de așteptare a acelui eveniment.

### 12.9 FAQ

6 întrebări în accordion, răspunsuri de 40–60 de cuvinte: cât durează · trebuie cont de Zoom · e cu adevărat gratuit · primesc înregistrarea dacă nu pot live · trebuie să știu ceva dinainte · ce se întâmplă cu datele mele.

### 12.10 CTA final + formular

Formular vizibil în pagină, nu în modal.

| Câmp         | Obligatoriu  | Notă                                                                  |
| ------------ | ------------ | --------------------------------------------------------------------- |
| Nume         | da           | un singur câmp, nu prenume + nume separat                             |
| Email        | da           | validare inline                                                       |
| Telefon      | **opțional** | fiecare câmp obligatoriu în plus taie ~10% din conversii              |
| Consimțământ | da           | checkbox nebifat implicit, cu link spre politica de confidențialitate |

Buton cu același text ca în hero. Sub el: _„Nu trimitem spam. Te poți dezabona oricând."_

### 12.11 Footer minimal

Logo mic · Termeni · Politica de confidențialitate · Politica de cookies · email de contact · badge-uri ANPC și SOL.

---

## 13. Direcție vizuală

### Pagina publică

**Mood:** natural, calm, luminos, feminin fără a fi dulceag. „Apothecary modern" — botanic, aerisit, cu un strat de eleganță editorială. Opusul unei pagini de marketing direct cu săgeți roșii.

> Hexurile de mai jos sunt un punct de plecare. **Extrage culorile exacte din logo-ul SVG al clientei** înainte de implementare.

| Rol                                     | Culoare              | Hex       |
| --------------------------------------- | -------------------- | --------- |
| Primar (fundaluri de secțiune, titluri) | Verde pădure profund | `#2E4B3C` |
| Secundar                                | Verde salvie         | `#8FA98A` |
| Fundal principal                        | Crem cald            | `#F8F5EF` |
| **Accent / CTA**                        | Teracotă caldă       | `#C9714F` |
| Accent secundar                         | Auriu discret        | `#C9A227` |
| Text                                    | Charcoal             | `#26292A` |

**Regula critică:** butonul de CTA folosește **singura** culoare caldă din pagină. Dacă teracota apare și în alte șase locuri, butonul nu mai atrage ochiul. Nimic altceva nu are voie să fie teracotă. Contrast minim WCAG AA (4,5:1) peste tot.

**Tipografie:** `Fraunces` pentru titluri, `Inter` pentru text. ⚠️ Verifică suportul pentru diacriticele românești (ă â î ș ț) înainte de a fixa fontul — multe fonturi „elegante" au ș și ț cu sedilă în loc de virgulă, sau deloc, și se vede imediat. Fraunces, Inter și DM Sans le au complet. Scale: H1 40–48px mobil / 56–64px desktop · H2 28–32px · body 17–18px · line-height 1,6.

**Layout:** mobile-first, o coloană, conținut max 760px centrat. Spațiere 80–120px între secțiuni pe desktop, 56–72px pe mobil. Colțuri 12–16px, umbre minime. Accente botanice ca SVG-uri desenate (frunze, ramuri, siluete de sticluțe), plasate discret la marginile secțiunilor la opacitate 8–15% — nu poze stock de plante. Alternanță de fundal crem / salvie foarte deschis pentru a separa secțiunile, fără linii. Fotografii doar reale, în WebP, cu lazy-loading sub fold. Buton CTA full-width pe mobil, minim 52px înălțime. Bară CTA sticky pe mobil, apare după ieșirea hero-ului din ecran.

**De evitat explicit:** slider sau carusel · pop-up de exit-intent · countdown fals care se resetează · mai mult de un CTA cu destinații diferite · meniu de navigare · widget de chat · scripturi de protecție la click-dreapta (cel de pe site-ul actual e inutil și strică experiența).

### Panoul de administrare

Deliberat diferit de pagina publică. Aici prioritatea e densitatea informației, nu atmosfera.

Interfață shadcn/ui standard, neutră, cu suport light/dark. Un singur accent de brand: verdele `#2E4B3C` pentru elementele active, navigație și butoanele primare. Sidebar stânga cu cinci intrări (Dashboard, Webinarii, Lead-uri, Setări). Tabele dense, cu rânduri de 44px, sortare pe coloană și filtre persistente în URL. Statusurile ca badge-uri colorate consecvent. Totul trebuie să fie utilizabil de pe telefon, pentru că Andreea o să verifice înscrierile de pe telefon în ziua evenimentului.

---

## 14. Etape de livrare

**Faza 1 — funnel funcțional (obiectiv: prima campanie pornește)**
Schema DB și politicile RLS · LP dinamic per webinar · formular cu validare, rate limiting și honeypot · email de confirmare cu `.ics` prin Resend · pixel + CAPI cu deduplicare · banner de consimțământ · admin cu Supabase Auth pe magic link, CRUD webinarii și listă de lead-uri cu export CSV · deploy pe Vercel cu subdomeniu.

Include și o versiune simplă a paginii hub: webinarul următor evidențiat, grila celor programate, starea goală cu formular de listă de așteptare. Fără arhivă de înregistrări încă — n-ai ce pune în ea în prima lună.

**Faza 2 — CRM propriu-zis**
Fișă de contact cu timeline · tag-uri, status și note · filtre avansate · remindere automate la 24h și 1h · import CSV al prezenței din Zoom · follow-up diferențiat prezenți/absenți · dezabonare cu token · dashboard cu metrici · arhiva de webinarii trecute cu deblocarea înregistrării contra email · ecranul de administrare a listei de așteptare cu butonul „Anunță lista".

**Faza 3 — automatizare și scalare**
Integrare directă cu Zoom API (creare automată a evenimentului și a înregistrărilor, preluare automată a raportului de prezență) · sincronizare opțională cu Mailchimp · A/B testing pe titlu și hero · anonimizare automată după 24 de luni · export contabil sau legătură cu SmartBill dacă apar webinarii cu plată.

---

## 15. Ce trebuie cerut clientei înainte de a începe

- [ ] Logo în SVG sau PNG la rezoluție mare (pentru extragerea culorilor exacte)
- [ ] 3–5 fotografii reale cu Andreea, orizontale și verticale, luminoase
- [ ] Pentru fiecare invitat: poză pătrată, nume, rol scurt, descriere de 40–50 de cuvinte și acordul de a le publica
- [ ] Pentru evenimentele fizice: denumirea locației, adresa completă, note practice despre parcare și acces
- [ ] Data, ora, titlul și durata următorului webinar
- [ ] Cele 5 puncte „ce vei învăța", în cuvintele ei
- [ ] Bonusul PDF pentru participanți, sau acordul de a-l crea
- [ ] 3 testimoniale pe care are acordul scris să le publice
- [ ] Acces la Meta Business Manager (pixel + token CAPI)
- [ ] Contul Zoom și tipul de licență (determină dacă merge integrarea din Faza 3)
- [ ] O adresă de email de expediere pe domeniul propriu, de ex. `contact@magia-uleiurilor.ro`, plus acces DNS pentru SPF, DKIM și DMARC
- [ ] Confirmarea că a citit politica de conformitate dōTERRA pentru reclame plătite
- [ ] Semnarea acordului de prelucrare a datelor (DPA)

De reparat separat pe site-ul actual, indiferent de proiectul ăsta: numărul de telefon din header afișează `0773757382`, dar linkul `tel:` duce la `0723180445` — oricine sună de pe mobil apelează alt număr.

---

## 16. Prompt pentru Claude Design — paginile publice

> Copiază blocul de mai jos într-o conversație nouă în Claude Design. Acoperă cele trei pagini publice. Pentru panoul de administrare există un prompt separat, în secțiunea 17.

---

Construiește trei pagini publice în română pentru o platformă de webinarii de aromaterapie: o pagină de înscriere la un webinar, o pagină de confirmare, și o pagină hub care le listează pe toate. Trafic din reclame Meta, ~85% mobil, deci mobile-first. Fac parte dintr-o aplicație Next.js 15 cu App Router și Tailwind CSS v4, iar conținutul vine dintr-o bază de date — construiește-le ca niște componente care primesc datele prin props, nu cu texte hardcodate.

Începe cu pagina de înscriere, care e cea mai importantă. Specificațiile pentru celelalte două sunt la final.

**Brand:** Magia Uleiurilor Esențiale — Andreea Gligor, aromaterapeut cu 8 ani de experiență. Public: femei 28–50 de ani din România, interesate de soluții naturale pentru ele și familie, majoritatea începătoare.

**Obiectiv unic:** completarea formularului de înscriere. Fără meniu, fără linkuri externe, fără shop, un singur tip de CTA repetat de 3–4 ori cu exact același text și aceeași destinație (ancoră spre formular).

**Detalii eveniment (vin din props):** titlu, subtitlu, dată, oră, durată 60 de minute, live pe Zoom, gratuit.

**Direcție vizuală:** natural, calm, luminos, feminin fără a fi dulceag — „apothecary modern", botanic și aerisit, cu eleganță editorială. Opusul unei pagini agresive de marketing direct.

Paletă (definește-o ca variabile CSS în `@theme`):

- verde pădure profund `#2E4B3C` — fundaluri de secțiune, titluri
- verde salvie `#8FA98A` — accente secundare
- crem cald `#F8F5EF` — fundal principal
- teracotă caldă `#C9714F` — **exclusiv pentru butoanele de CTA, nicăieri altundeva**
- charcoal `#26292A` — text

Tipografie: `Fraunces` pentru titluri, `Inter` pentru text, încărcate prin `next/font`. Ambele trebuie să afișeze corect diacriticele românești ă â î ș ț.

Layout: o coloană, conținut max 760px centrat, spațiere generoasă (80–120px între secțiuni pe desktop, 56–72px pe mobil), colțuri 12–16px, umbre minime. Accente botanice ca SVG-uri desenate discret la marginea secțiunilor, opacitate 8–15%. Alternanță de fundal crem / salvie foarte deschis pentru a separa secțiunile, fără linii despărțitoare.

**Structura, în această ordine:**

1. Bară sticky sus cu countdown până la eveniment (client component)
2. Hero: logo mic, H1 orientat pe beneficiu, subtitlu de 1–2 rânduri, rând de badge-uri (📅 data · 🕖 ora · 💻 Zoom · ⏱ 60 min · 🎁 gratuit), buton CTA mare, micro-copy sub buton, foto Andreea. Totul trebuie să încapă într-un ecran de 390×844.
3. „Pentru cine este" — 4 carduri scurte, formulate ca dorință, nu ca simptom
4. „Ce vei învăța" — 5 puncte concrete, fiecare un lucru aplicabil imediat
5. Despre Andreea — foto + 120 de cuvinte + elemente de credibilitate
6. 3 testimoniale scurte cu nume și avatar
7. Bonus pentru participanți — un singur bonus, într-un card evidențiat
8. Detalii practice — bloc tip fișă
9. FAQ — 6 întrebări în accordion, răspunsuri de 40–60 de cuvinte
10. CTA final cu formularul vizibil în pagină: Nume (obligatoriu), Email (obligatoriu), Telefon (opțional), checkbox GDPR nebifat implicit cu link spre politica de confidențialitate. Sub buton: „Nu trimitem spam. Te poți dezabona oricând."
11. Footer minimal: logo, Termeni, Politica de confidențialitate, Politica de cookies, email de contact, spațiu pentru badge-urile ANPC și SOL

**Copy:** scrie textul real în română, cu diacritice, la persoana a doua, cald și direct. Fără superlative goale, fără majuscule pe frază întreagă, fără semne de exclamare în lanț.

**Restricții obligatorii de conformitate — respectă-le în tot copy-ul:**

- Zero afirmații medicale. Uleiurile esențiale nu tratează, nu vindecă și nu previn nicio boală. Folosește „susține", „ritual", „stare de bine", „echilibru".
- Nu presupune și nu implica starea de sănătate a cititorului (regulă Meta privind atributele personale). Scrie „Descoperă rutine pentru seri mai liniștite", nu „Suferi de insomnii?".
- Fără promisiuni de rezultat, fără before/after, fără afirmații despre venituri.
- Nu menționa dōTERRA nicăieri în pagină.

**Tehnic:** React Server Components unde se poate; marchează ca `"use client"` doar countdown-ul, accordion-ul de FAQ, bara CTA sticky și formularul. Formularul face POST către `/api/inscriere` cu validare Zod pe client, stări de loading și eroare vizibile, apoi redirecționează spre `/inscriere-confirmata?w=[slug]`. Countdown-ul primește data prin props. Imagini prin `next/image` cu `width` și `height` explicite, `priority` doar pe cea din hero. Lasă comentarii clare unde se inserează Pixelul Meta și banner-ul de consimțământ. Contrast minim WCAG AA pe tot textul, focus states vizibile, accordion accesibil de la tastatură. Țintă: LCP sub 2 secunde pe mobil.

Livrează și pagina `/inscriere-confirmata` în același stil: confirmare, „verifică-ți emailul", buton „adaugă în calendar" (.ics + Google Calendar), reamintirea bonusului și o singură invitație discretă de a urmări pagina de Instagram. Fără CTA de vânzare. Meta robots `noindex`.

**Și o a treia pagină — hub-ul, la rădăcina `/`**, care listează toate webinariile. Primește prin props un array de obiecte `webinar`. Structura:

1. Antet minimal: logo și un singur link discret spre site-ul principal. Fără meniu.
2. Intro: H1 și două propoziții despre ce sunt aceste întâlniri și pentru cine.
3. Webinarul evidențiat: card mare, aproape hero — imagine, titlu, dată, oră, o frază, badge-uri practice, buton „Vreau să particip" care duce spre `/webinar/[slug]`.
4. Grila celorlalte evenimente programate: două coloane pe desktop, una pe mobil. Card cu imagine, dată și oră, titlu, o frază, badge de format (online / fizic) și, dacă e setată capacitatea, locurile rămase. Întregul card e clicabil.
5. Stare goală, pentru când nu e programat niciun webinar — tratează-o ca pe o secțiune de sine stătătoare, nu ca pe un mesaj de eroare: text cald plus formular scurt (nume, email, checkbox de consimțământ) cu titlul „Află primul când se anunță următorul". Arată-mi explicit și această variantă a paginii.
6. Arhivă de webinarii trecute: secțiune vizual mai discretă decât cele de sus, listă compactă cu titlu, dată și buton „Vezi înregistrarea".
7. Despre Andreea: versiune scurtă, 60–80 de cuvinte, cu foto.
8. Același footer ca pe paginile de webinar.

Hub-ul folosește exact aceleași componente și tokeni ca pagina de webinar — carduri, badge-uri, butoane, tipografie. Nu inventa un stil paralel. Diferența e doar de densitate: hub-ul e o pagină de răsfoit, pagina de webinar e o pagină de convertit.

Pe cardurile din hub, butonul de acțiune folosește varianta **secundară**, nu teracota. Teracota rămâne rezervată butonului de înscriere de pe pagina individuală — altfel pagina hub ajunge cu opt CTA-uri de aceeași intensitate și niciunul nu mai conduce ochiul.

---

## 17. Prompt pentru Claude Design — panoul de administrare

> Conversație separată de cea a paginilor publice. Adminul are alte reguli: densitate în loc de atmosferă, iar dacă îl proiectezi în aceeași sesiune, moștenește spațierea generoasă a landing page-ului și devine obositor de folosit.

---

Proiectează interfața completă a unui panou de administrare pentru o platformă de webinarii cu CRM integrat, în română. Livrează-l ca mockup-uri funcționale, ecran cu ecran, construite cu React, Tailwind CSS v4 și componente în stil shadcn/ui.

**Cine îl folosește:** două persoane. Andreea, proprietara afacerii — nu e tehnică, folosește aplicația de câteva ori pe săptămână, iar în ziua unui webinar o deschide de pe telefon. Și un administrator tehnic, ocazional. Interfața trebuie să fie evidentă pentru primul tip de utilizator, fără instruire.

**Principiul de bază:** aici prioritatea e densitatea informației, nu atmosfera. Landing page-urile publice ale aceluiași brand sunt aerisite și editoriale — adminul trebuie să fie deliberat diferit: compact, rapid de scanat, cu multe date pe ecran. Nu importa spațierea generoasă a paginilor publice.

**Sistem vizual**
Interfață neutră în stil shadcn/ui, cu suport light și dark. Un singur accent de brand: verdele `#2E4B3C` pentru navigația activă, butoanele primare și elementele selectate. Restul rămâne pe scala de neutri. Font Inter peste tot, inclusiv în titluri — fără serif aici. Colțuri 6–8px, borduri de 1px, umbre aproape inexistente. Densitate: rânduri de tabel la 44px, padding de card 16–20px, spațiere între secțiuni 24–32px.

**Structură**
Sidebar stânga, colapsabil, cu: Dashboard, Webinarii, Pagina publică, Lead-uri, Setări. Jos, avatarul utilizatorului cu meniu de deconectare. Pe mobil, sidebar-ul devine bară de navigație jos, cu patru icoane.
Bară de sus cu titlul ecranului curent, breadcrumb când e cazul, căutare globală și comutator light/dark.

**Ecranele de proiectat**

1. **Dashboard**
   Rând de patru carduri cu cifre: lead-uri azi, lead-uri 7 zile, înscriși la webinarul următor, show-up rate la ultimul webinar. Fiecare cu variație procentuală față de perioada anterioară.
   Sub ele: un grafic simplu al lead-urilor pe zi (ultimele 30 de zile), un card cu webinarul următor și numărul de înscriși, și o listă live cu ultimele 10 înscrieri (nume, email, webinar, timp relativ).

2. **Listă webinarii**
   Tabel cu: imagine miniatură, titlu, dată și oră, status ca badge (ciornă, publicat, live, încheiat, anulat), număr de înscriși, rată de prezență, și trei indicatori mici pentru comutatoarele „afișat în listă", „evidențiat", „înregistrare publică".
   Filtre sus: status, interval de date, căutare. Buton primar „Webinar nou" și, lângă el, „Duplică" pe fiecare rând.

3. **Formular de webinar (creare / editare)**
   Formular lung, împărțit în secțiuni colapsabile: Informații de bază · Conținut pagină · Programare · Vizibilitate · SEO.
   „Conținut pagină" conține liste editabile prin drag & drop pentru punctele „ce vei învăța", „pentru cine e" și FAQ — adaugă, șterge, reordonează.
   „Vizibilitate" conține cele trei comutatoare: afișat pe pagina publică, evidențiat în capul listei, înregistrare publică (care dezvăluie un câmp de URL când e activat).
   Sus, permanent vizibile: butonul de salvare, un indicator de modificări nesalvate și un buton „Previzualizează", care deschide pagina publică într-un tab nou.
   Arată și cum arată formularul pe mobil.

4. **Detaliu webinar**
   Antet cu titlul, data, statusul și trei cifre: înscriși, prezenți, rată de prezență.
   Tab-uri: Înscriși · Emailuri · Setări.
   Tab-ul Înscriși: tabel cu nume, email, telefon, data înscrierii, sursa (UTM), și o coloană de prezență cu checkbox. Sus, butoane pentru import CSV al raportului Zoom, export, și două acțiuni separate — „Trimite follow-up prezenților" și „Trimite follow-up absenților".

5. **Lead-uri**
   Ecranul cel mai folosit, tratează-l cu prioritate.
   Bară de filtre: căutare liberă, status, tag-uri (multi-select), webinar, interval de date, sursă. Filtrele active apar ca chip-uri detașabile deasupra tabelului.
   Tabel cu selecție multiplă: nume, email, telefon, status ca badge, tag-uri, număr de webinarii la care s-a înscris, data primului contact, sursă.
   Când sunt selectate rânduri, apare o bară de acțiuni în masă: aplică tag, schimbă status, exportă selecția, șterge.
   Include și starea goală („niciun lead încă") și starea de „niciun rezultat pentru filtrele curente" — sunt două lucruri diferite și merită tratate diferit.

6. **Fișă de contact**
   Două coloane pe desktop, stivuite pe mobil.
   Stânga: date de contact editabile inline, status, tag-uri, câmp de notă liberă, și un panou de consimțământ care arată dacă a acceptat, când și ce versiune de text.
   Dreapta: timeline vertical cu toate activitățile — înscrieri, emailuri trimise cu status de livrare, prezențe, note adăugate, dezabonare. Fiecare intrare cu icoană, descriere și timp relativ.
   Sus-dreapta: meniu cu „Exportă datele" și „Șterge definitiv", al doilea cu dialog de confirmare care explică ce se întâmplă cu înscrierile.

7. **Pagina publică**
   Ecran de administrare a hub-ului: titlul și intro-ul, textul stării goale, și o listă cu drag & drop pentru ordinea manuală a webinariilor.
   Dedesubt, panoul listei de așteptare: câți oameni așteaptă, de când, tabel cu ei, și un buton „Anunță lista" cu dialog de confirmare care arată câți vor primi emailul.

8. **Setări**
   Tab-uri: General · Emailuri · Tracking · Utilizatori · Date.
   „Tracking" conține Pixel ID și token CAPI, cu câmpurile de secret mascate și buton de dezvăluire.
   „Date" conține textul de consimțământ cu versionare și politica de retenție.

**Componente care trebuie să apară cel puțin o dată, cu toate stările**
Buton primar, secundar, ghost, destructiv · câmp de text cu label, hint și eroare · select și multi-select · switch · checkbox · date-time picker · badge de status în cinci variante · tabel cu sortare, selecție și paginare · bară de filtre cu chip-uri · dialog de confirmare, inclusiv unul distructiv · toast de succes și de eroare · skeleton de încărcare pentru tabel și pentru carduri · stare goală · stare de eroare.

**Cerințe**

- Fiecare ecran cu varianta desktop și cea mobilă. Andreea verifică înscrierile de pe telefon în ziua evenimentului — tabelele trebuie să se transforme în carduri stivuite, nu să se deruleze orizontal.
- Toate textele de interfață în română, cu diacritice. Etichete scurte și clare, fără jargon: „Înscriși", nu „Registrations".
- Datele afișate în format românesc: `14 sept. 2026, 19:00`.
- Filtrele se reflectă în URL, ca să poată fi salvate ca bookmark.
- Contrast WCAG AA, focus states vizibile, tabele navigabile de la tastatură.
- Folosește date de test realiste, în română — nume românești, subiecte plauzibile de webinar de aromaterapie. Nu Lorem ipsum și nu „John Doe".

**De evitat**
Carduri decorative care ocupă spațiu fără să transporte informație · icoane fără etichetă text · mai mult de un buton primar pe ecran · culori de brand pe elemente care nu sunt interactive · tabele care necesită derulare orizontală pe mobil · animații pe tranzițiile dintre ecrane.

Nu-mi da explicații lungi în chat — pune totul în mockup-uri. La final, spune-mi doar ce compromisuri ai făcut și unde ai avut nevoie să presupui ceva.

---

## 18. Prompt de completare — speakeri și evenimente fizice

> Se rulează **în conversațiile existente**, nu în altele noi: partea publică în sesiunea paginilor publice, partea de admin în sesiunea panoului de administrare. Altfel Claude Design reproiectează de la zero și pierzi ce ai aprobat deja.

### Pentru sesiunea paginilor publice

Am nevoie de două completări la paginile pe care le-ai construit. Păstrează tot ce există — modifică doar ce e descris aici.

**1. Speakeri**

Un eveniment poate avea între unu și trei speakeri. Fiecare are: nume, rol scurt (ex. „Aromaterapeut, 8 ani experiență"), descriere de 40–120 de cuvinte, poză, și linkuri opționale de Instagram, Facebook și site. Vin prin props ca array de obiecte `speaker`, fiecare cu un `role_label` de tip `gazda` sau `invitat`.

Înlocuiește actuala secțiune „Despre Andreea" de pe pagina de webinar cu o secțiune care se adaptează la numărul de speakeri:

- **Un speaker:** păstrează layout-ul actual pe două coloane — foto mare în stânga, 100–120 de cuvinte în dreapta. Titlu de secțiune: „Cine susține webinarul".
- **Doi sau trei speakeri:** grilă de carduri egale, două sau trei coloane pe desktop, una pe mobil. Fiecare card: poză, nume, rol scurt, 40–50 de cuvinte, iconițe de social. Gazda apare prima, cu o etichetă discretă care o distinge de invitați.

Nu folosi același layout în ambele cazuri. Cu un singur om, un card mic e rece și pierde ocazia de a construi încredere — iar încrederea în persoană e principalul motiv pentru care cineva se înscrie. Cu trei oameni, trei secțiuni lungi ar împinge formularul cu un ecran mai jos.

În hero, când există cel puțin un invitat, adaugă sub subtitlu un rând discret: „Cu invitat special: [Nume]", sau „Cu invitați speciali: [Nume] și [Nume]".

Pe pagina hub, adaugă avatarele speakerilor pe carduri — stivuite și suprapuse ușor, cu numele lor alături pe cardul evidențiat și doar avatarele pe cele din grilă.

**2. Evenimente fizice**

Nu toate evenimentele sunt online. Fiecare are un câmp `format` cu valoarea `online`, `fizic` sau `hibrid`, iar pagina se adaptează.

În hero, al treilea badge devine variabil: 💻 Zoom la online, 📍 [oraș] la fizic, iar la hibrid ambele.

Blocul de detalii practice își schimbă conținutul:

- **online** — rămâne cum e acum
- **fizic** — denumirea locației, adresa completă, orașul, note practice (parcare, cum ajungi, ce să aduci), locuri rămase, plus o **hartă statică** cu marker și buton „Deschide în Google Maps". Folosește o imagine statică, nu un iframe interactiv: iframe-ul adaugă câteva sute de kilobytes și un cookie terț înainte de consimțământ.
- **hibrid** — ambele variante, una lângă alta pe desktop, stivuite pe mobil, plus un câmp în formular: „Cum vrei să participi?" cu opțiunile „La fața locului" și „Online".

La evenimentele fizice, capacitatea contează cu adevărat. Afișează locurile rămase lângă formular și proiectează și starea în care evenimentul e plin: formularul se blochează, iar în locul lui apare un buton „Anunță-mă dacă se eliberează un loc".

Pe pagina hub, badge-ul de format de pe carduri arată online, fizic sau hibrid, iar la cele fizice și orașul.

Arată-mi fiecare variantă separat, desktop și mobil: un speaker / trei speakeri, și online / fizic / hibrid / fizic-cu-locuri-epuizate.

### Pentru sesiunea panoului de administrare

Adaugă un ecran nou și modifică formularul de webinar. Restul rămâne neschimbat.

**Ecran nou: Speakeri** (intrare nouă în sidebar, între Webinarii și Lead-uri)

Bibliotecă de persoane, independentă de evenimente. Grilă de carduri cu poză, nume, rol și numărul de webinarii la care a participat. Buton primar „Speaker nou".

Formular de speaker: nume, rol sau titlu scurt, descriere cu numărător de caractere vizibil și limită recomandată de 250, încărcare de poză cu decupare pătrată, și trei câmpuri opționale de link social. Un speaker deja folosit la evenimente nu se poate șterge, doar arhiva — altfel paginile evenimentelor trecute rămân cu goluri. Arată dialogul care explică asta.

**Modificări la formularul de webinar**

Adaugă un selector de format cu trei opțiuni: online, fizic, hibrid. Alegerea rescrie restul secțiunii de programare — online cere link de acces, fizic cere denumirea locației, adresa, orașul, județul, link de hartă și note practice, hibrid le cere pe amândouă. Câmpurile irelevante dispar, nu rămân goale și dezactivate.

Adaugă un selector de speakeri: multi-select din bibliotecă, maximum trei, reordonabile prin drag & drop, fiecare cu un comutator gazdă / invitat. Andreea e preselectată automat la fiecare webinar nou. Lângă selector, un buton „Adaugă speaker nou" care deschide formularul într-un dialog, fără a părăsi pagina și fără a pierde ce e completat.

În tabelul de webinarii, adaugă o coloană cu avatarele speakerilor și un badge de format.

---

## 19. Import din Claude Design în cod

Claude Design generează, pentru fiecare proiect, un prompt de import care conține linkul proiectului, fișierul de implementat și bundle-ul de design system. Se dă lui Claude Code, care citește proiectul prin MCP-ul `claude_design` și îl transformă în cod.

**Înainte de a rula:** autentificarea se face cu `/design-login` în sesiunea Claude Code. Fără ea, MCP-ul nu poate citi proiectul.

### 19.1 Panoul de administrare

```
Use the claude_design MCP (https://api.anthropic.com/v1/design/mcp, auth via /design-login) to import this project:
https://claude.ai/design/p/ab2596a6-1df2-4f51-8a14-6388f02d6aca?file=Admin+Magia+Uleiurilor.dc.html
Focus on these files (the whole project is readable):
- `Admin Magia Uleiurilor.dc.html`
Also read these files the selection imports:
- `_ds/magia-uleiurilor-design-system-42d29b9d-6355-4599-a2ed-de903d418c4a/_ds_bundle.js`
- `_ds/magia-uleiurilor-design-system-42d29b9d-6355-4599-a2ed-de903d418c4a/styles.css`
- `_ds/magia-uleiurilor-design-system-42d29b9d-6355-4599-a2ed-de903d418c4a/tokens/base.css`
- `_ds/magia-uleiurilor-design-system-42d29b9d-6355-4599-a2ed-de903d418c4a/tokens/colors.css`
- `_ds/magia-uleiurilor-design-system-42d29b9d-6355-4599-a2ed-de903d418c4a/tokens/elevation.css`
- `_ds/magia-uleiurilor-design-system-42d29b9d-6355-4599-a2ed-de903d418c4a/tokens/fonts.css`
- `_ds/magia-uleiurilor-design-system-42d29b9d-6355-4599-a2ed-de903d418c4a/tokens/motion.css`
- `_ds/magia-uleiurilor-design-system-42d29b9d-6355-4599-a2ed-de903d418c4a/tokens/spacing.css`
- `_ds/magia-uleiurilor-design-system-42d29b9d-6355-4599-a2ed-de903d418c4a/tokens/typography.css`
- `support.js`
Implement: `Admin Magia Uleiurilor.dc.html`
```

### 19.2 Ce adaugi după prompt, în aceeași sesiune

Prompt-ul de mai sus îi spune lui Claude Code **ce** să citească, nu **cum** să integreze. Fără instrucțiunile de mai jos, rezultatul probabil e o pagină HTML statică lipită în proiect, nu ecrane conectate la baza de date. Adaugă imediat după:

```
Contextul proiectului: Next.js 15 (App Router, TypeScript), Tailwind CSS v4,
shadcn/ui, Supabase (Postgres + Auth + Storage), Drizzle ORM, deploy pe Vercel.
Schema și specificațiile funcționale sunt în brief-ul din repo.

Cum vreau făcută integrarea:

1. Tokenii din `_ds/.../tokens/*.css` devin sursa unică de adevăr pentru culoare,
   tipografie, spațiere, elevație și motion. Portează-i în `app/globals.css` ca
   variabile în blocul `@theme` din Tailwind v4, cu denumiri semantice. Dacă
   diferă de paleta din brief, tokenii din design system câștigă — dar
   semnalează-mi diferențele înainte de a le aplica.

2. Nu copia HTML-ul ca atare. Reconstruiește ecranele ca React Server Components
   acolo unde se poate, cu `"use client"` doar unde e nevoie de interactivitate:
   filtre, tabele cu selecție, drag & drop, dialoguri, comutatoare.

3. Componentele repetate (buton, input, select, badge de status, tabel, dialog,
   toast, skeleton) se implementează ca primitive shadcn/ui stilizate cu tokenii
   importați — nu ca marcaj duplicat în fiecare ecran.

4. Rutele urmează structura din brief: `app/(admin)/dashboard`, `/webinarii`,
   `/webinarii/[id]`, `/speakeri`, `/hub`, `/leaduri`, `/leaduri/[id]`,
   `/setari`. Grupul `(admin)` e protejat de middleware cu Supabase Auth.

5. Datele de test din design se înlocuiesc cu interogări Drizzle reale. Unde
   tabelul încă nu există, lasă un TODO explicit cu numele tabelului și al
   coloanelor așteptate — nu inventa un model paralel.

6. Filtrele din listele de lead-uri și webinarii se reflectă în searchParams, ca
   URL-ul să fie partajabil și salvabil ca bookmark.

7. Păstrează comportamentul responsive din design: pe mobil tabelele devin
   carduri stivuite, nu se derulează orizontal.

Începe prin a-mi arăta planul de fișiere pe care le vei crea sau modifica,
înainte de a scrie cod.
```

### 19.3 Paginile publice

Când termini și designul paginilor publice, Claude Design îți va genera un prompt de import similar. Adaugă-l aici și rulează-l **într-o sesiune Claude Code separată** de cea a adminului, cu aceleași instrucțiuni de integrare, plus:

```
În plus față de regulile de integrare de mai sus, pentru paginile publice:

- Sunt Server Components implicit. Marchează `"use client"` doar countdown-ul,
  accordion-ul de FAQ, bara CTA sticky și formularele.
- `/webinar/[slug]` și hub-ul folosesc ISR, cu revalidare la publicarea unui
  webinar din admin.
- Formularele fac POST către `/api/inscriere`, `/api/lista-asteptare` și
  `/api/replay` — validare Zod, rate limiting, honeypot, apoi scriere cu
  `service_role` pe server. Niciun formular public nu scrie direct din browser.
- Bugetul de performanță e strict: LCP sub 2 secunde pe mobil, sub 500 KB total.
  Semnalează-mi orice import care ar rupe pragul ăsta.
- Lasă comentarii clare în `<head>` unde se inserează Pixelul Meta și banner-ul
  de consimțământ.
```

---

## 20. Etape următoare, în ordine

1. Colectează assets-urile de la clientă (secțiunea 14)
2. Rulează prompt-ul din secțiunea 15 în Claude Design, iterează pe copy și vizual
3. Creează proiectele Supabase (dev și prod) în regiunea Frankfurt; scaffold Next.js + Drizzle, schema din secțiunea 6, migrații și politici RLS
4. Integrează paginile publice din Claude Design cu prompt-ul de import din secțiunea 19.3: hub la `/`, rută dinamică `/webinar/[slug]`, confirmare
5. Rulează prompt-ul din secțiunea 17 pentru panoul de administrare, plus completarea de admin din secțiunea 18; importă apoi în cod cu prompt-ul din secțiunea 19.1 și implementează: auth, CRUD webinarii cu comutatoarele `listed` / `is_featured`, listă lead-uri, export
6. Resend: domeniu verificat, SPF/DKIM/DMARC, template-uri de confirmare și reminder
7. Pixel + CAPI, testate cu Pixel Helper și Test Events
8. Deploy pe Vercel — variabile de mediu separate pentru Preview (proiectul Supabase de dev) și Production, `service_role` doar pe server; subdomeniu în Cloudflare cu proxy dezactivat
9. Test end-to-end cu adresă reală, inclusiv pe mobil
10. Buget mic de test (3–5 zile), o singură reclamă, apoi optimizare
11. Adaugă în meniul site-ului WordPress un link spre hub, ca să-i transferi din autoritatea domeniului principal
12. După ~100 de lead-uri: lookalike 1% și retargeting pe cei care n-au completat
