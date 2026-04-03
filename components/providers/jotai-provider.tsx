"use client"

import { Provider as JotaiProvider } from "jotai"
import React from "react"

export function JotaiProviderWrapper({ children }: { children: React.ReactNode }) {
  return <JotaiProvider>{children}</JotaiProvider>
}
