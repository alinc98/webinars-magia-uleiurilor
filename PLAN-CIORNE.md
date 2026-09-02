# Salvarea automată a unui webinar în lucru

## 1. Problema

Formularul de webinar e lung: titlu, descriere, ce se învață, pentru cine,
bonus, informații utile, întrebări frecvente, program, locație, preț, SEO,
imagine. Tot ce e scris în el trăiește doar în pagină, până la Salvează.

Deci se pierde la: un tab închis din greșeală, un laptop adormit, un browser
căzut, o sesiune expirată — și, cel mai des dintre toate, un drum până la
secțiunea Speakeri ca să adaugi unul, și înapoi.

## 2. Unde se ține ciorna — singura decizie care e a ta

**Recomandarea mea: în browser.** Motivele, pe față:

Pe server ar fi însemnat una din două. Ori un rând incomplet în `webinars` —
dar tabelul are `slug` unic și coloane `not null` (`starts_at`, `ends_at`),
deci jumătate din ciorne n-ar încăpea în el, iar celelalte ar apărea în lista
din admin ca evenimente pe jumătate scrise. Ori un tabel separat de ciorne, cu
întrebarea „care e mai nouă, ciorna sau ce e salvat?" la fiecare deschidere,
plus sincronizarea între două tab-uri deschise pe același webinar.

Pentru un singur om care lucrează de pe un laptop, complexitatea aia nu se
plătește. În browser, mecanismul e instantaneu, nu are latență, nu are
conflicte, și nu poate strica nimic în bază.

**Ce pierzi:** ciorna nu trece de la un dispozitiv la altul. Dacă începi pe
laptop și continui pe telefon, o iei de la capăt. Interfața o să spună asta pe
față — „în browserul ăsta" — nu s-o lase de înțeles.

Dacă vrei totuși varianta cu server, spune-mi și refac planul; e o zi de lucru
în plus și un tabel nou, nu o schimbare de o oră.

## 3. Ce citim, și de unde

Aici e miezul, și e contraintuitiv.

Valorile formularului nu stau într-un singur loc în React. Le scriu componente
independente: `SelectorDataOra` pune un moment ISO într-un câmp ascuns,
`EditorProgram` pune trei liste paralele, `IncarcaImagine` pune un URL,
comutatoarele Radix pun `on`/lipsă, iar restul câmpurilor sunt necontrolate, cu
`defaultValue`.

**Deci citim `new FormData(formular)`**, exact ce se trimite și spre server.
E singura sursă care le știe pe toate. Ieșirea o convertim în aceeași formă cu
`valori` de la server (`ValoriWebinar`), ca restaurarea să nu fie decât o
remontare cu alte valori inițiale.

## 4. Când verificăm — periodic, nu la evenimente

Prima idee ar fi să ascultăm `input` și `change` pe formular. **N-ar merge.**

Alegerea unei zile din calendar, a orei, adăugarea unui rând de program,
comutatoarele și imaginea încărcată schimbă câmpuri ascunse prin React, fără
niciun eveniment nativ de ascultat. Un mecanism pe evenimente ar fi pierdut
tăcut exact alegerile care contează cel mai mult.

Deci: **o citire la două secunde**. Patruzeci de câmpuri citite dintr-un
formular nu costă nimic măsurabil, și nu ratează nimic, indiferent cine a scris
valoarea.

În plus, o salvare imediată la `pagehide` și la `visibilitychange` — ca
ultimele secunde de scris să nu cadă în fereastra dintre două bătăi. Prima
prinde închiderea tabului și navigarea, a doua trecerea pe alt tab și adormirea
telefonului.

## 5. Cum știm că s-a schimbat ceva

La deschidere reținem forma formularului ca **referință**, folosind aceeași
funcție de citire. Comparăm mereu cu ea, nu cu ce e în bază: același cod
produce ambele capete, deci nu putem greși normalizarea (`""` față de `null`,
ordinea cheilor, spațiile).

Cât timp nimic nu diferă de momentul deschiderii, **nu ținem nicio ciornă** —
altfel simpla vizitare a unei pagini ar lăsa în urmă o ciornă identică, iar
data viitoare ar apărea o propunere de restaurare fără rost.

