# GA4 pe platforma de webinarii

Există deja o proprietate GA4 pentru `magia-uleiurilor.ro`, pusă prin GTM pe site-ul
WordPress. Planul de aici aduce subdomeniul `webinar.magia-uleiurilor.ro` în aceeași
proprietate, cu consimțământ corect și cu evenimente care spun ceva despre înscrieri, nu
doar despre pagini vizitate.

Aproximativ două zile de programare, plus configurarea din interfața GA4.

---

## 1. Deciziile luate

### Aceeași proprietate, același Measurement ID

Nu creăm una nouă și nu creăm un flux de date nou. Se ia `G-XXXXXXXXXX` din fluxul
existent și se folosește și aici.

Motivul: webinariile nu sunt un produs, sunt intrarea în pâlnie. Cineva vine din reclamă pe
pagina unui webinar, se înscrie, iar peste trei săptămâni cumpără din magazin. Într-o
singură proprietate, drumul acela se vede. În două, sunt doi oameni fără nicio legătură.

Subdomeniile împart cookie-ul cu domeniul rădăcină, deci trecerea de pe site-ul mare pe
subdomeniu continuă aceeași sesiune, cu sursa inițială. Nu e nevoie de configurare de
măsurare între domenii — aceea e pentru domenii diferite.

### Separarea rapoartelor se face pe `hostname`

`hostname` e o dimensiune pe care GA4 o are din start. O comparație salvată pe
`webinar.magia-uleiurilor.ro` dă rapoartele separate în toate ecranele standard, fără să
rupă datele.

Se face din **Reports → butonul de comparație → Add comparison**, condiție
`Hostname` `exactly matches` `webinar.magia-uleiurilor.ro`. Merită salvată, ca să fie la un
clic distanță.

Două lucruri de știut despre ea:

- Comparațiile se aplică rapoartelor standard. În **Explore**, filtrul se pune separat, în
  fiecare explorare.
- Comparația filtrează *sesiuni*, nu evenimente. O sesiune care începe pe magazin și
  continuă pe subdomeniu apare în ambele vederi. E corect — chiar asta vrei să vezi — dar
  explică de ce numerele nu se adună exact.

### Direct în cod, nu prin GTM

Pe WordPress, GTM are sens: oameni care adaugă tag-uri fără să atingă codul. Aici ar fi un
al doilea container de întreținut, încă un script încărcat și încă o integrare cu bannerul
de cookie-uri.

Platforma are deja tiparul: pixelul Meta se montează din cod, condiționat de consimțământ,
versionat în depozit. GA4 intră pe același drum. Dacă vrei vreodată tag-uri fără deploy,
GTM se poate adăuga peste, mai târziu.

---

## 2. Ce trebuie verificat înainte, tocmai pentru că e aceeași proprietate

Astea trei n-ar fi contat cu o proprietate separată. Acum contează.

### Numele evenimentelor — verificat pe 30 august 2026

Proprietatea trimite acum 14 evenimente, toate de pe site-ul mare: `add_to_cart`,
`begin_checkout`, `click`, `first_visit`, `form_start`, `form_submit`, `page_view`,
`purchase`, `scroll`, `session_start`, `user_engagement`, `view_cart`, `view_item`,
`view_search_results`.

Evenimente-cheie: `purchase` (cu date, din magazin), plus `qualify_lead` și
`close_convert_lead` — cele două sunt nume din ciclul de lead-uri pe care Google le
pregăteşte singur la legarea cu Ads, şi n-au nicio dată.

Ce rezultă:

- **`generate_lead` e liber.** Îl folosim, cu `value` și `currency`.
- **`view_item` e ocupat** de produsele din magazin. Numele nostru, `view_event`, nu se
  ciocnește cu el.
- **`purchase` e al magazinului** și e eveniment-cheie. Nu-l atingem.

Contează mai mult decât pare: **evenimentele-cheie sunt la nivel de proprietate și nu se pot
filtra pe hostname.** Dacă un nume e folosit de amândouă părțile, importul în Google Ads le
adună, oricâte comparații ai salva. `generate_lead` fiind liber, conversia importată în Ads
va fi curat a noastră.

### Măsurarea îmbunătățită e pornită, și se aplică și la noi

Din listă se vede că Enhanced Measurement e activ: `scroll`, `click`, `form_start`,
`form_submit`, `view_search_results` vin de la el, nu din GTM.

