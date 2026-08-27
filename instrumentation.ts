import { initSentry } from '@/lib/sentry'

export function register() {
  initSentry()
}

export { captureRequestError as onRequestError } from '@sentry/nextjs'
