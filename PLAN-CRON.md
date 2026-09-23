# Programarea automată: de pe GitHub pe Vercel

## 1. Două probleme, nu una

**Ritmul.** `schedule` la GitHub Actions e best-effort prin definiție. `*/15`
al nostru a devenit, în realitate, o rulare la vreo patru ore:

```
21 sept: 07:08, 14:02, 19:22, 22:39
22 sept: 01:08, 06:09, 11:31, 15:40, 19:08, 22:04
23 sept: 00:27, 04:58
```

Pentru reamintirea de 24 de ore, care are o fereastră de 23 de ore, e
irelevant. Pentru cea scurtă, cu fereastra ei de o oră, înseamnă o șansă din
patru să plece.

**Tăcerea.** Asta a costat de fapt. Cron-ul a fost verde săptămâni la rând în
timp ce nu trimitea nimic, din cauza unui plafon gol care ajungea `limit 0` în
bază. Nimic nu verifica dacă ce trebuia trimis chiar a plecat. Orice programare
am alege, problema asta se poate repeta sub altă formă.

Planul le rezolvă separat, pentru că sunt separate.

## 2. Ce am verificat

Din documentația Vercel, nu din memorie:

| | Hobby | **Pro** (al nostru acum) |
|---|---|---|
| Rulări | o dată pe zi | **o dată pe minut** |
| Precizie | ±59 de minute | **în minutul cerut** |
| Durata funcției | 300s | **300s implicit, până la 800s** |

Plus trei lucruri care contează:

- Vercel trimite automat `Authorization: Bearer <CRON_SECRET>` — **exact
  antetul pe care ruta noastră îl verifică deja**. Nimic de schimbat la
  autentificare.
- Rulările de cron ale Vercel sunt **exceptate de la protecția anti-bot**. Fix
  blocajul care ne-a oprit azi-dimineață nu se mai poate întâmpla.
- Vercel cheamă ruta cu **GET**, nu POST. Asta e singura schimbare obligatorie
  de cod.

## 3. Arhitectura

```
Vercel Cron  ──GET──▶  /api/cron/reminders      la 5 minute
             ──GET──▶  /api/cron/retentie       lunar
             ──GET──▶  /api/cron/verificare     zilnic  ← nou

GitHub       ──────▶   backup                   săptămânal (are nevoie de pg_dump)
             ──────▶   cron.yml                 doar manual, ca manetă de urgență
```

## 4. Schimbările de cod

### 4.1 `GET` pe rutele de cron

`/api/cron/reminders` și `/api/cron/retentie` expun azi doar `POST`. Adăugăm
`GET`, cu același corp și aceeași verificare de secret. `POST` rămâne, pentru
declanșarea manuală din GitHub.

Verificarea secretului nu se schimbă: `env.cronSecret()` citește deja
`CRON_SECRET`, adică exact variabila pe care Vercel o foloseşte.

### 4.2 Durata și plafonul

Pe Pro putem sta mult peste 60 de secunde. Ridicăm:

- `maxDuration` de la 60 la 300 (implicitul planului);
- bugetul de timp al lotului, de la 45s la ~280s;
- plafonul implicit al lotului de la 60 la 200.

Cele 86 de emailuri de azi ar fi intrat într-o singură rulare. Bugetul de timp
şi predarea revendicărilor neatinse rămân — sunt plasa de siguranţă, nu o
soluţie temporară.

