"use client"

import React, { useMemo, useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, Calculator, FolderKanban, X, ChevronDown } from "lucide-react"
import { toast } from "sonner"

import { Controller } from "react-hook-form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { FormModal } from "@/components/shared/form-modal"
import { FormSection } from "@/components/shared/form-section"
import { createProduction, updateProduction } from "@/actions/production"
import { formatCurrency } from "@/lib/format"
import { PhaseData } from "./types"

const MONTH_LABELS = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
]

const formSchema = z.object({
  projectId: z.string().min(1, "Veuillez sélectionner un projet"),
  phaseId: z.string().min(1, "Veuillez sélectionner une phase"),
  month: z.coerce.number().min(1).max(12),
  year: z.coerce.number().min(2000).max(2100),
  taux: z.coerce
    .number()
    .min(0.01, "Le taux doit être supérieur à 0")
    .max(100, "Le taux ne peut dépasser 100%"),
})

interface ProductionEntryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  phases: PhaseData[]
  unitId: string
  production?: {
    id: string
    projectId: string
    phaseId: string
    month: number
    year: number
    taux: number
  } | null
}

export function ProductionEntryModal({
  open,
  onOpenChange,
  phases,
  unitId,
  production,
}: ProductionEntryModalProps) {
  const [isPending, setIsPending] = useState(false)
  const [projectComboboxOpen, setProjectComboboxOpen] = useState(false)
  const currentYear = new Date().getFullYear()
  const yearsList = Array.from({ length: 7 }, (_, i) => currentYear - 2 + i)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema as any) as any,
    defaultValues: {
      projectId: "",
      phaseId: "",
      month: new Date().getMonth() + 1,
      year: currentYear,
      taux: 0,
    },
  })

  // Sync form values when modal opens or production changes
  useEffect(() => {
    if (open) {
      if (production) {
        form.reset({
          projectId: production.projectId,
          phaseId: production.phaseId,
          month: production.month,
          year: production.year,
          taux: production.taux,
        })
      } else {
        form.reset({
          projectId: "",
          phaseId: "",
          month: new Date().getMonth() + 1,
          year: currentYear,
          taux: 0,
        })
      }
    }
  }, [production, open, form, currentYear])

  const selectedProjectId = form.watch("projectId")
  const selectedPhaseId = form.watch("phaseId")
  const tauxSaisi = form.watch("taux") || 0

  // Derived options
  const projects = useMemo(() => {
    const map = new Map<string, string>()
    phases.forEach((p) => map.set(p.Project.id, p.Project.name))
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
  }, [phases])

  const selectedProject = useMemo(() => {
    return projects.find((p) => p.id === selectedProjectId)
  }, [projects, selectedProjectId])

  const availablePhases = useMemo(() => {
    if (!selectedProjectId) return []
    return phases.filter((p) => p.Project.id === selectedProjectId)
  }, [phases, selectedProjectId])

  const selectedPhase = useMemo(() => {
    return availablePhases.find((p) => p.id === selectedPhaseId)
  }, [availablePhases, selectedPhaseId])

  // Reset phase when project changes (only in creation mode)
  useEffect(() => {
    if (!production) {
      form.setValue("phaseId", "")
    }
  }, [selectedProjectId, form, production])

  // Computed phase stats
  const phaseStats = useMemo(() => {
    if (!selectedPhase) return null
    const mntHT = Number(selectedPhase.montantHT) || 0
    let tauxRealise = Number(selectedPhase.Product?.taux) || 0
    let mntRealise = Number(selectedPhase.Product?.montantProd) || 0

    // Subtract current production values if editing to compute correct baseline limits
    if (production) {
      tauxRealise = Math.max(0, tauxRealise - production.taux)
      const currentProdMnt = (mntHT * production.taux) / 100
      mntRealise = Math.max(0, mntRealise - currentProdMnt)
    }

    const resteTaux = Math.max(0, 100 - tauxRealise)
    const resteMnt = Math.max(0, mntHT - mntRealise)

    return {
      mntHT,
      tauxRealise,
      mntRealise,
      resteTaux,
      resteMnt,
    }
  }, [selectedPhase, production])

  const montantCalcule = selectedPhase
    ? (selectedPhase.montantHT * (Number(tauxSaisi) || 0)) / 100
    : 0

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!selectedPhase || !phaseStats) return

    // Validation: cannot exceed remaining amount
    if (values.taux > phaseStats.resteTaux) {
      form.setError("taux", {
        type: "manual",
        message: `Le taux saisi dépasse le reste à produire (${phaseStats.resteTaux}%)`,
      })
      return
    }

    setIsPending(true)
    try {
      const res = production
        ? await updateProduction({
            id: production.id,
            taux: values.taux,
            month: values.month,
            year: values.year,
          })
        : await createProduction({
            phaseId: values.phaseId,
            taux: values.taux,
            month: values.month,
            year: values.year,
          })

      if (!res.success) {
        throw new Error(res.error)
      }

      toast.success(
        production
          ? "Production mise à jour avec succès"
          : "Production ajoutée avec succès"
      )
      form.reset()
      onOpenChange(false)
    } catch (error) {
      console.error(error)
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de l'enregistrement"
      )
    } finally {
      setIsPending(false)
    }
  }

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title={
        production ? "Modifier une réalisation" : "Ajouter une réalisation"
      }
      description={
        production
          ? "Modifier le taux de réalisation pour cette période"
          : "Saisissez une production réelle pour une phase spécifique"
      }
      size="lg"
      isPending={isPending}
      onSubmit={form.handleSubmit(onSubmit as any)}
      onReset={() => form.reset()}
      submitLabel={production ? "Enregistrer" : "Ajouter"}
    >
      <div className="flex flex-col gap-8 p-2">
        <FormSection
          number="1"
          title="Projet et Phase"
          description="Sélectionnez le projet et la phase concernés."
        >
          <div className="flex flex-col gap-4">
            <div className="flex min-w-0 flex-col gap-2">
              <label className="text-sm font-medium">Projet</label>
              <Controller
                name="projectId"
                control={form.control}
                render={({ field, fieldState }) => (
                  <>
                    <Popover
                      open={production ? false : projectComboboxOpen}
                      onOpenChange={
                        production ? undefined : setProjectComboboxOpen
                      }
                    >
                      <PopoverTrigger asChild>
                        {field.value ? (
                          <button
                            type="button"
                            disabled={!!production}
                            className="flex w-full min-w-0 items-start gap-2 overflow-hidden rounded-md border border-input bg-muted/40 px-3 py-2 text-left text-xs disabled:cursor-not-allowed disabled:opacity-70"
                          >
                            <FolderKanban className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                            <span className="min-w-0 flex-1 leading-snug break-words whitespace-normal">
                              {selectedProject?.name}
                            </span>
                            {!production && (
                              <X
                                className="size-3.5 shrink-0 text-muted-foreground hover:text-foreground"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  field.onChange("")
                                }}
                              />
                            )}
                          </button>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            role="combobox"
                            disabled={!!production}
                            aria-expanded={projectComboboxOpen}
                            className="w-full justify-between text-xs font-normal"
                          >
                            <span className="truncate">
                              Sélectionner un projet
                            </span>
                            <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
                          </Button>
                        )}
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-[320px] p-0 sm:w-[480px]"
                        align="start"
                      >
                        <Command>
                          <CommandInput placeholder="Rechercher un projet..." />
                          <CommandList>
                            <CommandEmpty>Aucun projet trouvé</CommandEmpty>
                            <CommandGroup>
                              {projects.map((p) => (
                                <CommandItem
                                  key={p.id}
                                  value={p.name}
                                  onSelect={() => {
                                    field.onChange(p.id)
                                    setProjectComboboxOpen(false)
                                  }}
                                >
                                  <span className="text-xs leading-normal break-words whitespace-normal">
                                    {p.name}
                                  </span>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    {fieldState.error && (
                      <p className="mt-1 text-xs text-destructive">
                        {fieldState.error.message}
                      </p>
                    )}
                  </>
                )}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Phase</label>
              <Controller
                name="phaseId"
                control={form.control}
                render={({ field, fieldState }) => (
                  <>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={!!production || !selectedProjectId}
                    >
                      <SelectTrigger
                        className={
                          fieldState.error
                            ? "w-full min-w-0 overflow-hidden border-destructive ring-destructive"
                            : "w-full min-w-0 overflow-hidden"
                        }
                      >
                        <SelectValue placeholder="Sélectionnez une phase" />
                      </SelectTrigger>
                      <SelectContent>
                        {availablePhases.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.error && (
                      <p className="text-xs text-destructive">
                        {fieldState.error.message}
                      </p>
                    )}
                  </>
                )}
              />
            </div>
          </div>
        </FormSection>

        <FormSection
          number="2"
          title="Période"
          description="Précisez le mois et l'année de la réalisation."
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Mois</label>
              <Controller
                name="month"
                control={form.control}
                render={({ field, fieldState }) => (
                  <>
                    <Select
                      onValueChange={field.onChange}
                      value={String(field.value)}
                      disabled={!!production}
                    >
                      <SelectTrigger
                        className={
                          fieldState.error
                            ? "w-full min-w-0 overflow-hidden border-destructive ring-destructive"
                            : "w-full min-w-0 overflow-hidden"
                        }
                      >
                        <SelectValue placeholder="Mois" />
                      </SelectTrigger>
                      <SelectContent>
                        {MONTH_LABELS.map((m, idx) => (
                          <SelectItem key={idx + 1} value={String(idx + 1)}>
                            {m}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.error && (
                      <p className="text-xs text-destructive">
                        {fieldState.error.message}
                      </p>
                    )}
                  </>
                )}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Année</label>
              <Controller
                name="year"
                control={form.control}
                render={({ field, fieldState }) => (
                  <>
                    <Select
                      onValueChange={field.onChange}
                      value={String(field.value)}
                      disabled={!!production}
                    >
                      <SelectTrigger
                        className={
                          fieldState.error
                            ? "w-full min-w-0 overflow-hidden border-destructive ring-destructive"
                            : "w-full min-w-0 overflow-hidden"
                        }
                      >
                        <SelectValue placeholder="Année" />
                      </SelectTrigger>
                      <SelectContent>
                        {yearsList.map((y) => (
                          <SelectItem key={y} value={String(y)}>
                            {y}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.error && (
                      <p className="text-xs text-destructive">
                        {fieldState.error.message}
                      </p>
                    )}
                  </>
                )}
              />
            </div>
          </div>
        </FormSection>

        <FormSection
          number="3"
          title="Réalisation"
          description="Saisissez le taux et consultez le reste à produire."
        >
          <div className="flex flex-col gap-6">
            {phaseStats && (
              <div className="flex flex-col gap-2 rounded-lg border bg-muted/30 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Montant HT Phase :
                  </span>
                  <span className="font-semibold text-foreground">
                    {formatCurrency(phaseStats.mntHT)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Déjà réalisé ({phaseStats.tauxRealise}%) :
                  </span>
                  <span className="font-semibold text-emerald-500 dark:text-emerald-400">
                    {formatCurrency(phaseStats.mntRealise)}
                  </span>
                </div>
                <div className="my-1 border-t"></div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-muted-foreground">
                    Reste à produire ({phaseStats.resteTaux}%) :
                  </span>
                  <span className="font-bold text-violet-500 dark:text-violet-400">
                    {formatCurrency(phaseStats.resteMnt)}
                  </span>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">
                Pourcentage de réalisation (%)
              </label>
              <Controller
                name="taux"
                control={form.control}
                render={({ field, fieldState }) => (
                  <>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Ex: 25"
                      {...field}
                      className={
                        fieldState.error
                          ? "border-destructive ring-destructive"
                          : ""
                      }
                    />
                    {fieldState.error && (
                      <p className="text-xs text-destructive">
                        {fieldState.error.message}
                      </p>
                    )}
                    {phaseStats && !fieldState.error && (
                      <p className="mt-1 flex items-center gap-2 text-[13px] text-indigo-600">
                        <Calculator className="size-3" />
                        Montant équivalent :{" "}
                        <span className="font-semibold">
                          {formatCurrency(montantCalcule)}
                        </span>
                      </p>
                    )}
                  </>
                )}
              />
            </div>
          </div>
        </FormSection>
      </div>
    </FormModal>
  )
}
