# Evenimente de calitate spre Meta

## 1. Ce vrem

Azi Conversions API trimite un singur eveniment, `Lead`, la înscriere. Meta află
că s-a înscris cineva, dar nu află ce s-a întâmplat după.

Vrem ca, atunci când un lead avansează, Meta să primească un eveniment nou
pentru **același om**. Cu timpul învață ce fel de oameni ajung departe și îi
caută pe cei asemănători, nu doar pe cei care completează ușor un formular.

## 2. Etapele

Trei, toate existente deja în platformă:

| Eveniment | Când pleacă | De unde |
|---|---|---|
| `Participare` | la bifarea prezenței | `comutaPrezenta`, per înscriere |
| `LeadCalificat` | când statusul contactului devine **interesat** | `actualizeazaContact` |
| `Client` | când statusul contactului devine **client** | `actualizeazaContact` |

**Lead-urile slabe nu se marchează.** Semnalul e chiar lipsa progresului: cine
s-a înscris și n-a venit nu primește nimic nou, iar Meta învață din diferență.
`contactat` și `inactiv` nu pleacă. Primul nu spune nimic despre om, doar despre
Andreea. Al doilea ar fi un semnal negativ, pe care Meta nu-l folosește așa.

**Doar etapa atinsă.** Un contact trecut direct din `nou` în `client` trimite
`Client`, nu și `LeadCalificat` în urmă. Ordinea etapelor o știe Meta din
configurare (§8).

## 3. Primul pas: verificare în Events Manager, înainte de cod

Integrarea CRM pentru lead-uri de pe **site** e mai nouă decât cea pentru
formularele instant, iar detaliile se schimbă des. Înainte de orice linie de
cod, parcurgem în Events Manager fluxul de configurare **CRM integration** pe
dataset-ul „Magia Uleiurilor Pixel" și notăm exact ce cere:

- ce `action_source` așteaptă pentru evenimentele de etapă (`system_generated`
  sau `website`);
- ce câmpuri din `custom_data` cere (de obicei `event_source: 'crm'` și
  `lead_event_source` cu numele sistemului);
- dacă numele etapelor se aleg liber sau dintr-o listă;
- ce volum minim cere ca să poată optimiza pe o etapă.

Restul planului presupune varianta obișnuită și se ajustează după ce vedem
ecranul. Nu scriem nimic după presupuneri.

## 4. Cine primește evenimente

Aceeași regulă ca la `Lead`, adică **acordul din formular**. Acordul e
obligatoriu la înscriere, deci orice contact înscris îl are. În plus, **nu
trimitem** dacă:

- contactul s-a dezabonat (`unsubscribed_at` completat), fiindcă un om care a
  cerut să nu mai audă de noi nu trebuie să mai alimenteze reclame;
- contactul a fost anonimizat, prin dreptul la ștergere din fișa contactului.

Politica de confidențialitate trebuie să spună că date despre participare și
interes pot ajunge la Meta pentru măsurarea reclamelor. Evenimentul `Lead` avea
deja nevoie de asta, dar aici informația e mai detaliată.

## 5. O singură dată per etapă

Statusul se poate schimba de mai multe ori: `interesat` → `contactat` →
`interesat`. Fără o evidență, a doua trecere ar retrimite evenimentul.

Tabel nou, `meta_evenimente`:

```sql
create table meta_evenimente (
  id              uuid primary key default gen_random_uuid(),
  contact_id      uuid not null references contacts(id) on delete cascade,
  -- Completat doar la `Participare`, care ține de un eveniment anume.
  registration_id uuid references registrations(id) on delete cascade,
  etapa           text not null,
  event_id        text not null unique,
  trimis_la       timestamptz,
  eroare          text,
  created_at      timestamptz not null default now(),

  constraint meta_evenimente_etapa check (
    etapa in ('Participare', 'LeadCalificat', 'Client')
  )
);

create unique index meta_evenimente_o_data
  on meta_evenimente (contact_id, etapa, coalesce(registration_id, '00000000-0000-0000-0000-000000000000'));
```

`text` cu constrângere, nu enum, din același motiv ca la monedă: lista se
poate schimba, iar un enum nu se scurtează.

**`event_id` determinist**: hash din `contact_id + etapa (+ registration_id)`.
O retrimitere după o eroare de rețea ajunge la Meta cu același id și e
deduplicată și acolo, nu doar la noi.

Tabelul e și jurnalul: se vede ce a plecat, când, și ce a eșuat.

## 6. Potrivirea cu omul

Meta leagă evenimentul de înscrierea inițială după datele omului. Le avem:

- **email și telefon**, hash-uite exact ca acum. Telefonul e obligatoriu în
  formular, deci sunt amândouă mereu prezente. Sunt identificatorii cei mai
  puternici;
