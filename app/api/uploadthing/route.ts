import { createRouteHandler } from "uploadthing/next"
import { type NextRequest } from "next/server"
import { uploadthingRouter } from "./core"

const handler = createRouteHandler({
  router: uploadthingRouter,
})

// Next.js 16 route handlers require a second `context` parameter with `params` as a Promise.
// UploadThing's createRouteHandler returns an object with GET/POST properties that don't
// match the new signature, so we wrap them in compatible functions.
export async function GET(request: NextRequest) {
  return handler.GET(request)
}

export async function POST(request: NextRequest) {
  return handler.POST(request)
}
