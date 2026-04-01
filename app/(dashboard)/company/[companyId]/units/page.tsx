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
import { EmptyState } from "@/components/shared/empty-state"
import { CreateUnitDialog } from "./create-unit-dialog"
import { DeleteUnitDialog } from "./delete-unit-dialog"
import Link from "next/link"

async function getUnits(companyId: string) {
  return prisma.unit.findMany({
    where: { companyId },
    include: {
      admin: {
        select: { id: true, name: true },
      },
      _count: {
        select: {
          members: true,
          projects: true,
        },
      },
    },
    orderBy: { name: "asc" },
  })
}

export default async function UnitsPage({
  params,
}: {
  params: Promise<{ companyId: string }>
}) {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const { companyId } = await params

  const units = await getUnits(companyId)

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6">
      <PageHeader title="Unités">
        <CreateUnitDialog />
      </PageHeader>

      {units.length === 0 ? (
        <EmptyState
          title="Aucune unité"
          description="Créez votre première unité pour commencer à organiser vos projets."
        />
      ) : (
        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Membres</TableHead>
                <TableHead>Projets</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {units.map((unit) => (
                <TableRow key={unit.id}>
                  <TableCell>
                    <Link
                      href={`/unite/${unit.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {unit.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {unit.admin?.name ?? (
                      <span className="text-muted-foreground">Non assigné</span>
                    )}
                  </TableCell>
                  <TableCell>{unit._count.members}</TableCell>
                  <TableCell>{unit._count.projects}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <DeleteUnitDialog unitId={unit.id} unitName={unit.name} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
