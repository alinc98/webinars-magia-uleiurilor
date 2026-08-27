'use client'

import { Copy } from 'lucide-react'
import { useTransition } from 'react'

import { Button } from '@/components/ui/button'

import { dupliceazaWebinar } from './actions'

export function ButonDuplica({ id }: { id: string }) {
  const [inCurs, porneste] = useTransition()

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={inCurs}
      onClick={() => porneste(() => dupliceazaWebinar(id))}
      title="Copiază acest webinar"
    >
      <Copy className="size-4" />
      <span className="sr-only md:not-sr-only">Duplică</span>
    </Button>
  )
}
