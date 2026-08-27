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
    <header className="border-admin-border bg-admin-bg sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3 md:px-6">
      <div className="min-w-0">
        <h1 className="text-base font-semibold">{titlu}</h1>
        {descriere && <p className="text-text-muted text-xs">{descriere}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </header>
  )
}
