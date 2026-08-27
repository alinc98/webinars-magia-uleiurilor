import type { Metadata } from 'next'
import { Fraunces, Inter } from 'next/font/google'
import './globals.css'

// `latin-ext` nu e opțional: fără el, ă â î ș ț lipsesc din fișierul de font
// și browserul le înlocuiește cu glife dintr-un font de rezervă.
const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
})

const fraunces = Fraunces({
  variable: '--font-fraunces',
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Webinarii · Magia Uleiurilor Esențiale',
    template: '%s · Magia Uleiurilor Esențiale',
  },
  description:
    'Întâlniri online despre uleiuri esențiale, cu Andreea Gligor — aromaterapeut.',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="ro"
      className={`${inter.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  )
}
