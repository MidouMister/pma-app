import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { Users, FolderKanban } from "lucide-react"
import { getAllUnits } from "@/lib/queries"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CreateUnitDialog } from "./create-unit-dialog"
import { DeleteUnitDialog } from "./delete-unit-dialog"
import Link from "next/link"

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

export default async function UnitsPage({
  params,
}: {
  params: Promise<{ companyId: string }>
}) {
  const { userId } = await auth()
  if (!userId) redirect("/company/sign-in")

  const { companyId } = await params

  const units = await getAllUnits(companyId)

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <PageHeader
        title="Unités"
        description="Gérez les unités de votre entreprise"
      >
        <CreateUnitDialog />
      </PageHeader>

      {units.length === 0 ? (
        <EmptyState
          title="Aucune unité"
          description="Créez votre première unité pour commencer à organiser vos projets."
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Toutes les unités</CardTitle>
            <CardDescription>
              {units.length} unité{units.length !== 1 ? "s" : ""} configurée
              {units.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Unité</TableHead>
                    <TableHead>Admin</TableHead>
                    <TableHead className="text-center">Membres</TableHead>
                    <TableHead className="text-center">Projets</TableHead>
                    <TableHead className="w-24 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {units.map((unit) => (
                    <TableRow key={unit.id}>
                      <TableCell>
                        <Link
                          href={`/unite/${unit.id}`}
                          className="group flex items-center gap-3 font-medium text-foreground transition-colors hover:text-primary"
                        >
                          <div className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-xs font-medium text-primary">
                            {getInitials(unit.name)}
                          </div>
                          <span className="group-hover:underline">
                            {unit.name}
                          </span>
                        </Link>
                      </TableCell>
                      <TableCell>
                        {unit.admin ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="size-6">
                              <AvatarFallback className="text-[10px]">
                                {getInitials(unit.admin.name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{unit.admin.name}</span>
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            Non assigné
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Users className="size-3.5" />
                          {unit._count.members}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                          <FolderKanban className="size-3.5" />
                          {unit._count.projects}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DeleteUnitDialog
                          unitId={unit.id}
                          unitName={unit.name}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
