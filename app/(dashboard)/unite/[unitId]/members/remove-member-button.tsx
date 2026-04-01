"use client"

import { useState, useTransition } from "react"
import { UserMinus } from "lucide-react"
import { toast } from "sonner"
import { removeMember } from "@/actions/unit"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface RemoveMemberButtonProps {
  userId: string
  memberName: string
}

export function RemoveMemberButton({
  userId,
  memberName,
}: RemoveMemberButtonProps) {
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)

  async function handleRemove() {
    startTransition(async () => {
      const result = await removeMember({ userId })

      if (result.success) {
        toast.success(`${memberName} a été retiré de l'unité`)
        setOpen(false)
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <UserMinus data-icon="inline-start" />
          Retirer
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Retirer le membre</AlertDialogTitle>
          <AlertDialogDescription>
            Êtes-vous sûr de vouloir retirer {memberName} de cette unité ? Ses
            tâches et données seront conservées mais il n&apos;aura plus accès à
            l&apos;unité.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleRemove}
            disabled={isPending}
            className="text-destructive-foreground bg-destructive hover:bg-destructive/90"
          >
            Retirer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
