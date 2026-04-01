"use client"

import { useState, useTransition } from "react"
import { format } from "date-fns"
import { createProject, updateProject } from "@/actions/project"
import { toast } from "sonner"

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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import type { ProjectWithClient } from "./types"

interface ProjectDialogProps {
  project?: ProjectWithClient
  unitId: string
  companyId: string
  clients: Array<{ id: string; name: string }>
  onSuccess?: () => void
}

export function ProjectDialog({
  project,
  unitId,
  companyId,
  clients,
  onSuccess,
}: ProjectDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const [formData, setFormData] = useState({
    name: project?.name ?? "",
    code: project?.code ?? "",
    type: project?.type ?? "",
    montantHT: project?.montantHT?.toString() ?? "",
    montantTTC: project?.montantTTC?.toString() ?? "",
    ods: project?.ods ?? null,
    delaiMonths: project?.delaiMonths?.toString() ?? "0",
    delaiDays: project?.delaiDays?.toString() ?? "0",
    status: project?.status ?? "New",
    signe: project?.signe ?? false,
    clientId: project?.clientId ?? "",
  })

  const tvaAmount =
    Number(formData.montantTTC || 0) - Number(formData.montantHT || 0)
  const tvaPercent =
    Number(formData.montantHT || 0) > 0
      ? ((Number(formData.montantTTC || 0) - Number(formData.montantHT || 0)) /
          Number(formData.montantHT || 0)) *
        100
      : 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const data = {
        ...formData,
        montantHT: Number(formData.montantHT),
        montantTTC: Number(formData.montantTTC),
        delaiMonths: Number(formData.delaiMonths),
        delaiDays: Number(formData.delaiDays),
        ods: formData.ods,
        unitId,
        companyId,
      }

      let result
      if (project) {
        result = await updateProject({ id: project.id, ...data })
      } else {
        result = await createProject(data)
      }

      if (result.success) {
        toast.success(
          project ? "Projet mis à jour avec succès" : "Projet créé avec succès"
        )
        setOpen(false)
        onSuccess?.()
      } else {
        toast.error(result.error ?? "Une erreur est survenue")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>{project ? "Modifier" : "Créer un projet"}</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {project ? "Modifier le projet" : "Créer un nouveau projet"}
            </DialogTitle>
            <DialogDescription>
              {project
                ? "Modifiez les informations du projet ci-dessous."
                : "Remplissez les informations pour créer un nouveau projet."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom du projet *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <Input
                id="type"
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
                placeholder="Bâtiment, Travaux publics, etc."
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="montantHT">Montant HT (DA) *</Label>
                <Input
                  id="montantHT"
                  type="number"
                  value={formData.montantHT}
                  onChange={(e) =>
                    setFormData({ ...formData, montantHT: e.target.value })
                  }
                  required
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="montantTTC">Montant TTC (DA) *</Label>
                <Input
                  id="montantTTC"
                  type="number"
                  value={formData.montantTTC}
                  onChange={(e) =>
                    setFormData({ ...formData, montantTTC: e.target.value })
                  }
                  required
                  min="0"
                  step="0.01"
                />
                {formData.montantHT && formData.montantTTC && (
                  <p className="text-xs text-muted-foreground">
                    TVA: {tvaPercent.toFixed(2)}% ({tvaAmount.toFixed(2)} DA)
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date de commande (ODS)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      {formData.ods
                        ? format(formData.ods, "dd MMMM yyyy")
                        : "Sélectionner une date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.ods ?? undefined}
                      onSelect={(date) =>
                        setFormData({ ...formData, ods: date ?? null })
                      }
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="client">Client *</Label>
                <Select
                  value={formData.clientId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, clientId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="delaiMonths">Délai (mois)</Label>
                <Input
                  id="delaiMonths"
                  type="number"
                  value={formData.delaiMonths}
                  onChange={(e) =>
                    setFormData({ ...formData, delaiMonths: e.target.value })
                  }
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="delaiDays">Délai (jours)</Label>
                <Input
                  id="delaiDays"
                  type="number"
                  value={formData.delaiDays}
                  onChange={(e) =>
                    setFormData({ ...formData, delaiDays: e.target.value })
                  }
                  min="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Statut</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      status: value as
                        | "New"
                        | "InProgress"
                        | "Pause"
                        | "Complete",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="New">Nouveau</SelectItem>
                    <SelectItem value="InProgress">En cours</SelectItem>
                    <SelectItem value="Pause">En pause</SelectItem>
                    <SelectItem value="Complete">Terminé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2 pt-6">
                <Switch
                  id="signe"
                  checked={formData.signe}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, signe: checked })
                  }
                />
                <Label htmlFor="signe">Signé</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "En cours..." : project ? "Enregistrer" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
