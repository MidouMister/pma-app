import { createRouteHandler } from "uploadthing/next"
import { uploadthingRouter } from "./core"

export const { GET, POST } = createRouteHandler({
  router: uploadthingRouter,
})