Setările sunt ale fluxului de date, nu ale domeniului — deci **din clipa în care GA4 se
încarcă pe subdomeniu, aceleaşi evenimente încep să plece şi de la noi, fără să scriem
nimic.**

Două consecinţe pentru plan:

- **`scroll` şi `click` le primim gratis.** Nu le trimitem noi.
- **`form_start` nu mai e al nostru.** Îl trimite deja măsurarea îmbunătățită, la prima
  atingere a oricărui formular. Dacă l-am trimite şi noi, l-am avea de două ori pe aceeaşi
  interacţiune. Îl scoatem din lista noastră; se distinge oricum după hostname şi pagină.

### Limita de dimensiuni personalizate se împarte

50 de dimensiuni la nivel de eveniment, pe toată proprietatea. Noi cerem cinci. Verifică în
**Admin → Custom definitions** câte sunt deja folosite.

### Referințele nedorite

Adaugă `magia-uleiurilor.ro` în lista de *unwanted referrals*, în setările fluxului de
date. Altfel, cine trece de pe site-ul mare pe subdomeniu pornește o sesiune nouă cu sursa
„magia-uleiurilor.ro" — și pierzi exact atribuirea pentru care ai ales o singură
proprietate.

---

## 3. Consimțământul e deja pe jumătate construit

Bannerul are două categorii, `analiza` și `marketing`. Dar în cod **doar `marketing` e
citit**, de pixelul Meta. Categoria de analiză se salvează egală cu cealaltă și nu o
folosește nimic.

GA4 e chiar lucrul care îi dă un rost. Iar dacă vrei vreodată butoane separate — „acceptă
măsurarea, refuză reclamele" — infrastructura e deja acolo.

### Consent Mode v2

Nu e opțional dacă rulezi reclame în UE. Semnalele se pun pe `denied` înainte să se
încarce GA4 și se actualizează la răspunsul omului.

| Semnal Google | Din bannerul nostru | La ce folosește |
| --- | --- | --- |
| `analytics_storage` | `analiza` | Cookie-ul GA4, sesiuni, utilizatori |
| `ad_storage` | `marketing` | Cookie-uri de publicitate |
| `ad_user_data` | `marketing` | Trimiterea datelor spre Google Ads |
| `ad_personalization` | `marketing` | Remarketing |

Cu refuz, GA4 tot trimite semnale fără cookie-uri și estimează statistic ce lipsește. Fără
Consent Mode, cine refuză dispare complet din rapoarte — iar în România refuză destui cât
să conteze.

Verifică și ce face GTM-ul de pe site-ul mare: dacă acolo Consent Mode nu e pus, cele două
jumătăți ale proprietății se vor comporta diferit, iar comparațiile pe hostname vor părea
inexplicabile.

---

## 4. Ce măsurăm

Numele în engleză, dinadins: pe cele recomandate de Google le recunosc rapoartele gata
făcute. Parametrii sunt ai noștri.

| Eveniment | Când pleacă | Parametri |
| --- | --- | --- |
| `page_view` | Automat, la fiecare pagină | — |
| `view_event` | Deschiderea paginii unei întâlniri | `webinar_slug`, `webinar_title`, `webinar_format`, `webinar_price`, `locuri_ramase` |
| `generate_lead` | Înscriere reușită — **eveniment-cheie** | `webinar_slug`, `webinar_format`, `value`, `currency` |
| `join_waitlist` | Înscriere pe lista de așteptare | `webinar_slug` sau „general" |
| `add_to_calendar` | Apăsarea unui buton de calendar | `metoda`: `google` sau `ics` |
| `request_replay` | Cererea înregistrării, după eveniment | `webinar_slug` |
| `scroll`, `click`, `form_start` | Automat, din măsurarea îmbunătățită | — |

`generate_lead`, nu `sign_up`: primul acceptă `value` și `currency`. La evenimentele cu
preț trimitem suma reală; la cele gratuite, o valoare convenită de tine — altfel toate
înscrierile cântăresc la fel și campaniile n-au după ce să optimizeze.

`generate_lead` e liber în proprietate, verificat — deci rămâne numele.

> **Parametrii nu apar singuri în rapoarte.** Fiecare trebuie declarat ca dimensiune
> personalizată, în **Admin → Custom definitions**. Până atunci sunt trimiși și stocați,
> dar invizibili — și se pierd zile căutându-i. Declararea populează rapoartele abia după
> 24–48 de ore.

---

## 5. Ce merge pe server și ce nu

