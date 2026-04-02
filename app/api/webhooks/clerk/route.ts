import { Webhook } from "svix"
import { headers } from "next/headers"
import { type WebhookEvent, type UserJSON } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

type TransactionClient = Omit<
  typeof prisma,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>

export async function POST(req: Request) {
  const CLERK_WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!CLERK_WEBHOOK_SECRET) {
    console.error("CLERK_WEBHOOK_SECRET is not set")
    return new Response("Configuration error", { status: 500 })
  }

  const headerPayload = await headers()
  const svixId = headerPayload.get("svix-id")
  const svixTimestamp = headerPayload.get("svix-timestamp")
  const svixSignature = headerPayload.get("svix-signature")

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing Svix headers", { status: 400 })
  }

  const payload = await req.text()
  const body = JSON.parse(payload)

  const wh = new Webhook(CLERK_WEBHOOK_SECRET)

  try {
    wh.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    })
  } catch {
    return new Response("Invalid signature", { status: 400 })
  }

  const event = body as WebhookEvent

  try {
    switch (event.type) {
      case "user.created":
        await handleUserCreated(event.data as UserJSON)
        break
      case "user.updated":
        await handleUserUpdated(event.data as UserJSON)
        break
      case "user.deleted":
        await handleUserDeleted(event.data)
        break
      default:
        break
    }

    return new Response("Webhook processed", { status: 200 })
  } catch (error) {
    console.error("Webhook handler error:", error)
    return new Response("Webhook processing failed", { status: 400 })
  }
}

async function handleUserCreated(data: UserJSON) {
  const clerkId = data.id
  const emailAddresses = data.email_addresses
  const firstName = data.first_name
  const lastName = data.last_name
  const imageUrl = data.image_url

  const primaryEmail = emailAddresses?.[0]?.email_address

  if (!clerkId || !primaryEmail) {
    throw new Error("Missing required user data")
  }

  const name = [firstName, lastName].filter(Boolean).join(" ") || primaryEmail

  const pendingInvitation = await prisma.invitation.findFirst({
    where: {
      email: primaryEmail,
      status: "PENDING",
    },
  })

  if (pendingInvitation) {
    await prisma.$transaction(async (tx: TransactionClient) => {
      await tx.user.create({
        data: {
          clerkId,
          name,
          email: primaryEmail,
          role: pendingInvitation.role,
          jobTitle: pendingInvitation.jobTitle,
          avatarUrl: imageUrl,
          companyId: pendingInvitation.companyId,
          unitId: pendingInvitation.unitId,
        },
      })

      await tx.invitation.update({
        where: { id: pendingInvitation.id },
        data: { status: "ACCEPTED" },
      })
    })
  } else {
    await prisma.user.create({
      data: {
        clerkId,
        name,
        email: primaryEmail,
        avatarUrl: imageUrl,
      },
    })
  }
}

async function handleUserUpdated(data: UserJSON) {
  const clerkId = data.id
  const firstName = data.first_name
  const lastName = data.last_name
  const imageUrl = data.image_url

  if (!clerkId) return

  const name = [firstName, lastName].filter(Boolean).join("")

  const updateData: Record<string, string> = {}
  if (name) updateData.name = name
  if (imageUrl) updateData.avatarUrl = imageUrl

  if (Object.keys(updateData).length === 0) return

  await prisma.user.update({
    where: { clerkId },
    data: updateData,
  })
}

async function handleUserDeleted(data: unknown) {
  const userJson = data as UserJSON
  const clerkId = userJson.id

  if (!clerkId) return

  await prisma.user.update({
    where: { clerkId },
    data: {
      name: "Compte supprimé",
      avatarUrl: null,
    },
  })
}
