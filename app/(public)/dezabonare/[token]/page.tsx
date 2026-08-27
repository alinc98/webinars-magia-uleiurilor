import type { Metadata } from 'next'

import { createAdminClient } from '@/lib/supabase/admin'

export const metadata: Metadata = {
  title: 'Dezabonare',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function Page(props: PageProps<'/dezabonare/[token]'>) {
  const { token } = await props.params

  const supabase = createAdminClient()
  const { data, error } = await supabase.rpc('unsubscribe_by_token', { p_token: token })

  const rezultat = (data ?? { ok: false }) as { ok: boolean; reason?: string }
  const reusit = !error && rezultat.ok

  return (
    <main className="mx-auto w-full max-w-[560px] px-6 py-20">
      {reusit ? (
        <>
          <h1 className="font-heading text-3xl">Gata, te-am scos de pe listă.</h1>
          <p className="mt-4">
            Nu mai primești mesaje de promovare de la noi. Dacă te înscrii la o
            întâlnire, tot îți trimitem linkul de intrare — altfel n-ai cum să
            ajungi la ea.
          </p>
          <p className="text-muted-foreground mt-4 text-sm">
            Dacă a fost o greșeală, scrie-ne și te punem la loc.
          </p>
        </>
      ) : (
        <>
          <h1 className="font-heading text-3xl">Linkul nu mai e valid.</h1>
          <p className="mt-4">
            Se poate să fi fost deja folosit. Dacă tot primești mesaje, răspunde
            la unul dintre ele și rezolvăm manual.
          </p>
        </>
      )}
    </main>
  )
}
