'use client'

import { useActionState, useTransition } from 'react'

/**
 * Trimite un formular către o Server Action **fără** să-i piardă conținutul.
 *
 * React 19 resetează automat câmpurile necontrolate după o acțiune trimisă
 * prin `<form action={...}>`. La o salvare reușită e ce vrei; la una respinsă
 * de validare e o pierdere de muncă: omul completează un formular lung, uită
 * un câmp, apasă Salvează și rămâne cu ecranul gol.
 *
 * Apelând acțiunea din `onSubmit`, în propria tranziție, resetarea automată nu
 * se mai declanșează, iar ce a scris omul rămâne pe ecran lângă mesajul de
 * eroare.
 *
 * **Formularul trebuie marcat `noValidate`.** Altfel validarea nativă a
 * browserului blochează evenimentul `submit` la primul câmp `required` gol, iar
 * acțiunea nu se mai execută deloc. `action={...}` ocolea validarea nativă;
 * `onSubmit` nu. Vrem oricum mesajele noastre, în română, nu bulele
 * browserului.
 */
export function useActiuneFormular<S>(
  actiune: (stare: Awaited<S>, formData: FormData) => S | Promise<S>,
  stareInitiala: Awaited<S>
) {
  const [stare, trimite, inCursActiune] = useActionState(actiune, stareInitiala)
  const [inCursTranzitie, startTransition] = useTransition()

  function onSubmit(eveniment: React.FormEvent<HTMLFormElement>) {
    eveniment.preventDefault()
    const formData = new FormData(eveniment.currentTarget)
    startTransition(() => trimite(formData))
  }

  return { stare, onSubmit, inCurs: inCursActiune || inCursTranzitie }
}
