import { createRouteHandler } from "uploadthing/next"
import { uploadthingRouter } from "./core"

const handler = createRouteHandler({
  router: uploadthingRouter,
})

export { handler as GET, handler as POST }
