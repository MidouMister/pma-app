import { SignIn } from "@clerk/nextjs"
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"

function SignInFallback() {
  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-4 w-32" />
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={<SignInFallback />}>
      <SignIn
        signUpUrl="/company/sign-up"
        fallbackRedirectUrl="/dashboard"
        appearance={{
          elements: {
            rootBox: "w-full",
            card: "bg-transparent shadow-none border-none",
            headerTitle: "text-2xl font-bold tracking-tight text-foreground",
            headerSubtitle: "text-sm text-muted-foreground font-medium",
            formButtonPrimary:
              "bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl py-3 font-semibold tracking-wide transition-all duration-300",
            socialButtonsBlockButton:
              "border border-input bg-card hover:bg-accent hover:text-accent-foreground rounded-xl py-3 transition-all duration-300",
            socialButtonsBlockButtonText: "text-foreground font-medium",
            formFieldLabel: "text-sm font-medium text-foreground",
            formFieldInput:
              "border border-input bg-card text-foreground rounded-xl py-3 px-4 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300",
            footerActionLink:
              "text-primary hover:text-primary/80 font-medium transition-colors duration-300",
            identityPreviewText: "text-foreground font-medium",
            identityPreviewEditButton: "text-primary hover:text-primary/80 font-medium",
            formResendCodeLink: "text-primary hover:text-primary/80 font-medium",
            dividerLine: "bg-border",
            dividerText: "text-muted-foreground font-medium",
            alertText: "text-destructive font-medium",
            footer: "hidden",
          },
        }}
      />
    </Suspense>
  )
}
