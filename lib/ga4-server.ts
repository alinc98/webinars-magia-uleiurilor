import 'server-only'

/**
 * Measurement Protocol — evenimente trimise de pe server.
 *
 * **Nu dublăm nimic de aici.** Spre deosebire de Conversions API al Meta, GA4
 * nu deduplică între browser și server: aceeași înscriere trimisă pe ambele căi
 * s-ar număra de două ori. Aici pleacă doar ce nu se poate întâmpla în
 * browserul omului — deocamdată, prezența marcată în panou după eveniment.
 *
 * Are nevoie de `client_id`-ul browserului, salvat pe înscriere la momentul
 * completării formularului. Fără el, evenimentul ar apărea ca un utilizator
 * nou, fără legătură cu vizita din care a venit înscrierea — adică fix opusul
 * motivului pentru care îl trimitem. Deci fără `client_id`, nu trimitem.
 *
 * Nu punem `session_id`: prezența se marchează la ore sau zile după eveniment,
 * când sesiunea din care a venit înscrierea s-a încheiat demult. GA4 o va trata
 * ca o sesiune nouă, ceea ce e corect.
 */

const PUNCT_FINAL = 'https://www.google-analytics.com/mp/collect'

type Parametri = Record<string, string | number | boolean | undefined>

export async function trimiteEvenimentGa4Server(optiuni: {
  clientId: string | null | undefined
  nume: string
  parametri?: Parametri
}): Promise<{ ok: boolean; motiv?: string }> {
  const masuratoare = process.env.NEXT_PUBLIC_GA4_ID
  const secret = process.env.GA4_API_SECRET

  if (!masuratoare || !secret) return { ok: false, motiv: 'neconfigurat' }
  if (!optiuni.clientId) return { ok: false, motiv: 'fara_client_id' }

  const corp = {
    client_id: optiuni.clientId,
    events: [{ name: optiuni.nume, params: optiuni.parametri ?? {} }],
  }

  const url = `${PUNCT_FINAL}?measurement_id=${encodeURIComponent(
    masuratoare
  )}&api_secret=${encodeURIComponent(secret)}`

  try {
    const raspuns = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(corp),
    })

    // Measurement Protocol răspunde 204 şi la un corp complet greşit — nu
    // validează nimic pe calea normală. Singura validare e endpointul de
    // depanare, folosit în testele noastre. Aici putem doar să ne asigurăm că
    // cererea a plecat.
    if (!raspuns.ok) {
      console.error('GA4 Measurement Protocol:', raspuns.status)
      return { ok: false, motiv: `http_${raspuns.status}` }
    }

    return { ok: true }
  } catch (eroare) {
    // Măsurarea n-are voie să strice acţiunea din care e chemată.
    console.error('GA4 Measurement Protocol a eșuat:', eroare)
    return { ok: false, motiv: 'retea' }
  }
}
