import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { PageHeader } from "@/components/shared/page-header"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { EmptyState } from "@/components/shared/empty-state"
import { formatDate } from "@/lib/format"
import { InviteMemberDialog } from "./invite-member-dialog"
import { RemoveMemberButton } from "./remove-member-button"
import { RevokeInvitationButton } from "./revoke-invitation-button"

function getRoleBadgeVariant(
  role: string
): "default" | "secondary" | "outline" {
  switch (role) {
    case "OWNER":
      return "default"
    case "ADMIN":
      return "secondary"
    default:
      return "outline"
  }
}

function getRoleLabel(role: string): string {
  switch (role) {
    case "OWNER":
      return "Propriétaire"
    case "ADMIN":
      return "Administrateur"
    case "USER":
      return "Utilisateur"
    default:
      return role
  }
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

async function getUnitMembers(unitId: string, companyId: string) {
  return prisma.user.findMany({
    where: { unitId, companyId },
    orderBy: { name: "asc" },
  })
}

async function getPendingInvitations(unitId: string, companyId: string) {
  return prisma.invitation.findMany({
    where: { unitId, companyId, status: "PENDING" },
    orderBy: { createdAt: "desc" },
  })
}

export default async function UnitMembersPage({
  params,
}: {
  params: Promise<{ unitId: string }>
}) {
  const { userId } = await auth()
  if (!userId) redirect("/company/sign-in")

  const user = await getCurrentUser()
  if (!user || !user.companyId) redirect("/onboarding")

  const { unitId } = await params

  // Verify unit belongs to user's company (BR-01)
  const unit = await prisma.unit.findFirst({
    where: { id: unitId, companyId: user.companyId },
  })

  if (!unit) redirect("/company/sign-in")

  const [members, pendingInvitations] = await Promise.all([
    getUnitMembers(unitId, user.companyId),
    getPendingInvitations(unitId, user.companyId),
  ])

  const canRemoveMember = user.role === "OWNER" || user.role === "ADMIN"
  const canReassignAdmin = user.role === "OWNER"

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <PageHeader
        title="Membres de l'unité"
        description="Gérez les membres de votre unité"
      >
        <InviteMemberDialog
          unitId={unitId}
          currentMemberCount={members.length}
        />
      </PageHeader>

      {/* Members Table */}
      <Card>
        <CardHeader>
          <CardTitle>Membres</CardTitle>
          <CardDescription>
            {members.length} membre{members.length !== 1 ? "s" : ""} dans
            l&apos;unité
          </CardDescription>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <EmptyState
              title="Aucun membre"
              description="Invitez des membres pour commencer à collaborer."
            />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Date d&apos;adhésion</TableHead>
                    <TableHead className="w-48 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="size-8">
                            <AvatarFallback className="text-xs">
                              {getInitials(member.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{member.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {member.email}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(member.role)}>
                          {getRoleLabel(member.role)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(member.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {canRemoveMember && member.id !== user.id && (
                            <RemoveMemberButton
                              userId={member.id}
                              memberName={member.name}
                            />
                          )}
                          {canReassignAdmin &&
                            member.role !== "ADMIN" &&
                            member.id !== user.id && (
                              <Badge variant="outline" className="text-xs">
                                Promouvoir possible
                              </Badge>
                            )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      <Card>
        <CardHeader>
          <CardTitle>Invitations en attente</CardTitle>
          <CardDescription>
            {pendingInvitations.length} invitation
            {pendingInvitations.length !== 1 ? "s" : ""} en attente de réponse
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingInvitations.length === 0 ? (
            <EmptyState
              title="Aucune invitation en attente"
              description="Les invitations envoyées apparaîtront ici."
            />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Date d&apos;expiration</TableHead>
                    <TableHead className="w-24 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingInvitations.map((invitation) => (
                    <TableRow key={invitation.id}>
                      <TableCell className="font-medium">
                        {invitation.email}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(invitation.role)}>
                          {getRoleLabel(invitation.role)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(invitation.expiresAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <RevokeInvitationButton invitationId={invitation.id} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
