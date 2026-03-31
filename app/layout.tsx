import type { Metadata } from "next"
import { ClerkProvider } from "@clerk/nextjs"
import { Geist_Mono, Oxanium } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

const oxanium = Oxanium({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: "PMA — Gestion de projets BTP",
  description:
    "Plateforme de gestion de projets pour les entreprises de construction, travaux publics et ingénierie en Algérie.",
  keywords: [
    "gestion de projets",
    "BTP",
    "construction",
    "Algérie",
    "Gantt",
    "Kanban",
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html
        lang="fr"
        suppressHydrationWarning
        className={cn(
          "antialiased",
          fontMono.variable,
          "font-sans",
          oxanium.variable
        )}
      >
        <body>
          <ThemeProvider>{children}</ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
