import * as Sentry from '@sentry/nextjs'

/**
 * Sentry pornește doar dacă există un DSN.
 *
 * Nu folosim pluginul de build (`withSentryConfig`): singurul lui aport ar fi
 * încărcarea source map-urilor, care cere `@sentry/cli` și un token de
 * organizație. Inițializarea manuală prinde la fel de bine erorile.
 */
export function initSentry() {
  const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN
  if (!dsn) return

  Sentry.init({
    dsn,
    environment: process.env.VERCEL_ENV ?? 'development',
    // Planul gratuit are 5.000 de erori pe lună. Nu ne trebuie tracing.
    tracesSampleRate: 0,
    // Nu trimitem niciodată date de contact spre Sentry: e o bază de lead-uri
    // cu date personale, nu are ce căuta la un al treilea furnizor.
    sendDefaultPii: false,
  })
}
