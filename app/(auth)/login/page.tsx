import type { Metadata } from 'next'

import { ButonLink } from '@/components/brand/buton'

import { FormularLogin } from './formular'

export const metadata: Metadata = {
  title: 'Autentificare',
  robots: { index: false, follow: false },
}

export default async function Page(props: PageProps<'/login'>) {
  const { redirect, eroare } = await props.searchParams

  return (
    <main className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center px-6 py-20">
      <h1 className="font-heading text-2xl">Panou de administrare</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        Îți trimitem un link de acces pe email. Fără parolă de ținut minte.
      </p>

      {typeof eroare === 'string' && (
        <p role="alert" className="text-destructive mt-4 text-sm">
          Linkul a expirat sau a fost deja folosit. Cere altul.
        </p>
      )}

      <div className="mt-8">
        <FormularLogin redirectTo={typeof redirect === 'string' ? redirect : undefined} />
      </div>

      {/* Stă în afara formularului, ca să rămână şi după trimitere, când
          ecranul se schimbă în „verifică-ţi emailul". Cine a nimerit aici din
          greşeală are nevoie de ieşire tocmai atunci. */}
      <div className="mt-10 border-t pt-6">
        <ButonLink href="/" varianta="ghost">
          Înapoi la întâlniri
        </ButonLink>
      </div>
    </main>
  )
}
