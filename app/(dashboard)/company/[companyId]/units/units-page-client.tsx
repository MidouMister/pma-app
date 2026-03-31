"use client"

import { useState, useTransition } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Plus,
  Pencil,
  Trash2,
  Building2,
  Users,
  FolderKanban,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  FieldGroup,
  Field,
  FieldLabel,
  FieldError,
} from "@/components/ui/field"
import { UploadButton } from "@uploadthing/react"
import type { UploadthingRouter } from "@/app/api/uploadthing/core"
import { createUnit, updateUnit, deleteUnit } from "@/actions/unit"

type UnitWithCounts = {
  id: string
  name: string
  address: string
  phone: string
  email: string
  logo: string | null
  admin: { name: string | null } | null
  _count: {
    projects: number
    members: number
  }
}

interface UnitsPageClientProps {
  units: UnitWithCounts[]
  companyId: string
}

export default function UnitsPageClient({
  units,
  companyId,
}: UnitsPageClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedUnit, setSelectedUnit] = useState<UnitWithCounts | null>(null)
  const [logoUrl, setLogoUrl] = useState("")
  const [editLogoUrl, setEditLogoUrl] = useState("")

  const [createForm, setCreateForm] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
  })
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({})

  const [editForm, setEditForm] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
  })
  const [editErrors, setEditErrors] = useState<Record<string, string>>({})

  const resetCreateForm = () => {
    setCreateForm({ name: "", address: "", phone: "", email: "" })
    setCreateErrors({})
    setLogoUrl("")
  }

  const openEdit = (unit: UnitWithCounts) => {
    setSelectedUnit(unit)
    setEditForm({
      name: unit.name,
      address: unit.address,
      phone: unit.phone,
      email: unit.email,
    })
    setEditLogoUrl(unit.logo ?? "")
    setEditErrors({})
    setEditOpen(true)
  }

  const handleCreate = () => {
    startTransition(async () => {
      const result = await createUnit({
        ...createForm,
        logo: logoUrl,
        companyId,
      })
      if (result.success) {
        toast.success("Unité créée avec succès")
        setCreateOpen(false)
        resetCreateForm()
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  const handleUpdate = () => {
    if (!selectedUnit) return
    startTransition(async () => {
      const result = await updateUnit({
        ...editForm,
        id: selectedUnit.id,
        logo: editLogoUrl,
        companyId,
      })
      if (result.success) {
        toast.success("Unité modifiée avec succès")
        setEditOpen(false)
        setSelectedUnit(null)
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  const handleDelete = () => {
    if (!selectedUnit) return
    startTransition(async () => {
      const result = await deleteUnit(selectedUnit.id)
      if (result.success) {
        toast.success("Unité supprimée avec succès")
        setDeleteOpen(false)
        setSelectedUnit(null)
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Unités</h1>
          <p className="text-sm text-muted-foreground">
            Gérez les unités de votre entreprise.
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 size-4" />
              Créer une unité
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Créer une unité</DialogTitle>
              <DialogDescription>
                Remplissez les informations de la nouvelle unité.
              </DialogDescription>
            </DialogHeader>
            <FieldGroup className="flex flex-col gap-4">
              <Field>
                <FieldLabel>Logo</FieldLabel>
                {logoUrl ? (
                  <div className="relative size-16 overflow-hidden rounded-md border">
                    <Image
                      src={logoUrl}
                      alt="Logo unité"
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <UploadButton<UploadthingRouter, "unitLogo">
                    endpoint="unitLogo"
                    onClientUploadComplete={(res) => {
                      if (res?.[0]) {
                        setLogoUrl(res[0].url)
                        toast.success("Logo téléchargé")
                      }
                    }}
                    onUploadError={() => {
                      toast.error("Erreur lors du téléchargement du logo")
                    }}
                  />
                )}
              </Field>
              <Field>
                <FieldLabel>Nom</FieldLabel>
                <Input
                  value={createForm.name}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="Nom de l'unité"
                />
                {createErrors.name && (
                  <FieldError>{createErrors.name}</FieldError>
                )}
              </Field>
              <Field>
                <FieldLabel>Adresse</FieldLabel>
                <Input
                  value={createForm.address}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, address: e.target.value }))
                  }
                  placeholder="Adresse de l'unité"
                />
                {createErrors.address && (
                  <FieldError>{createErrors.address}</FieldError>
                )}
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel>Téléphone</FieldLabel>
                  <Input
                    value={createForm.phone}
                    onChange={(e) =>
                      setCreateForm((f) => ({ ...f, phone: e.target.value }))
                    }
                    placeholder="0555 00 00 00"
                  />
                  {createErrors.phone && (
                    <FieldError>{createErrors.phone}</FieldError>
                  )}
                </Field>
                <Field>
                  <FieldLabel>Email</FieldLabel>
                  <Input
                    type="email"
                    value={createForm.email}
                    onChange={(e) =>
                      setCreateForm((f) => ({ ...f, email: e.target.value }))
                    }
                    placeholder="unite@exemple.com"
                  />
                  {createErrors.email && (
                    <FieldError>{createErrors.email}</FieldError>
                  )}
                </Field>
              </div>
            </FieldGroup>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setCreateOpen(false)}
                disabled={isPending}
              >
                Annuler
              </Button>
              <Button onClick={handleCreate} disabled={isPending}>
                {isPending ? "Création..." : "Créer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {units.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="mb-4 size-12 text-muted-foreground" />
            <h3 className="text-lg font-medium">Aucune unité</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Commencez par créer votre première unité pour gérer vos projets.
            </p>
            <Button
              className="mt-6"
              onClick={() => setCreateOpen(true)}
              variant="default"
            >
              <Plus className="mr-2 size-4" />
              Créer une unité
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Administrateur</TableHead>
                  <TableHead>Membres</TableHead>
                  <TableHead>Projets</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {units.map((unit) => (
                  <TableRow key={unit.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8">
                          {unit.logo ? (
                            <AvatarImage src={unit.logo} alt={unit.name} />
                          ) : (
                            <AvatarFallback>
                              {unit.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <span className="font-medium">{unit.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {unit.admin?.name ?? (
                        <span className="text-muted-foreground">
                          Non assigné
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="gap-1">
                        <Users className="size-3" />
                        {unit._count.members}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1">
                        <FolderKanban className="size-3" />
                        {unit._count.projects}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(unit)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            setSelectedUnit(unit)
                            setDeleteOpen(true)
                          }}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Modifier l&apos;unité</DialogTitle>
            <DialogDescription>
              Modifiez les informations de l&apos;unité.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup className="flex flex-col gap-4">
            <Field>
              <FieldLabel>Logo</FieldLabel>
              {editLogoUrl ? (
                <div className="flex items-center gap-4">
                  <div className="relative size-16 overflow-hidden rounded-md border">
                    <Image
                      src={editLogoUrl}
                      alt="Logo unité"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditLogoUrl("")}
                  >
                    Supprimer
                  </Button>
                </div>
              ) : (
                <UploadButton<UploadthingRouter, "unitLogo">
                  endpoint="unitLogo"
                  onClientUploadComplete={(res) => {
                    if (res?.[0]) {
                      setEditLogoUrl(res[0].url)
                      toast.success("Logo téléchargé")
                    }
                  }}
                  onUploadError={() => {
                    toast.error("Erreur lors du téléchargement du logo")
                  }}
                />
              )}
            </Field>
            <Field>
              <FieldLabel>Nom</FieldLabel>
              <Input
                value={editForm.name}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="Nom de l'unité"
              />
              {editErrors.name && <FieldError>{editErrors.name}</FieldError>}
            </Field>
            <Field>
              <FieldLabel>Adresse</FieldLabel>
              <Input
                value={editForm.address}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, address: e.target.value }))
                }
                placeholder="Adresse de l'unité"
              />
              {editErrors.address && (
                <FieldError>{editErrors.address}</FieldError>
              )}
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Téléphone</FieldLabel>
                <Input
                  value={editForm.phone}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, phone: e.target.value }))
                  }
                  placeholder="0555 00 00 00"
                />
                {editErrors.phone && (
                  <FieldError>{editErrors.phone}</FieldError>
                )}
              </Field>
              <Field>
                <FieldLabel>Email</FieldLabel>
                <Input
                  type="email"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, email: e.target.value }))
                  }
                  placeholder="unite@exemple.com"
                />
                {editErrors.email && (
                  <FieldError>{editErrors.email}</FieldError>
                )}
              </Field>
            </div>
          </FieldGroup>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditOpen(false)}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button onClick={handleUpdate} disabled={isPending}>
              {isPending ? "Modification..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l&apos;unité</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer l&apos;unité &quot;
              {selectedUnit?.name}&quot; ? Cette action est irréversible et
              supprimera tous les projets, tâches, clients et membres associés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="text-destructive-foreground bg-destructive hover:bg-destructive/90"
              disabled={isPending}
            >
              {isPending ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
