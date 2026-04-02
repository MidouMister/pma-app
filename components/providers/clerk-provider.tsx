"use client"

import { ClerkProvider as NextClerkProvider } from "@clerk/nextjs"
import { Suspense } from "react"

function ClerkProviderInner({ children }: { children: React.ReactNode }) {
  return <NextClerkProvider>{children}</NextClerkProvider>
}

export function ClerkProvider({ children }: { children: React.ReactNode }) {
  return (
    <Suspense>
      <ClerkProviderInner>{children}</ClerkProviderInner>
    </Suspense>
  )
}