Referința **nu** se recalculează după o restaurare. Dacă s-ar recalcula,
formularul tocmai restaurat ar părea „nemodificat" și ciorna s-ar șterge
singură.

## 6. Cum se restaurează

Nu scriem valori înapoi în câmpuri una câte una — jumătate sunt controlate de
React și n-ar prelua nimic. În schimb **remontăm formularul** cu ciorna drept
valori inițiale, printr-un `key` schimbat. Tot ce se inițializează din `valori`
se reface din temelii, fără nicio logică nouă per câmp.

Asta cere un refactor mic: `FormularWebinar` se desface în două — un înveliș
subțire care ține ciorna, starea salvării și cheia de montare, și componentul
de azi, redenumit, care primește `valori` și randează. Fără schimbări de
comportament.

## 7. Când se șterge ciorna

- **La trimitere**, imediat.
- **Dacă validarea pică**, o punem la loc din formular. Altfel o eroare de
  validare urmată de închiderea tabului ar pierde tot — exact cazul pentru care
  există mecanismul.
- **La salvare reușită**, rămâne ștearsă, iar referința devine ce s-a salvat.

Un caz merită atenție: la un **webinar nou**, salvarea reușită face `redirect`,
deci acțiunea nu mai întoarce niciun răspuns către pagină. Ștergerea la
trimitere rezolvă asta singură — pagina se demontează și nu mai repune nimic.
Dacă ștergerea s-ar fi făcut abia la răspuns, ciorna de „webinar nou" ar fi
rămas pe disc și ar fi propus la nesfârșit un eveniment deja creat.

## 8. Ce vede omul

**La deschidere, dacă există o ciornă mai nouă decât ce e salvat** — o bandă
peste formular:

> **Ai modificări nesalvate la acest webinar.** Ultima dată scriai acum 12
> minute, în browserul ăsta. `[Reia de acolo]` `[Renunță]`
>
> — sau, la unul nou: **Ai început un webinar și nu l-ai salvat.**

Se **propune**, nu se aplică singură. O restaurare automată ar putea acoperi,
fără să întrebe, o versiune salvată între timp din alt tab.

**Cât scrii** — un rând discret în bara de jos, lângă Salvează:

> Ciornă păstrată local, 14:32

cu explicația la hover: ciorna e în browserul ăsta; pe server ajunge doar când
apeși Salvează. **Nimic din mecanism nu scrie în bază.** Textul trebuie să nu
lase impresia contrară nici o clipă.

## 9. Fișiere

| Fișier | Ce se întâmplă |
|---|---|
| `components/admin/ciorna-webinar.tsx` | nou — citirea formularului, păstrarea, hook-ul, banda și indicatorul |
| `components/admin/formular-webinar.tsx` | se desface în înveliș + component intern; `ValoriWebinar` primește `price_mod` |
| `components/admin/editor-program.tsx` | tolerează un rând fără dată, ca la restaurarea unei ciorne începute |

Nimic în bază, nimic pe server, nicio migrație.

## 10. Detalii de care depinde corectitudinea

- **`price_mod` intră în `ValoriWebinar`.** Azi „cu plată" se deduce din preț.
  O ciornă în care e bifat „cu plată" dar suma încă nu e scrisă s-ar întoarce
  pe „gratuit", tăcut.
- **Fiecare atingere a memoriei browserului e învelită în `try`.** În fereastra
  privată din Safari scrierea aruncă, iar cu spațiul plin aruncă peste tot. O
  salvare automată care strică formularul e mai rea decât lipsa ei.
- **Ciornele poartă un număr de versiune.** Când forma obiectului se schimbă,
  una veche e ignorată, nu citită greșit.
- **Cheia e per eveniment** — `ciorna-webinar:<id>`, iar la unul nou
  `ciorna-webinar:nou`. Două webinarii editate în paralel nu se calcă.

## 11. Ce nu face

Nu avertizează la închiderea tabului („ai modificări nesalvate"). Cu salvarea
automată în spate, avertismentul ar fi zgomot: nu se pierde nimic. Și oricum
n-ar apărea la navigarea prin admin, care e cazul cel mai frecvent.

Nu ține un istoric de versiuni. O singură ciornă per eveniment, cea mai
recentă.
