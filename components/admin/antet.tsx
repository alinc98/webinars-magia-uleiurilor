export function Antet({
  titlu,
  descriere,
  children,
}: {
  titlu: string
  descriere?: string
  children?: React.ReactNode
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4 border-b px-5 py-4 md:px-8 md:py-5">
      <div>
        <h1 className="text-xl font-semibold">{titlu}</h1>
        {descriere && <p className="text-muted-foreground mt-0.5 text-sm">{descriere}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </header>
  )
}
