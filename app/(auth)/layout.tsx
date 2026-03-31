import Link from "next/link"
import { Building2 } from "lucide-react"

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      {/* Subtle grid background */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:32px_32px] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)]" />

      <div className="relative z-10 flex w-full max-w-md flex-col items-center gap-8">
        <Link
          href="/"
          className="flex flex-col items-center gap-2 transition-opacity hover:opacity-80"
        >
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Building2 className="size-6" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              PMA
            </h1>
            <p className="text-sm text-muted-foreground">
              Gestion de projets BTP
            </p>
          </div>
        </Link>
        {children}
      </div>
    </div>
  )
}
