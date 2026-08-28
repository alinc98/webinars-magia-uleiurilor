import type { Metadata } from 'next'

/**
 * Câmpurile Open Graph comune, plus cele proprii paginii.
 *
 * Există fiindcă Next **înlocuieşte** obiectul `openGraph` al layout-ului cu
 * cel al paginii, nu le îmbină: o pagină care îşi pune titlul propriu pierde
 * în tăcere `og:site_name` şi `og:locale` moştenite. Trecute prin funcţia
 * asta, valorile comune rămân pe loc.
 */
export function openGraph({
  url,
  title,
  description,
  images,
  type = 'website',
}: {
  url: string
  title?: string
  description?: string
  images?: string[]
  type?: 'website' | 'article'
}): Metadata['openGraph'] {
  return {
    siteName: 'Magia Uleiurilor Esențiale',
    locale: 'ro_RO',
    type,
    url,
    title,
    description,
    images,
  }
}
