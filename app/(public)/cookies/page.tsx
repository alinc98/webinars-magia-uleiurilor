import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Politica de cookie-uri',
}

export default function Page() {
  return (
    <main className="mx-auto w-full max-w-[720px] px-6 py-14">
      <h1 className="font-heading text-3xl">Politica de cookie-uri</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        Ultima actualizare: 28 august 2026
      </p>

      <div className="mt-8 flex flex-col gap-6 leading-relaxed">
        <section>
          <h2 className="font-heading text-xl">Ce se încarcă fără acordul tău</h2>
          <p className="mt-2">
            Un singur lucru: preferința ta legată de cookie-uri, ca să nu te
            întrebăm la fiecare pagină. Se numește{' '}
            <code className="bg-muted rounded px-1 py-0.5 text-sm">
              mu-consimtamant
            </code>
            , stă în browserul tău șase luni și nu conține nimic despre tine.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl">Ce se încarcă doar dacă accepți</h2>
          <p className="mt-2">
            Pixelul Meta, care ne arată câți dintre cei veniți dintr-o reclamă
            se înscriu efectiv. Pune cookie-urile{' '}
            <code className="bg-muted rounded px-1 py-0.5 text-sm">_fbp</code> și{' '}
            <code className="bg-muted rounded px-1 py-0.5 text-sm">_fbc</code>,
            care durează până la trei luni.
          </p>
          <p className="mt-2">
            Dacă refuzi, pixelul nu se încarcă deloc. Site-ul funcționează
            identic și te poți înscrie normal.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl">Cum te răzgândești</h2>
          <p className="mt-2">
            Șterge cookie-urile acestui site din setările browserului. La
            următoarea vizită te întrebăm din nou.
          </p>
        </section>
      </div>
    </main>
  )
}
