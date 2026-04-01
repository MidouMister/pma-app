"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, X } from "lucide-react"
import { toast } from "sonner"

interface TeamMember {
  id: string
  role: string
  user: {
    id: string
    name: string
    email: string
    avatarUrl: string | null
  }
}

interface ProjectTeamProps {
  projectId: string
  teamId: string
  members: TeamMember[]
  availableUsers: Array<{ id: string; name: string; email: string }>
  userRole: "OWNER" | "ADMIN" | "USER"
}

export function ProjectTeam({
  projectId: _projectId,
  teamId: _teamId,
  members,
  availableUsers,
  userRole,
}: ProjectTeamProps) {
  const [open, setOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState("")
  const [roleLabel, setRoleLabel] = useState("")
  const [localMembers, setLocalMembers] = useState(members)

  const canEdit = userRole === "OWNER" || userRole === "ADMIN"

  const existingMemberIds = new Set(localMembers.map((m) => m.user.id))
  const filteredUsers = availableUsers.filter(
    (u) => !existingMemberIds.has(u.id)
  )

  const handleAdd = () => {
    if (!selectedUserId || !roleLabel) {
      toast.error("Veuillez sélectionner un utilisateur et un rôle")
      return
    }

    const user = availableUsers.find((u) => u.id === selectedUserId)
    if (!user) return

    const newMember: TeamMember = {
      id: `temp-${Date.now()}`,
      role: roleLabel,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: null,
      },
    }

    setLocalMembers([...localMembers, newMember])
    toast.success("Membre ajouté (temporaire)")
    setOpen(false)
    setSelectedUserId("")
    setRoleLabel("")
  }

  const handleRemove = (memberId: string) => {
    setLocalMembers(localMembers.filter((m) => m.id !== memberId))
    toast.success("Membre retiré (temporaire)")
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Équipe du projet</h3>
        {canEdit && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Ajouter un membre
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajouter un membre</DialogTitle>
                <DialogDescription>
                  Sélectionnez un utilisateur à ajouter à l&apos;équipe du
                  projet.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Utilisateur</Label>
                  <Select
                    value={selectedUserId}
                    onValueChange={setSelectedUserId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un utilisateur" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredUsers.length === 0 ? (
                        <SelectItem value="none" disabled>
                          Aucun utilisateur disponible
                        </SelectItem>
                      ) : (
                        filteredUsers.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name} ({user.email})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Rôle</Label>
                  <Input
                    value={roleLabel}
                    onChange={(e) => setRoleLabel(e.target.value)}
                    placeholder="Ex: Chef de projet, Ingénieur, etc."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleAdd}>Ajouter</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {localMembers.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aucun membre dans l&apos;équipe
        </p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {localMembers.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between rounded-md border p-3"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={member.user.avatarUrl ?? undefined} />
                  <AvatarFallback>
                    {member.user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {member.user.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {member.role}
                  </p>
                </div>
              </div>
              {canEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleRemove(member.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
