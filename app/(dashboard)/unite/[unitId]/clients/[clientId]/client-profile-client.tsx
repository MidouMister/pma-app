"use client"

import { useTransition, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { deleteClient } from "@/actions/client"
import { formatCurrency } from "@/lib/format"
import { STATUS_COLORS } from "@/lib/constants"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Building02Icon,
  Mail01Icon,
  CallIcon,
  MapPinIcon,
  Edit02Icon,
  Delete01Icon,
  Folder01Icon,
  Link01Icon,
  InformationCircleIcon,
} from "@hugeicons/core-free-icons"
import { ClientDialog } from "@/components/client/client-dialog"
import { type Client } from "@prisma/client"

interface ClientProfileClientProps {
  client: Client
  projects: {
    id: string
    name: string
    code: string
    status: string
    montantTTC: number
  }[]
  totalTTC: number
  unitId: string
  canEdit: boolean
}

function getStatusLabel(status: string): string {
  switch (status) {
    case "New":
      return "Nouveau"
    case "InProgress":
      return "En cours"
    case "Pause":
      return "En pause"
    case "Complete":
      return "Terminé"
    default:
      return status
  }
}

export function ClientProfileClient({
  client,
  projects,
  totalTTC,
  unitId,
  canEdit,
}: ClientProfileClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [deleteOpen, setDeleteOpen] = useState(false)

  function handleDelete() {
    startTransition(async () => {
      const res = await deleteClient(client.id)
      if (res.success) {
        toast.success("Client supprimé avec succès")
        router.push(`/unite/${unitId}/clients`)
      } else {
        toast.error(res.error ?? "Erreur lors de la suppression")
        setDeleteOpen(false)
      }
    })
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-6 md:grid-cols-3">
        {/* Contact details card */}
        <Card className="overflow-hidden border-primary/10 bg-card/50 shadow-sm backdrop-blur-sm md:col-span-2">
          <CardHeader className="border-b bg-muted/50">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <HugeiconsIcon
                    icon={InformationCircleIcon}
                    className="size-5 text-primary"
                  />
                  Informations Générales
                </CardTitle>
                <CardDescription>
                  Détails et coordonnées du client
                </CardDescription>
              </div>
              {canEdit && (
                <div className="flex items-center gap-2">
                  <ClientDialog
                    unitId={unitId}
                    companyId={client.companyId}
                    client={client}
                    trigger={
                      <Button
                        variant="ghost"
                        size="icon"
                        className="transition-colors hover:bg-primary/10 hover:text-primary"
                      >
                        <HugeiconsIcon icon={Edit02Icon} className="size-4" />
                      </Button>
                    }
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="transition-colors hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setDeleteOpen(true)}
                  >
                    <HugeiconsIcon icon={Delete01Icon} className="size-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <dl className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-1.5">
                <dt className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <HugeiconsIcon icon={Building02Icon} className="size-3.5" />
                  Nom complet
                </dt>
                <dd className="text-base font-semibold tracking-tight text-foreground">
                  {client.name}
                </dd>
              </div>

              <div className="space-y-1.5">
                <dt className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <HugeiconsIcon icon={MapPinIcon} className="size-3.5" />
                  Wilaya
                </dt>
                <dd className="text-base font-medium">
                  {client.wilaya || "—"}
                </dd>
              </div>

              <div className="space-y-1.5">
                <dt className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <HugeiconsIcon icon={CallIcon} className="size-3.5" />
                  Téléphone
                </dt>
                <dd className="font-mono text-base font-medium">
                  {client.phone || "—"}
                </dd>
              </div>

              <div className="space-y-1.5">
                <dt className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <HugeiconsIcon icon={Mail01Icon} className="size-3.5" />
                  Email
                </dt>
                <dd className="text-base font-medium">{client.email || "—"}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Summary card */}
        <Card className="border-primary/10 bg-primary/5 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <HugeiconsIcon
                icon={Folder01Icon}
                className="size-5 text-primary"
              />
              Statistiques
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <span className="text-sm font-medium text-muted-foreground">
                Volume de projets
              </span>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-bold tracking-tighter text-foreground">
                  {projects.length}
                </span>
                <span className="mb-1 pb-1 text-sm text-muted-foreground">
                  actif{projects.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
            <Separator className="bg-primary/10" />
            <div className="space-y-2">
              <span className="text-sm font-medium text-muted-foreground">
                Chiffre d&apos;affaires total
              </span>
              <div className="text-2xl font-bold tracking-tight text-primary">
                {formatCurrency(totalTTC)}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Linked projects table */}
      <Card className="overflow-hidden border-primary/10 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between border-b bg-card">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              <HugeiconsIcon
                icon={Link01Icon}
                className="size-5 text-primary"
              />
              Historique des projets
            </CardTitle>
            <CardDescription>
              {projects.length} projet{projects.length !== 1 ? "s" : ""} lié
              {projects.length !== 1 ? "s" : ""} à ce client
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted opacity-50">
                <HugeiconsIcon
                  icon={Folder01Icon}
                  className="size-6 text-muted-foreground"
                />
              </div>
              <div className="space-y-1">
                <p className="font-medium text-muted-foreground">
                  Aucun projet associé
                </p>
                <p className="max-w-[250px] text-sm text-muted-foreground/60">
                  Ce client n&apos;a pas encore de projets enregistrés dans
                  cette unité.
                </p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="py-4">Désignation du projet</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="pr-6 text-right">Montant TTC</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => (
                  <TableRow
                    key={project.id}
                    className="group transition-colors hover:bg-primary/5"
                  >
                    <TableCell className="py-4 font-semibold text-foreground">
                      {project.name}
                    </TableCell>
                    <TableCell className="font-mono text-xs font-medium text-muted-foreground uppercase">
                      {project.code}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "h-6 rounded-sm px-2 py-0 text-[10px] font-bold tracking-wider uppercase",
                          STATUS_COLORS[
                            project.status as keyof typeof STATUS_COLORS
                          ]
                        )}
                      >
                        {getStatusLabel(project.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="pr-6 text-right font-bold tabular-nums">
                      {formatCurrency(project.montantTTC)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="sm:max-w-[425px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <HugeiconsIcon icon={Delete01Icon} className="size-5" />
              Supprimer définitivement ?
            </AlertDialogTitle>
            <AlertDialogDescription className="pt-2">
              Cette action est irréversible. Le client{" "}
              <strong className="font-semibold text-foreground">
                {client.name}
              </strong>{" "}
              ainsi que son historique seront définitivement supprimés.
              {projects.length > 0 && (
                <div className="mt-4 rounded-md border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
                  <strong>Attention:</strong> Ce client est associé à{" "}
                  {projects.length} projet{projects.length !== 1 ? "s" : ""}.
                  Assurez-vous qu&apos;aucun projet n&apos;est en cours.
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6">
            <AlertDialogCancel disabled={isPending}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="text-destructive-foreground bg-destructive shadow-lg shadow-destructive/20 hover:bg-destructive/90"
            >
              {isPending
                ? "Suppression en cours..."
                : "Confirmer la suppression"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
