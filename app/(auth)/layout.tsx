export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="flex w-full max-w-md flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            PMA
          </h1>
          <p className="text-sm text-muted-foreground">Gestion de projets</p>
        </div>
        {children}
      </div>
    </div>
  )
}
