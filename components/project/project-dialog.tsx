"use client"

import { useState, useTransition } from "react"
import { format } from "date-fns"
import { createProject, updateProject } from "@/actions/project"
import { toast } from "sonner"
import {
  Building02Icon,
  CodeIcon,
  MapPinIcon,
  User02Icon,
  Note01Icon,
  Calendar03Icon,
  Timer01Icon,
  StatusIcon,
  CheckmarkCircle01Icon,
  PercentIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { Button } from "@/components/ui/button"
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
import { FormModal } from "@/components/shared/form-modal"
import { FormSection } from "@/components/shared/form-section"
import type { ProjectWithClient } from "@/lib/types"

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
    <FormModal
      open={open}
      onOpenChange={setOpen}
      title={project ? "Modifier le projet" : "Créer un nouveau projet"}
      description={
        project
          ? "Modifiez les informations du projet ci-dessous."
          : "Remplissez les informations pour créer un nouveau projet."
      }
      trigger={
        <Button className="gap-2 shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30">
          <HugeiconsIcon icon={Building02Icon} className="size-4" />
          {project ? "Modifier" : "Créer un projet"}
        </Button>
      }
      size="xl"
      isPending={isPending}
      onSubmit={handleSubmit}
      submitLabel={project ? "Enregistrer" : "Créer le projet"}
      submitPendingLabel="En cours..."
      icon={<HugeiconsIcon icon={Building02Icon} className="size-5" />}
    >
      <div className="grid gap-8">
        <FormSection
          number="01"
          title="Informations Générales"
          description="Identité et classification du projet"
          icon={
            <HugeiconsIcon icon={CodeIcon} className="size-4 text-primary" />
          }
        >
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-sm font-medium">
              Nom du projet <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="h-11"
              placeholder="Entrez le nom complet du projet"
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="code" className="text-sm font-medium">
                Code du projet <span className="text-destructive">*</span>
              </Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
                className="h-11 font-mono text-sm tracking-wide uppercase"
                placeholder="EX: PRJ-2024-001"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="type" className="text-sm font-medium">
                Type d&apos;ouvrage <span className="text-destructive">*</span>
              </Label>
              <Input
                id="type"
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
                className="h-11"
                placeholder="Bâtiment, Travaux publics..."
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="client" className="text-sm font-medium">
              Client Maître de l&apos;Ouvrage{" "}
              <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.clientId}
              onValueChange={(value) =>
                setFormData({ ...formData, clientId: value })
              }
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Sélectionner le client" />
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
        </FormSection>

        <FormSection
          number="02"
          title="Budget & Finances"
          description="Montants et répartition fiscale"
          icon={
            <HugeiconsIcon icon={Note01Icon} className="size-4 text-primary" />
          }
        >
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="montantHT" className="text-sm font-medium">
                Montant HT (DA) <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="montantHT"
                  type="number"
                  value={formData.montantHT}
                  onChange={(e) =>
                    setFormData({ ...formData, montantHT: e.target.value })
                  }
                  className="h-11 pr-12 font-semibold"
                  required
                  min="0"
                  step="0.01"
                />
                <div className="absolute inset-y-0 right-3 flex items-center text-xs font-bold text-muted-foreground">
                  DA
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="montantTTC" className="text-sm font-medium">
                Montant TTC (DA) <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="montantTTC"
                  type="number"
                  value={formData.montantTTC}
                  onChange={(e) =>
                    setFormData({ ...formData, montantTTC: e.target.value })
                  }
                  className="h-11 pr-12 font-semibold"
                  required
                  min="0"
                  step="0.01"
                />
                <div className="absolute inset-y-0 right-3 flex items-center text-xs font-bold text-muted-foreground">
                  DA
                </div>
              </div>
              {formData.montantHT && formData.montantTTC && (
                <div className="mt-1 flex items-center gap-1.5 rounded-lg bg-primary/5 px-3 py-2 text-xs font-medium text-primary">
                  <HugeiconsIcon icon={PercentIcon} className="size-3.5" />
                  TVA: {tvaPercent.toFixed(2)}% (+{tvaAmount.toFixed(2)} DA)
                </div>
              )}
            </div>
          </div>
        </FormSection>

        <FormSection
          number="03"
          title="Planning & Statut"
          description="Dates, délais et état d'avancement"
          icon={
            <HugeiconsIcon
              icon={Calendar03Icon}
              className="size-4 text-primary"
            />
          }
        >
          <div className="grid gap-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">
                  Date ODS <span className="text-destructive">*</span>
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-11 w-full justify-start text-left font-normal"
                    >
                      <HugeiconsIcon
                        icon={Calendar03Icon}
                        className="mr-2 size-4 text-muted-foreground"
                      />
                      {formData.ods
                        ? format(formData.ods, "dd MMMM yyyy")
                        : "Choisir la date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.ods ?? undefined}
                      onSelect={(date) =>
                        setFormData({ ...formData, ods: date ?? null })
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="delaiMonths" className="text-sm font-medium">
                  Délai (mois)
                </Label>
                <Input
                  id="delaiMonths"
                  type="number"
                  value={formData.delaiMonths}
                  onChange={(e) =>
                    setFormData({ ...formData, delaiMonths: e.target.value })
                  }
                  className="h-11"
                  min="0"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="delaiDays" className="text-sm font-medium">
                  Délai (jours)
                </Label>
                <Input
                  id="delaiDays"
                  type="number"
                  value={formData.delaiDays}
                  onChange={(e) =>
                    setFormData({ ...formData, delaiDays: e.target.value })
                  }
                  className="h-11"
                  min="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 items-end gap-6 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="status" className="text-sm font-medium">
                  État d&apos;avancement
                </Label>
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
                  <SelectTrigger className="h-11">
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
              <div className="flex items-center gap-3 rounded-lg border bg-card/50 p-4 transition-colors hover:bg-card">
                <Switch
                  id="signe"
                  checked={formData.signe}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, signe: checked })
                  }
                />
                <div className="flex flex-col gap-0.5">
                  <Label
                    htmlFor="signe"
                    className="text-sm leading-none font-medium"
                  >
                    Contrat Signé
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Cocher si le contrat physique est reçu
                  </p>
                </div>
              </div>
            </div>
          </div>
        </FormSection>
      </div>
    </FormModal>
  )
}