Meta are Conversions API și îl folosim. GA4 are echivalentul, Measurement Protocol, dar cu
o diferență care contează: **nu deduplică**. Dacă trimiți aceeași înscriere și din
browser, și de pe server, o numeri de două ori.

Deci nu dublăm nimic. Measurement Protocol are rost doar pentru ce nu se poate întâmpla în
browserul omului:

- **Prezența**, marcată în panou după eveniment. E singurul semnal care spune cine chiar a
  venit — GA4 n-are cum să-l afle altfel.
- **Anularea unui eveniment**, dacă vrei să-i vezi efectul în pâlnie.

Are însă un preț: Measurement Protocol cere `client_id`-ul browserului ca să lipească
evenimentul de aceeași persoană. Pe server nu-l avem. Trebuie citit din cookie la înscriere
și salvat pe înscriere — o coloană în plus și un pas în plus în formular. Merită doar dacă
chiar vrei rata de prezență în GA4, nu doar în panou.

---

## 6. Fazele

**1. Încărcarea condiționată** — o jumătate de zi

O componentă alături de `MetaPixel`, în layout-ul public, care pune semnalele de
consimțământ pe `denied`, încarcă `gtag` și le actualizează la răspunsul omului. Aici intră
și `page_view` la schimbarea de pagină — aceeași capcană ca la Meta: scriptul stă în layout
și nu se remontează la navigare.

**2. Evenimentele din pagini** — o jumătate de zi

`view_event` și `add_to_calendar`. Un ajutor subțire, ca apelurile să nu fie împrăștiate
prin componente.

`add_to_calendar` se suprapune parţial cu `click`-ul automat pe linkuri externe, dar merită
scris: parametrul `metoda` spune dacă omul a ales Google Calendar sau fişierul, iar
`click`-ul nu.

**3. Înscrierea** — o jumătate de zi

Evenimentul de lead cu valoare, în același loc unde pleacă acum `Lead` către Meta. Plus
`join_waitlist` și `request_replay`.

**4. Configurarea din interfața GA4** — o oră, dar cu răbdare

Dimensiunile personalizate, marcarea lui `generate_lead` ca eveniment-cheie, comparația
salvată pe `hostname`, lista de *unwanted referrals*, și numărătoarea dimensiunilor deja
folosite de magazin — singura verificare din punctul 2 care a rămas nefăcută.

**5. Measurement Protocol** — o zi, opțional

Doar dacă vrei prezența în GA4. Cere `client_id` salvat pe înscriere, deci o migrație și o
modificare în formular.

---

## 7. Cum verifici

**DebugView** arată evenimentele în timp real, dar numai de la sesiunile marcate ca
depanare. Se pornește dintr-o variabilă de mediu, la fel ca la Meta.

> **Aceeași capcană ca la Meta:** variabila de depanare trebuie să existe doar pe Preview.
> Lăsată pe Production, umple DebugView cu trafic real și murdărește rapoartele. La Meta
> a costat deja o zi de conversii marcate ca test.

Lista scurtă, după implementare:

- Refuzi cookie-urile → în DebugView nu apare niciun eveniment cu cookie, dar apar
  semnalele fără el.
- Accepți → `page_view` pe pagina cu lista, apoi încă unul pe pagina unei întâlniri, la
  navigare.
- Te înscrii → un singur `generate_lead`, cu valoarea corectă la un eveniment cu preț, și
  un singur `form_start` — nu două.
- În Realtime, sursa vine din UTM-ul din link, nu din „magia-uleiurilor.ro".
- Intri pe magazin, apoi pe subdomeniu → o singură sesiune, nu două.

Ultimul e testul care spune dacă alegerea unei singure proprietăți a meritat.

---

## 8. Ce nu-ți spune GA4 aici

**Cine a venit la eveniment.** Rata de prezență trăiește în panou, unde se bifează. GA4 o
află doar prin faza 5, și tot de la noi.

**Cine a deschis emailurile.** Reamintirile trec prin Resend; statisticile lor sunt acolo.

**Adevărul despre sursa unei înscrieri.** Platforma salvează deja UTM-urile pe fiecare
contact și pe fiecare înscriere — prima atingere și ultima. Cu GA4 vei avea două surse de
adevăr care nu se vor potrivi niciodată perfect, pentru că măsoară altfel: GA4 modelează și
atribuie pe fereastră, baza noastră scrie exact ce era în link. Nu e o problemă de reparat,
e o diferență de înțeles — pentru bani, cred în ce scrie în bază.
