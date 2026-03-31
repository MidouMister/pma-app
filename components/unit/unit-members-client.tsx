"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { sendInvitation } from "@/actions/invitation"
import { removeMember, reassignAdminRole } from "@/actions/unit"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/shared/data-table"
import { toast } from "sonner"
import {
  UserPlus,
  UserMinus,
  Shield,
  Loader2,
  Mail,
  Calendar,
} from "lucide-react"

interface UnitMembersPageProps {
  members: {
    id: string
    name: string
    email: string
    role: string
    jobeTitle: string | null
    avatarUrl: string | null
    createdAt: Date
  }[]
  unitId: string
  currentUserId: string
  isOwner: boolean
}

export default function UnitMembersPage({
  members,
  unitId,
  currentUserId,
  isOwner,
}: UnitMembersPageProps) {
  const router = useRouter()
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<"ADMIN" | "USER">("USER")
  const [inviteLoading, setInviteLoading] = useState(false)
  const [removeTarget, setRemoveTarget] = useState<string | null>(null)
  const [removeLoading, setRemoveLoading] = useState(false)
  const [reassignTarget, setReassignTarget] = useState<string | null>(null)
  const [reassignLoading, setReassignLoading] = useState(false)

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviteLoading(true)

    try {
      const result = await sendInvitation({
        email: inviteEmail,
        role: inviteRole,
        unitId,
      })

      if (result.success) {
        toast.success("Invitation envoyée avec succès")
        setInviteEmail("")
        setInviteRole("USER")
        setInviteOpen(false)
        router.refresh()
      } else {
        toast.error(result.error ?? "Erreur lors de l'envoi de l'invitation")
      }
    } catch {
      toast.error("Une erreur inattendue est survenue")
    } finally {
      setInviteLoading(false)
    }
  }

  const handleRemove = async () => {
    if (!removeTarget) return
    setRemoveLoading(true)

    try {
      const result = await removeMember(removeTarget, unitId)

      if (result.success) {
        toast.success("Membre retiré avec succès")
        setRemoveTarget(null)
        router.refresh()
      } else {
        toast.error(result.error ?? "Erreur lors du retrait du membre")
      }
    } catch {
      toast.error("Une erreur inattendue est survenue")
    } finally {
      setRemoveLoading(false)
    }
  }

  const handleReassignAdmin = async (targetId: string) => {
    setReassignLoading(true)

    try {
      const result = await reassignAdminRole(targetId, unitId)

      if (result.success) {
        toast.success("Rôle ADMIN réassigné avec succès")
        setReassignTarget(null)
        router.refresh()
      } else {
        toast.error(result.error ?? "Erreur lors de la réassignation")
      }
    } catch {
      toast.error("Une erreur inattendue est survenue")
    } finally {
      setReassignLoading(false)
    }
  }

  const roleLabels: Record<string, string> = {
    OWNER: "Propriétaire",
    ADMIN: "Administrateur",
    USER: "Membre",
  }

  const columns = [
    {
      id: "name",
      header: "Nom",
      cell: (row: (typeof members)[number]) => (
        <div className="flex items-center gap-3">
          <Avatar className="size-8">
            {row.avatarUrl ? (
              <AvatarImage src={row.avatarUrl} alt={row.name} />
            ) : (
              <AvatarFallback>
                {row.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium">{row.name}</span>
            {row.jobeTitle && (
              <span className="text-xs text-muted-foreground">
                {row.jobeTitle}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      id: "email",
      header: "Email",
      accessorKey: "email" as keyof (typeof members)[number],
    },
    {
      id: "role",
      header: "Rôle",
      cell: (row: (typeof members)[number]) => (
        <Badge
          className={cn(
            row.role === "ADMIN" && "bg-blue-100 text-blue-800",
            row.role === "USER" && "bg-gray-100 text-gray-800"
          )}
        >
          {roleLabels[row.role] ?? row.role}
        </Badge>
      ),
    },
    {
      id: "joined",
      header: "Date d'adhésion",
      cell: (row: (typeof members)[number]) => (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Calendar className="size-3.5" />
          {new Date(row.createdAt).toLocaleDateString("fr-DZ", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: (row: (typeof members)[number]) => (
        <div className="flex items-center gap-2">
          {row.id !== currentUserId && (
            <>
              {isOwner && row.role === "ADMIN" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setReassignTarget(row.id)}
                  title="Réassigner le rôle ADMIN"
                >
                  <Shield className="size-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRemoveTarget(row.id)}
                className="text-destructive hover:text-destructive"
                title="Retirer le membre"
              >
                <UserMinus className="size-4" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Membres de l&apos;unité
        </h1>
        <p className="text-sm text-muted-foreground">
          Gérez les membres et les invitations de votre unité.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Équipe</CardTitle>
            <CardDescription>
              {members.length} membre{members.length !== 1 ? "s" : ""} dans
              cette unité.
            </CardDescription>
          </div>
          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 size-4" />
                Inviter un membre
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Inviter un membre</DialogTitle>
                <DialogDescription>
                  Envoyez une invitation par email pour rejoindre cette unité.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleInvite} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label
                    htmlFor="invite-email"
                    className="flex items-center gap-2"
                  >
                    <Mail className="size-4" />
                    Email
                  </Label>
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="membre@exemple.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="invite-role">Rôle</Label>
                  <Select
                    value={inviteRole}
                    onValueChange={(v: "ADMIN" | "USER") => setInviteRole(v)}
                  >
                    <SelectTrigger id="invite-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USER">Membre</SelectItem>
                      <SelectItem value="ADMIN">Administrateur</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setInviteOpen(false)}
                  >
                    Annuler
                  </Button>
                  <Button type="submit" disabled={inviteLoading}>
                    {inviteLoading && (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    )}
                    Envoyer l&apos;invitation
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={members}
            emptyMessage="Aucun membre dans cette unité. Invitez des membres pour commencer."
            getRowKey={(row) => row.id}
          />
        </CardContent>
      </Card>

      <AlertDialog
        open={!!removeTarget}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retirer le membre</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir retirer ce membre de l&apos;unité ? Ses
              tâches et ses feuilles de temps seront conservées, mais il perdra
              l&apos;accès à l&apos;application.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              className="text-destructive-foreground bg-destructive hover:bg-destructive/90"
              disabled={removeLoading}
            >
              {removeLoading && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
              Retirer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!reassignTarget}
        onOpenChange={(open) => !open && setReassignTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Réassigner le rôle ADMIN</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir transférer le rôle d&apos;administrateur
              de cette unité à ce membre ? L&apos;administrateur actuel perdra
              ses privilèges.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                reassignTarget && handleReassignAdmin(reassignTarget)
              }
              disabled={reassignLoading}
            >
              {reassignLoading && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