### 4.3 `vercel.json`, fișier nou

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "crons": [
    { "path": "/api/cron/reminders",  "schedule": "*/5 * * * *" },
    { "path": "/api/cron/verificare", "schedule": "0 7 * * *" },
    { "path": "/api/cron/retentie",   "schedule": "0 4 1 * *" }
  ]
}
```

Fusul e mereu UTC la Vercel. `0 7` înseamnă 10:00 ora României iarna, 10:00 vara
— nu contează pentru o verificare zilnică, dar merită ştiut.

## 5. Ce se mută, ce dispare, ce rămâne

| Fișier | Ce se întâmplă |
|---|---|
| `cron.yml` | rămâne, dar **doar `workflow_dispatch`** — maneta de urgență |
| `keepalive.yml` | **se șterge**; o rulare la 5 minute care atinge baza ține proiectul treaz singură |
| `retentie.yml` | se șterge, trece pe Vercel |
| `backup.yml` | **rămâne pe GitHub** — are nevoie de `pg_dump` pe o mașină |

## 6. Alarma: `/api/cron/verificare`

Piesa care lipsea. Rulează o dată pe zi și **trimite email doar când ceva e în
neregulă**. Tăcerea ei înseamnă că totul e bine; un email înseamnă că trebuie
să te uiți.

Verifică trei lucruri:

1. **Bătaia inimii.** Cron-ul de reamintiri scrie un moment în `settings`
   (coloană nouă, `cron_ultima_rulare`) la fiecare rulare reușită. Dacă e mai
   vechi de 30 de minute, programarea s-a oprit.
2. **Reamintiri nelivrate.** Există înscrişi la evenimente care **au început
   deja** în ultimele 48 de ore şi care n-au `reminder_24h_sent_at`? Aceia n-au
   primit niciodată linkul. Asta ar fi prins problema de acum trei săptămâni.
3. **Trimiteri blocate.** Rânduri în `email_log` rămase pe `queued` mai vechi
   de o oră.

Emailul pleacă spre o adresă nouă, `EMAIL_ALERTE`, cu `EMAIL_REPLY_TO` ca
rezervă. Nu spre Andreea — sunt probleme tehnice, nu de conţinut.

Alarma **nu repară nimic singură**. Doar spune. Reparaţia rămâne o decizie.

## 7. Ce rămâne best-effort, și de ce e în regulă

Documentaţia Vercel o spune pe faţă: livrarea cron-ului e best-effort, nu se
reîncearcă la eşec, o rulare poate fi sărită, iar rar aceeaşi rulare poate fi
declanşată de două ori. Recomandarea lor e ca operaţia să fie idempotentă şi
să recupereze singură ce a rămas în urmă.

Exact asta face deja mecanismul nostru:

- **rulare sărită** — următoarea găseşte tot ce e scadent, ferestrele sunt
  largi, nu momente exacte;
- **rulare dublată** — revendicarea marchează rândurile înainte de trimitere,
  deci a doua nu mai vede nimic;
- **două rulări în paralel** — aceeaşi revendicare le face inofensive.

Deci trecerea pe Vercel nu cere nicio schimbare de proiectare. Doar ritmul se
face de zece ori mai bun.

## 8. Costul

Pe Pro se plăteşte timpul de CPU activ, nu cel de aşteptare. O rulare la 5
minute înseamnă 288 pe zi, iar marea majoritate nu găsesc nimic de trimis şi se
închid în câteva zeci de milisecunde. Aşteptarea după bază şi după furnizorul
de email nu se contorizează.

Dacă vrem şi mai puţin, 10 minute ar fi la fel de bun în practică: fereastra
reamintirii scurte e de o oră, deci tot ar avea şase şanse. Propun 5, ca
emailul să pice cât mai aproape de ora promisă.

## 9. Ordinea

1. `GET` pe cele două rute existente, plus durata şi plafonul.
2. `vercel.json`.
3. Ruta de verificare, coloana `cron_ultima_rulare`, bătaia inimii scrisă din
   cron-ul de reamintiri.
4. Curăţenia în workflow-uri.
5. Push. Cron-urile Vercel se activează **la deploy**, nu înainte.

**Ce faci tu:** adaugi `EMAIL_ALERTE` în Vercel. `CRON_SECRET` există deja şi
rămâne cum e.

## 10. Cum verificăm că merge

- În Vercel → Settings → Cron Jobs apar cele trei, cu ora ultimei rulări.
- La câteva minute după deploy, `settings.cron_ultima_rulare` trebuie să se
  mişte singur. Dacă se mişcă, programarea merge — fără să trimitem niciun
  email ca s-o dovedim.
- **Proba adevărată e azi la 17:00**: reamintirea scurtă pentru webinarul de la
  18:00 trebuie să plece fără ca cineva s-o declanşeze. Dacă apucăm deploy-ul
  până atunci, se vede pe viu.

## 11. Un avertisment pentru mai târziu

Un **Instant Rollback** în Vercel nu actualizează cron-urile — rămân cele din
deploy-ul anulat până sunt schimbate sau oprite manual. De ţinut minte dacă
vreodată dăm înapoi un deploy.
