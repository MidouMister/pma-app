import { SignUp } from "@clerk/nextjs"

export default function SignUpPage() {
  return (
    <SignUp
      signInUrl="/company/sign-in"
      fallbackRedirectUrl="/dashboard"
      appearance={{
        elements: {
          formButtonPrimary:
            "bg-primary text-primary-foreground hover:bg-primary/90 font-sans",
          card: "shadow-none",
          headerTitle: "text-foreground font-sans",
          headerSubtitle: "text-muted-foreground font-sans",
          socialButtonsBlockButtonText: "text-foreground font-sans",
          socialButtonsBlockButton:
            "border-input bg-background hover:bg-accent hover:text-accent-foreground font-sans",
          formFieldLabel: "text-foreground font-sans",
          formFieldInput:
            "border-input bg-background text-foreground font-sans",
          footerActionLink: "text-primary hover:text-primary/90 font-sans",
          identityPreviewText: "text-foreground font-sans",
          identityPreviewEditButton: "text-primary font-sans",
          formResendCodeLink: "text-primary font-sans",
          dividerLine: "bg-border",
          dividerText: "text-muted-foreground font-sans",
          alertText: "text-destructive font-sans",
        },
        variables: {
          fontFamily: "var(--font-sans)",
        },
      }}
    />
  )
}
