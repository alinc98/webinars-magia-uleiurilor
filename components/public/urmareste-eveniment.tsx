'use client'

import { useEffect, useRef } from 'react'

import { vezuiEveniment, type DateEvenimentGa4 } from '@/lib/ga4'

/**
 * Raportează către GA4 că s-a deschis pagina unei întâlniri.
 *
 * Un component separat, nu un apel în pagină: pagina e randată pe server, iar
 * `gtag` trăiește doar în browser.
 *
 * Garda pe `useRef` există din acelaşi motiv ca la pixel: în dev, StrictMode
 * rulează efectele de două ori, iar fără ea am raporta două vizualizări la
 * fiecare deschidere — şi am descoperi-o abia când numerele n-ar avea sens.
 */
export function UrmaresteEveniment({ date }: { date: DateEvenimentGa4 }) {
  const raportat = useRef<string | null>(null)

  useEffect(() => {
    if (raportat.current === date.slug) return
    raportat.current = date.slug
    vezuiEveniment(date)
  }, [date])

  return null
}
