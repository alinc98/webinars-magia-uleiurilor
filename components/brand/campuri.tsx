'use client'

import { cn } from '@/lib/utils'

export function Camp({
  id,
  eticheta,
  optional,
  hint,
  eroare,
  ...rest
}: React.ComponentProps<'input'> & {
  id: string
  eticheta: string
  optional?: boolean
  hint?: string
  eroare?: string
}) {
  const idHint = hint ? `${id}-hint` : undefined
  const idEroare = eroare ? `${id}-eroare` : undefined

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-body-sm text-text-body font-medium">
        {eticheta}
        {optional && <span className="text-text-muted font-normal"> (opțional)</span>}
      </label>

      <input
        id={id}
        aria-invalid={Boolean(eroare)}
        aria-describedby={cn(idEroare, idHint) || undefined}
        className={cn(
          'min-h-touch rounded-brand-sm bg-surface-raised text-body w-full border px-3.5',
          'focus-visible:outline-primary-700 focus-visible:outline-2 focus-visible:outline-offset-1',
          eroare ? 'border-[#a62b1d]' : 'border-brand-border'
        )}
        {...rest}
      />

      {eroare ? (
        <p id={idEroare} role="alert" className="text-caption text-[#a62b1d]">
          {eroare}
        </p>
      ) : (
        hint && (
          <p id={idHint} className="text-caption text-text-muted">
            {hint}
          </p>
        )
      )}
    </div>
  )
}

export function BifaConsimtamant({
  id,
  eroare,
  children,
  ...rest
}: React.ComponentProps<'input'> & { id: string; eroare?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="flex cursor-pointer items-start gap-3">
        <input
          id={id}
          type="checkbox"
          aria-invalid={Boolean(eroare)}
          className="accent-primary-800 mt-0.5 size-5 shrink-0"
          {...rest}
        />
        <span className="text-body-sm text-text-muted [&_a]:text-primary-800 [&_a]:underline">
          {children}
        </span>
      </label>
      {eroare && (
        <p role="alert" className="text-caption text-[#a62b1d]">
          {eroare}
        </p>
      )}
    </div>
  )
}
