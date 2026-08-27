/**
 * Documentele legale trăiesc pe site-ul principal, nu aici.
 *
 * Brieful §10 permite explicit varianta asta — „link clar spre cea existentă"
 * — cu o condiție: politica de pe magia-uleiurilor.ro trebuie actualizată ca
 * să acopere și prelucrarea nouă (bază de date proprie, Supabase, Vercel,
 * Resend, Meta CAPI, retenție de 24 de luni). Vezi PLAN.md §4, M7.
 */
export const SITE_PRINCIPAL = 'https://magia-uleiurilor.ro'

export const LINKURI = {
  sitePrincipal: SITE_PRINCIPAL,
  confidentialitate: `${SITE_PRINCIPAL}/politica-de-confidentialitate/`,
  cookies: `${SITE_PRINCIPAL}/politica-de-cookies/`,
  termeni: `${SITE_PRINCIPAL}/termeni-si-conditii/`,
  contact: 'mailto:andreea@magia-uleiurilor.ro',
  anpc: 'https://anpc.ro/',
  sol: 'https://ec.europa.eu/consumers/odr',
} as const
