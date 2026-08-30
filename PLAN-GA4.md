# GA4 pe platforma de webinarii

Există deja o proprietate GA4 pentru `magia-uleiurilor.ro`, pusă prin GTM pe site-ul
WordPress. Planul de aici aduce subdomeniul `webinar.magia-uleiurilor.ro` în măsurare, cu
consimțământ corect și cu evenimente care spun ceva despre înscrieri, nu doar despre
pagini vizitate.

Aproximativ două zile de programare, plus configurarea din interfața GA4.

---

## 1. Proprietate nouă sau aceeași?

Întrebarea e reală și merită un răspuns, nu o preferință.

### Ce câștigi cu o proprietate separată

Rapoartele webinariilor nu se amestecă cu ale magazinului. Evenimentele-cheie sunt doar
ale tale, dimensiunile personalizate la fel — limita de 50 per proprietate nu se împarte
cu WooCommerce. Poți da acces cuiva doar la partea asta.

### Ce pierzi, și cred că e mai mult

Drumul dintre cele două. Cineva ajunge din reclamă pe pagina unui webinar, se înscrie,
iar peste trei săptămâni cumpără din magazin. **Cu o proprietate separată, întrebarea
„câți dintre cei înscriși au cumpărat până la urmă" nu are răspuns** — sunt doi oameni
diferiți, în două conturi diferite, fără nicio cale de a-i lipi.

Or ăsta e chiar rostul webinariilor. Nu sunt un produs, sunt intrarea în pâlnie. O
măsurare care taie pâlnia în două măsoară exact lucrul greșit.

Se mai pierd: atribuirea corectă la trecerea între domenii (subdomeniile împart cookie-ul,
deci într-o singură proprietate sesiunea continuă cu sursa inițială), și audiențele pentru
Google Ads care ar acoperi ambele zone.

### Ce recomand

**Aceeași proprietate, același Measurement ID** — dar cu separarea pe care o vrei,
obținută altfel.

`hostname` e o dimensiune pe care GA4 o are din start. O comparație salvată pe
`webinar.magia-uleiurilor.ro` îți dă exact rapoartele separate, în toate ecranele, fără să
rupi datele. Practic ai și vederea separată, și pe cea comună — nu trebuie să alegi.

Se face din **Reports → butonul de comparație**, sau ca explorare salvată cu același filtru.

### Dacă tot vrei o proprietate dedicată

Există și o cale de mijloc: `gtag` acceptă mai multe destinații, deci se poate trimite
simultan în ambele proprietăți. Ai una dedicată webinariilor și o păstrezi și pe cea
comună întreagă.

Costul: dublezi evenimentele trimise, ai două seturi de configurări de întreținut, și
două locuri unde poate să-ți scape ceva. E o linie de cod în plus, dar de două ori mai
multă întreținere. Aș face-o doar dacă cineva din afară trebuie să vadă doar webinariile.

**De verificat oricum:** adaugă `magia-uleiurilor.ro` în lista de *unwanted referrals* din
proprietate. Altfel, cine trece de pe site-ul mare pe subdomeniu pornește o sesiune nouă
cu sursa „magia-uleiurilor.ro" — și pierzi exact atribuirea pentru care ai vrut o singură
proprietate.

---

## 2. Direct în cod, nu prin GTM

Pe WordPress, GTM are sens: oameni care adaugă tag-uri fără să atingă codul. Aici ar fi un
al doilea container de întreținut, încă un script încărcat și încă o integrare cu bannerul
de cookie-uri.

Platforma are deja tiparul: pixelul Meta se montează din cod, condiționat de consimțământ,
versionat în depozit. GA4 intră pe același drum. Dacă vrei vreodată tag-uri fără deploy,
GTM se poate adăuga peste, mai târziu.

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

---

## 4. Ce măsurăm

Numele în engleză, dinadins: pe cele recomandate de Google le recunosc rapoartele gata
făcute. Parametrii sunt ai noștri.

| Eveniment | Când pleacă | Parametri |
| --- | --- | --- |
| `page_view` | Automat, la fiecare pagină | — |
| `view_event` | Deschiderea paginii unei întâlniri | `webinar_slug`, `webinar_title`, `webinar_format`, `webinar_price`, `locuri_ramase` |
| `form_start` | Prima atingere a formularului | `webinar_slug` |
| `generate_lead` | Înscriere reușită — **eveniment-cheie** | `webinar_slug`, `webinar_format`, `value`, `currency` |
| `join_waitlist` | Înscriere pe lista de așteptare | `webinar_slug` sau „general" |
| `add_to_calendar` | Apăsarea unui buton de calendar | `metoda`: `google` sau `ics` |
| `request_replay` | Cererea înregistrării, după eveniment | `webinar_slug` |
| `scroll` | Automat, la 90% din pagină | — |

`generate_lead`, nu `sign_up`: primul acceptă `value` și `currency`. La evenimentele cu
preț trimitem suma reală; la cele gratuite, o valoare convenită de tine — altfel toate
înscrierile cântăresc la fel și campaniile n-au după ce să optimizeze.

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

`view_event`, `form_start`, `add_to_calendar`. Un ajutor subțire, ca apelurile să nu fie
împrăștiate prin componente.

**3. Înscrierea** — o jumătate de zi

`generate_lead` cu valoare, în același loc unde pleacă acum `Lead` către Meta. Plus
`join_waitlist` și `request_replay`.

**4. Configurarea din interfața GA4** — o oră, dar cu răbdare

Dimensiunile personalizate, marcarea lui `generate_lead` ca eveniment-cheie, lista de
*unwanted referrals*, comparația salvată pe `hostname`, și verificarea că măsurarea
îmbunătățită nu trimite deja `form_start` pe cont propriu — altfel îl ai de două ori.

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
- Te înscrii → un singur `generate_lead`, cu valoarea corectă la un eveniment cu preț.
- În Realtime, sursa vine din UTM-ul din link, nu din „magia-uleiurilor.ro".

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
