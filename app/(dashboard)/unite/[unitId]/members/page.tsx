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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/shared/empty-state"
import { formatDate } from "@/lib/format"
import { InviteMemberDialog } from "./invite-member-dialog"
import { RemoveMemberButton } from "./remove-member-button"
import { RevokeInvitationButton } from "./revoke-invitation-button"

const roleBadgeMap: Record<string, string> = {
  OWNER: "bg-purple-100 text-purple-800",
  ADMIN: "bg-blue-100 text-blue-800",
  USER: "bg-green-100 text-green-800",
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
      <PageHeader title="Membres de l'unité">
        <InviteMemberDialog
          unitId={unitId}
          currentMemberCount={members.length}
        />
      </PageHeader>

      {/* Members Table */}
      <Card>
        <CardHeader>
          <CardTitle>Membres</CardTitle>
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
                    <TableHead className="w-48">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">
                        {member.name}
                      </TableCell>
                      <TableCell>{member.email}</TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={roleBadgeMap[member.role]}
                        >
                          {member.role}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(member.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
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
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingInvitations.map((invitation) => (
                    <TableRow key={invitation.id}>
                      <TableCell>{invitation.email}</TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={roleBadgeMap[invitation.role]}
                        >
                          {invitation.role}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(invitation.expiresAt)}</TableCell>
                      <TableCell>
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
