import { cn } from '@/lib/utils'

/**
 * Tabelul dens din admin: rânduri de 40px, antet de 12px cu majuscule și
 * spațiere de literă, zebra pe un ton cald. Densitatea informației e
 * prioritatea aici, nu atmosfera (brief §17).
 */
export function Tabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('bg-admin-bg border-admin-border overflow-x-auto rounded-lg border', className)}>
      <table className="w-full min-w-[640px] border-collapse text-sm">{children}</table>
    </div>
  )
}

export function CapTabel({ coloane }: { coloane: (string | { text: string; laDreapta?: boolean })[] }) {
  return (
    <thead>
      <tr>
        {coloane.map((c) => {
          const { text, laDreapta } = typeof c === 'string' ? { text: c, laDreapta: false } : c
          return (
            <th
              key={text}
              className={cn(
                'border-admin-border text-text-muted border-b-[1.5px] px-3 py-1.5 text-xs font-semibold tracking-[0.06em] whitespace-nowrap uppercase',
                laDreapta ? 'text-right' : 'text-left'
              )}
            >
              {text}
            </th>
          )
        })}
      </tr>
    </thead>
  )
}

export function RandTabel({
  index,
  children,
}: {
  index: number
  children: React.ReactNode
}) {
  return (
    <tr className={cn('h-10', index % 2 ? 'bg-admin-row-alt' : 'bg-transparent')}>{children}</tr>
  )
}

export function Celula({
  discret,
  accentuat,
  laDreapta,
  className,
  children,
}: {
  discret?: boolean
  accentuat?: boolean
  laDreapta?: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <td
      className={cn(
        'border-brand-border h-10 border-b px-3 py-1.5',
        discret && 'text-text-muted',
        accentuat && 'font-medium',
        laDreapta && 'text-right tabular-nums',
        className
      )}
    >
      {children}
    </td>
  )
}
