export const COOKIE_CONSIMTAMANT = 'mu-consimtamant'
/** Se schimbă doar dacă se modifică ce categorii cerem — atunci se reîntreabă. */
export const VERSIUNE_CONSIMTAMANT = 1

export type StareConsimtamant = {
  versiune: number
  analiza: boolean
  marketing: boolean
  la: string
}

export function citesteConsimtamant(brut?: string | null): StareConsimtamant | null {
  if (!brut) return null
  try {
    const stare = JSON.parse(decodeURIComponent(brut)) as StareConsimtamant
    if (stare.versiune !== VERSIUNE_CONSIMTAMANT) return null
    return stare
  } catch {
    return null
  }
}

export function scrieConsimtamant(stare: Omit<StareConsimtamant, 'versiune' | 'la'>) {
  const valoare: StareConsimtamant = {
    ...stare,
    versiune: VERSIUNE_CONSIMTAMANT,
    la: new Date().toISOString(),
  }
  // 6 luni: sub un an, ca să fie reconfirmat rezonabil de des.
  const expira = new Date(Date.now() + 182 * 24 * 60 * 60 * 1000).toUTCString()
  document.cookie = `${COOKIE_CONSIMTAMANT}=${encodeURIComponent(
    JSON.stringify(valoare)
  )}; path=/; expires=${expira}; SameSite=Lax`
  return valoare
}
