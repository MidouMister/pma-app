import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
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
import { RevokeInvitationButton } from "./revoke-invitation-button"

const roleBadgeMap: Record<string, string> = {
  OWNER: "bg-purple-100 text-purple-800",
  ADMIN: "bg-blue-100 text-blue-800",
  USER: "bg-green-100 text-green-800",
}

async function getMembers(companyId: string) {
  return prisma.user.findMany({
    where: { companyId },
    include: {
      unit: {
        select: { id: true, name: true },
      },
    },
    orderBy: { name: "asc" },
  })
}

async function getPendingInvitations(companyId: string) {
  return prisma.invitation.findMany({
    where: { companyId, status: "PENDING" },
    include: {
      Unit: {
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })
}

async function getUnits(companyId: string) {
  return prisma.unit.findMany({
    where: { companyId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  })
}

export default async function UsersPage({
  params,
}: {
  params: Promise<{ companyId: string }>
}) {
  const { userId } = await auth()
  if (!userId) redirect("/company/sign-in")

  const { companyId } = await params

  const [members, pendingInvitations, units] = await Promise.all([
    getMembers(companyId),
    getPendingInvitations(companyId),
    getUnits(companyId),
  ])

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <PageHeader title="Équipe">
        <InviteMemberDialog companyId={companyId} units={units} />
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
                    <TableHead>Unité</TableHead>
                    <TableHead>Date d&apos;adhésion</TableHead>
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
                      <TableCell>
                        {member.unit?.name ?? (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(member.createdAt)}</TableCell>
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
                    <TableHead>Unité</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Expiration</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingInvitations.map((invitation) => (
                    <TableRow key={invitation.id}>
                      <TableCell>{invitation.email}</TableCell>
                      <TableCell>{invitation.Unit.name}</TableCell>
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
                        <Badge variant="outline">En attente</Badge>
                      </TableCell>
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