- **nume și oraș**, ca acum;
- **`fbc`**, construit din `fbclid`-ul salvat. La `Participare` îl luăm de pe
  înscriere, iar la etapele de contact din `first_fbclid`. Contează un
  detaliu: `construiesteFbc` pune azi ora curentă în identificator. Pentru
  evenimentele de mai târziu trebuie să primească **ora înscrierii**, adică
  momentul clicului. Altfel ar părea un clic nou;
- **`fbp` nu-l avem.** Se trimite la înscriere, dar nu se salvează. Propun o
  coloană `fbp` pe `registrations`, completată din ruta de înscriere. E o
  migrație de o linie și îmbunătățește potrivirea pentru toate evenimentele de
  după.

## 7. Codul

**`lib/meta-capi.ts`** se generalizează, fără să se schimbe comportamentul
pentru `Lead`:

- `eventName` primește și cele trei etape;
- parametri noi: `actionSource` (implicit `website`), `customData` și momentul
  clicului, pentru `fbc`;
- restul rămâne la fel: hash, normalizarea telefonului, cod de test în Preview.

**`lib/meta-calitate.ts`**, nou, cu o singură funcție de intrare:

```ts
trimiteEtapaMeta({ contactId, etapa, registrationId? })
```

Face, în ordine: citește contactul (și înscrierea); verifică regulile de la §4;
încearcă să insereze rândul în `meta_evenimente`, iar un conflict înseamnă că
etapa a plecat deja și se oprește; trimite; marchează `trimis_la` sau `eroare`.

**Nu aruncă niciodată.** Bifa de prezență și salvarea contactului trebuie să
reușească și când Meta nu răspunde, la fel ca la GA4.

**Unde se cheamă:**

- `comutaPrezenta`, lângă `raporteazaPrezenta`, tot doar la bifare. O debifare
  nu retrage nimic, pentru că Meta nu are cum să retragă un eveniment trimis;
- `actualizeazaContact`, doar când `inainte.status !== date.status` și noul
  status e `interesat` sau `client`.

**Fără întârziere în admin.** Trimiterea n-ar trebui să țină în loc bifa sau
butonul Salvează. Dacă `after()` din `next/server` e disponibil în versiunea
asta, trimiterea rulează după răspuns. De verificat în
`node_modules/next/dist/docs` înainte, conform `AGENTS.md`. Dacă nu e, rămâne
un `await` ca la GA4, care a mers bine.

## 8. Ce se face în Meta, după cod

1. **Test Events**: cu `META_TEST_EVENT_CODE` pe Preview, bifăm o prezență și
   schimbăm un status, iar evenimentele trebuie să apară cu match quality bun.
2. **Configurarea etapelor** în Events Manager: ordinea (`Participare` →
   `LeadCalificat` → `Client`) și sursa.
3. **Campaniile rămân pe `Lead` deocamdată.** Optimizarea pe o etapă se
   activează abia când Meta spune că are volum suficient, iar Events Manager
   arată asta.

## 9. Ce trebuie să facă Andreea

Mecanismul e automat, dar semnalul vine din ce bifează ea:

- **prezența, în zilele de după eveniment.** Cu cât mai repede, cu atât
  semnalul e mai util;
- **statusul contactelor**, când cineva răspunde sau cumpără.

Fără asta nu pleacă nimic.

## 10. Ce nu face

- **Nu trimite istoric.** Clienții de azi nu primesc evenimente retroactive.
  Meta refuză evenimentele cu dată mai veche de 7 zile, iar unele cu data de azi
  ar spune ceva fals despre momentul conversiei. Pornim de la zero.
- **Nu optimizează singur campaniile.** Doar trimite semnalul. Alegerea de a
  optimiza pe calitate e o setare în Ads Manager, făcută când e volum.
- **Nu umblă la `Lead`.** Înscrierea rămâne exact cum e.

## 11. Fișiere

| Fișier | Ce se întâmplă |
|---|---|
| `supabase/migrations/…_meta_calitate.sql` | tabelul `meta_evenimente`, coloana `fbp` pe `registrations` |
| `lib/meta-capi.ts` | generalizat: etape, `action_source`, `custom_data`, ora clicului pentru `fbc` |
| `lib/meta-calitate.ts` | nou: reguli, evidență, trimitere |
| `app/api/inscriere/route.ts` | salvează `fbp` |
| `app/(admin)/admin/webinarii/[id]/prezenta/actions.ts` | cheamă `Participare` |
| `app/(admin)/admin/leaduri/[id]/actions.ts` | cheamă `LeadCalificat` / `Client` la schimbarea statusului |
