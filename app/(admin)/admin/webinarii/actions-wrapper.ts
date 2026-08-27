'use server'

import { salveazaWebinar, type StareFormular } from './actions'

/**
 * Server Actions nu pot fi create prin `bind` într-un Server Component fără să
 * devină greu de tipat. Două înveliți subțiri rezolvă asta lizibil.
 */
export async function salveazaWebinarNou(stare: StareFormular, formData: FormData) {
  return salveazaWebinar(null, stare, formData)
}

export async function salveazaWebinarExistent(
  id: string,
  stare: StareFormular,
  formData: FormData
) {
  return salveazaWebinar(id, stare, formData)
}
