import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/unite(.*)",
  "/user(.*)",
  "/company(.*)",
  "/onboarding(.*)",
])

const isPublicRoute = createRouteMatcher([
  "/",
  "/company/sign-in(.*)",
  "/company/sign-up(.*)",
  "/api/webhooks/clerk(.*)",
  "/api/uploadthing(.*)",
])

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) {
    return
  }

  if (isProtectedRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}
