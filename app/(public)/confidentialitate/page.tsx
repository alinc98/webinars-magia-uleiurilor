import type { Metadata } from 'next'

import { getTextConsimtamant } from '@/lib/consimtamant-server'

export const metadata: Metadata = {
  title: 'Politica de confidențialitate',
}

export const revalidate = 3600

/**
 * Schelet de politică, cu locurile care trebuie completate marcate explicit.
 *
 * Nu e consultanță juridică: datele operatorului și DPO-ul se completează de
 * clientă, iar textul se verifică înainte de lansare (brief §10).
 */
export default async function Page() {
  const consimtamant = await getTextConsimtamant()

  return (
    <main className="mx-auto w-full max-w-[720px] px-6 py-14">
      <h1 className="font-heading text-3xl">Politica de confidențialitate</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        Ultima actualizare: 28 august 2026
      </p>

      <div className="mt-8 flex flex-col gap-6 leading-relaxed">
        <section>
          <h2 className="font-heading text-xl">Cine prelucrează datele</h2>
          <p className="mt-2">
            Operatorul datelor este <strong>Andreea Gligor</strong>, care
            organizează întâlnirile prezentate pe acest site. Ne poți scrie la{' '}
            <a href="mailto:contact@magia-uleiurilor.ro" className="underline">
              contact@magia-uleiurilor.ro
            </a>
            .
          </p>
          {/* TODO: denumirea juridică exactă, CUI și adresa sediului, de la clientă. */}
        </section>

        <section>
          <h2 className="font-heading text-xl">Ce date colectăm</h2>
          <p className="mt-2">
            Când te înscrii la o întâlnire: numele, adresa de email și,
            opțional, numărul de telefon. Separat, reținem de unde ai ajuns aici
            — sursa campaniei și identificatorul reclamei, dacă ai venit dintr-o
            reclamă.
          </p>
          <p className="mt-2">
            Nu colectăm date despre sănătate și nu îți cerem astfel de
            informații. Uleiurile esențiale nu sunt medicamente, iar întâlnirile
            noastre nu înlocuiesc consultul medical.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl">De ce le folosim</h2>
          <ul className="mt-2 flex list-disc flex-col gap-1 pl-5">
            <li>
              Ca să îți trimitem confirmarea, linkul de acces și reamintirile
              pentru evenimentul la care te-ai înscris.
            </li>
            <li>
              Ca să te anunțăm despre întâlnirile următoare, dacă ai bifat
              acordul.
            </li>
            <li>
              Ca să înțelegem care reclame aduc oameni interesați, prin
              măsurarea conversiilor.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading text-xl">Temeiul legal</h2>
          <p className="mt-2">
            Consimțământul tău, exprimat prin bifarea căsuței din formular.
            Textul pe care l-ai acceptat este cel de mai jos, salvat împreună cu
            data și versiunea lui.
          </p>
          {consimtamant && (
            <blockquote className="border-border text-muted-foreground mt-3 border-l-2 pl-4 text-sm">
              {consimtamant.body}
              <span className="mt-1 block text-xs">
                versiunea {consimtamant.version}
              </span>
            </blockquote>
          )}
        </section>

        <section>
          <h2 className="font-heading text-xl">Unde sunt stocate</h2>
          <p className="mt-2">
            Pe servere din Uniunea Europeană, în Frankfurt, Germania. Folosim
            Supabase pentru baza de date, Vercel pentru găzduire și Resend
            pentru trimiterea emailurilor. Fiecare dintre ei are un acord de
            prelucrare încheiat cu noi.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl">Cât le păstrăm</h2>
          <p className="mt-2">
            Cel mult 24 de luni de la ultima ta interacțiune cu noi. După acest
            termen, datele se anonimizează automat: rămâne doar statistica, fără
            nimic care să ducă spre tine.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl">Ce poți cere</h2>
          <ul className="mt-2 flex list-disc flex-col gap-1 pl-5">
            <li>O copie a tuturor datelor pe care le avem despre tine.</li>
            <li>Corectarea lor, dacă ceva e greșit.</li>
            <li>Ștergerea lor definitivă.</li>
            <li>Oprirea mesajelor de promovare, oricând.</li>
          </ul>
          <p className="mt-2">
            Scrie-ne și rezolvăm în cel mult 30 de zile. Dezabonarea are link
            propriu, în fiecare mesaj — nu trebuie să ne ceri nimic pentru ea.
          </p>
          <p className="mt-2">
            Dacă ești nemulțumit de cum am răspuns, te poți adresa Autorității
            Naționale de Supraveghere a Prelucrării Datelor cu Caracter Personal
            (
            <a href="https://www.dataprotection.ro" className="underline">
              dataprotection.ro
            </a>
            ).
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl">Cookie-uri</h2>
          <p className="mt-2">
            Detaliile sunt în{' '}
            <a href="/cookies" className="underline">
              politica de cookie-uri
            </a>
            . Pe scurt: nu se încarcă niciunul de urmărire înainte să accepți.
          </p>
        </section>
      </div>
    </main>
  )
}
