import Link from "next/link"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { Mail, UserPlus, Users } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { formatDate } from "@/lib/format"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { InviteMemberDialog } from "@/components/company/invite-member-dialog"

interface CompanyTeamPageProps {
  params: Promise<{ companyId: string }>
}

const roleBadgeVariant = (role: string) => {
  switch (role) {
    case "OWNER":
      return "default"
    case "ADMIN":
      return "secondary"
    default:
      return "outline"
  }
}

const roleLabel = (role: string) => {
  switch (role) {
    case "OWNER":
      return "Propriétaire"
    case "ADMIN":
      return "Administrateur"
    default:
      return "Membre"
  }
}

export default async function CompanyTeamPage({
  params,
}: CompanyTeamPageProps) {
  const { companyId } = await params

  const { userId } = await auth()
  if (!userId) {
    redirect("/company/sign-in")
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true, role: true, companyId: true },
  })

  if (!user || user.role !== "OWNER" || user.companyId !== companyId) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <EmptyState
          title="Accès non autorisé"
          description="Vous n'avez pas les permissions nécessaires pour accéder à cette page."
        />
      </div>
    )
  }

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { name: true },
  })

  if (!company) {
    redirect("/onboarding")
  }

  const [members, invitations, units] = await Promise.all([
    prisma.user.findMany({
      where: { companyId, role: { not: "OWNER" } },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        jobeTitle: true,
        avatarUrl: true,
        createdAt: true,
        unit: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.invitation.findMany({
      where: { companyId, status: "PENDING" },
      select: {
        id: true,
        email: true,
        role: true,
        jobeTilte: true,
        expiresAt: true,
        Unit: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.unit.findMany({
      where: { companyId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ])

  const unitOptions = units.map((u) => ({ id: u.id, name: u.name }))

  const memberColumns = [
    {
      id: "name",
      header: "Nom",
      cell: (row: (typeof members)[number]) => (
        <div className="flex items-center gap-2">
          <Avatar className="size-8">
            {row.avatarUrl ? (
              <AvatarImage src={row.avatarUrl} alt={row.name} />
            ) : (
              <AvatarFallback>
                {row.name?.charAt(0).toUpperCase() ?? "?"}
              </AvatarFallback>
            )}
          </Avatar>
          <span className="font-medium">{row.name ?? "—"}</span>
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
        <Badge variant={roleBadgeVariant(row.role)}>
          {roleLabel(row.role)}
        </Badge>
      ),
    },
    {
      id: "unit",
      header: "Unité",
      cell: (row: (typeof members)[number]) => (
        <span className="text-sm text-muted-foreground">
          {row.unit?.name ?? "—"}
        </span>
      ),
    },
    {
      id: "joinedAt",
      header: "Date d'adhésion",
      cell: (row: (typeof members)[number]) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(new Date(row.createdAt))}
        </span>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <PageHeader
        title="Équipe globale"
        description="Gérez les membres et les invitations de votre entreprise."
        breadcrumbs={[
          { label: company.name, href: `/company/${companyId}` },
          { label: "Équipe" },
        ]}
      >
        <InviteMemberDialog units={unitOptions} />
      </PageHeader>

      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Users className="size-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Membres</h2>
          <Badge variant="outline">{members.length}</Badge>
        </div>

        {members.length === 0 ? (
          <EmptyState
            title="Aucun membre"
            description="Invitez des membres pour commencer à collaborer."
          />
        ) : (
          <div className="rounded-md border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  {memberColumns.map((col) => (
                    <TableHead key={col.id}>{col.header}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    {memberColumns.map((col) => (
                      <TableCell key={col.id}>
                        {col.cell
                          ? col.cell(member)
                          : col.accessorKey
                            ? String(member[col.accessorKey] ?? "")
                            : null}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Mail className="size-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Invitations en attente</h2>
          <Badge variant="outline">{invitations.length}</Badge>
        </div>

        {invitations.length === 0 ? (
          <EmptyState
            title="Aucune invitation en attente"
            description="Les invitations envoyées apparaîtront ici jusqu'à leur acceptation ou expiration."
            icon={<UserPlus className="size-6" />}
          />
        ) : (
          <div className="rounded-md border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Unité</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Expiration</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">{inv.email}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {inv.Unit.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant={roleBadgeVariant(inv.role)}>
                        {roleLabel(inv.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">En attente</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(new Date(inv.expiresAt))}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" asChild>
                        <Link
                          href={`/company/${companyId}/invitations/${inv.id}`}
                        >
                          Gérer
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}
