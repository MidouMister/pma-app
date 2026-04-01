"use client"

import { useTransition } from "react"
import { X } from "lucide-react"
import { toast } from "sonner"
import { revokeInvitation } from "@/actions/invitation"
import { Button } from "@/components/ui/button"

interface RevokeInvitationButtonProps {
  invitationId: string
}

export function RevokeInvitationButton({
  invitationId,
}: RevokeInvitationButtonProps) {
  const [isPending, startTransition] = useTransition()

  async function handleRevoke() {
    startTransition(async () => {
      const result = await revokeInvitation(invitationId)

      if (result.success) {
        toast.success("Invitation révoquée")
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleRevoke}
      disabled={isPending}
    >
      <X data-icon="inline-start" />
      Révoquer
    </Button>
  )
}
