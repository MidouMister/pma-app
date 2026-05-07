"use client"

import { useCallback, useEffect, useState, useTransition } from "react"

import { format } from "date-fns"
import { fr } from "date-fns/locale"
import {
  CalendarIcon,
  Check,
  FolderKanban,
  Layers,
  ListTree,
  MapPin,
  User,
  X,
} from "lucide-react"
import { toast } from "sonner"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"

import { createTask, updateTask } from "@/actions/task"
import { createTag } from "@/actions/tag"
import { cn } from "@/lib/utils"

export interface TaskDialogProps {
  task?: {
    id: string
    title: string
    description: string | null
    projectId: string
    phaseId: string | null
    subPhaseId: string | null
    laneId: string | null
    assignedUserId: string | null
    dueDate: Date | null
    startDate?: Date | null
    endDate?: Date | null
    Tags?: Array<{ id: string; name: string; color: string }>
  }
  unitId: string
  companyId: string
  projects: Array<{
    id: string
    name: string
    phases: Array<{
      id: string
      name: string
      SubPhases: Array<{ id: string; name: string }>
    }>
  }>
  lanes: Array<{ id: string; name: string }>
  teamMembers: Array<{ id: string; name: string }>
  availableTags?: Array<{ id: string; name: string; color: string }>
  onSuccess?: () => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
  laneId?: string
}

export function TaskDialog({
  task,
  unitId,
  companyId,
  projects,
  lanes,
  teamMembers,
  availableTags,
  onSuccess,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
  laneId: initialLaneId,
}: TaskDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen
  const setIsOpen = externalOnOpenChange ?? setInternalOpen

  const [formData, setFormData] = useState(() => {
    // Compute smart default phase: if project has exactly 1 phase, auto-select
    let phaseId = task?.phaseId ?? ""
    let subPhaseId = task?.subPhaseId ?? ""
    if (!task?.phaseId && task?.projectId) {
      const project = projects.find((p) => p.id === task.projectId)
      if (project?.phases.length === 1) {
        phaseId = project.phases[0].id
        const subPhases = project.phases[0].SubPhases
        if (subPhases.length === 1) {
          subPhaseId = subPhases[0].id
        }
      }
    }
    return {
      title: task?.title ?? "",
      description: task?.description ?? "",
      projectId: task?.projectId ?? "",
      phaseId,
      subPhaseId,
      laneId: task?.laneId ?? initialLaneId ?? "",
      assignedUserId: task?.assignedUserId ?? "",
      dueDate: (task?.dueDate as Date | null) ?? null,
      startDate: (task?.startDate as Date | null) ?? null,
      endDate: (task?.endDate as Date | null) ?? null,
    }
  })

  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(() => {
    return task?.Tags?.map((t) => t.id) ?? []
  })

  // Combobox open states
  const [projectComboboxOpen, setProjectComboboxOpen] = useState(false)
  const [assigneeComboboxOpen, setAssigneeComboboxOpen] = useState(false)
  const [tagsComboboxOpen, setTagsComboboxOpen] = useState(false)

  const selectedProject = projects.find((p) => p.id === formData.projectId)
  const projectPhases = selectedProject?.phases ?? []
  const selectedPhase = projectPhases.find((ph) => ph.id === formData.phaseId)
  const phaseSubPhases = selectedPhase?.SubPhases ?? []

  // Tag creation state
  const [newTagName, setNewTagName] = useState("")
  const [newTagColor, setNewTagColor] = useState("#3b82f6") // Default blue
  const [isCreatingTag, setIsCreatingTag] = useState(false)
  const [localTags, setLocalTags] = useState(availableTags ?? [])

  useEffect(() => {
    if (availableTags) setLocalTags(availableTags)
  }, [availableTags])

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return
    setIsCreatingTag(true)
    try {
      const result = await createTag({
        name: newTagName,
        color: newTagColor,
        unitId,
      })
      if (result.success && result.tag) {
        toast.success("Tag créé")
        setNewTagName("")
        const newTag = result.tag as { id: string; name: string; color: string }
        setLocalTags((prev) => [...prev, newTag])
        setSelectedTagIds((prev) => [...prev, newTag.id])
      } else {
        toast.error(result.error ?? "Erreur")
      }
    } finally {
      setIsCreatingTag(false)
    }
  }

  const tagColors = [
    "#3b82f6", // Blue
    "#10b981", // Green
    "#f59e0b", // Amber
    "#ef4444", // Red
    "#8b5cf6", // Violet
    "#64748b", // Slate
  ]

  const buildActionPayload = useCallback(
    () => ({
      ...formData,
      id: task?.id,
      unitId,
      companyId,
      // Normalize empty strings to undefined — Zod .optional() accepts
      // undefined but rejects "" as an invalid UUID
      phaseId: formData.phaseId || undefined,
      subPhaseId: formData.subPhaseId || undefined,
      laneId: formData.laneId || undefined,
      assignedUserId: formData.assignedUserId || undefined,
      // tagIds for both create and update
      ...(selectedTagIds.length > 0 && { tagIds: selectedTagIds }),
    }),
    [formData, task?.id, unitId, companyId, selectedTagIds]
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const action = task?.id ? updateTask : createTask
      const result = await action(buildActionPayload())

      if (result.success) {
        toast.success(task ? "Tâche mise à jour" : "Tâche créée")
        setIsOpen(false)
        onSuccess?.()
      } else {
        toast.error(result.error ?? "Erreur")
      }
    })
  }

  // Keyboard shortcut: Ctrl+Enter to submit (not in textarea)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.ctrlKey &&
        e.key === "Enter" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault()
        startTransition(async () => {
          const action = task?.id ? updateTask : createTask
          const result = await action(buildActionPayload())

          if (result.success) {
            toast.success(task ? "Tâche mise à jour" : "Tâche créée")
            setIsOpen(false)
            onSuccess?.()
          } else {
            toast.error(result.error ?? "Erreur")
          }
        })
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [
    formData,
    selectedTagIds,
    task,
    unitId,
    companyId,
    setIsOpen,
    onSuccess,
    startTransition,
    buildActionPayload,
  ])

  const isEdit = !!task?.id
  const titleCharCount = formData.title.length

  const selectedAssignee = teamMembers.find(
    (m) => m.id === formData.assignedUserId
  )

  // Helper: handle project selection with smart defaults
  const handleProjectSelect = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId)
    const phases = project?.phases ?? []
    setFormData({
      ...formData,
      projectId,
      phaseId: phases.length === 1 ? phases[0].id : "",
      subPhaseId: "",
    })
    setProjectComboboxOpen(false)
  }

  // Helper: handle phase selection with smart defaults
  const handlePhaseSelect = (phaseId: string) => {
    const phase = projectPhases.find((ph) => ph.id === phaseId)
    const subPhases = phase?.SubPhases ?? []
    setFormData({
      ...formData,
      phaseId,
      subPhaseId: subPhases.length === 1 ? subPhases[0].id : "",
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {externalOpen === undefined && (
        <DialogTrigger asChild>
          <Button>{isEdit ? "Modifier" : "Nouvelle tâche"}</Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEdit ? "Modifier la tâche" : "Nouvelle tâche"}
            </DialogTitle>
            <DialogDescription>
              {isEdit
                ? "Modifiez les détails de la tâche"
                : "Créez une nouvelle tâche pour ce projet"}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            {/* Title — required */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="title">
                Titre de la tâche <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Titre de la tâche"
                required
                maxLength={120}
              />
              <span className="text-xs text-muted-foreground">
                {titleCharCount}/120
              </span>
            </div>

            {/* Description — optional */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="description">
                Description{" "}
                <span className="text-xs text-muted-foreground">
                  (optionnel)
                </span>
              </Label>
              <Textarea
                id="description"
                value={formData.description ?? ""}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Description de la tâche"
                rows={3}
              />
            </div>

            {/* Section: Localisation du projet */}
            <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
              Localisation du projet
            </p>

            {/* Project — combobox with card-like chip */}
            <div className="flex flex-col gap-1.5">
              <Label>
                Projet <span className="text-destructive">*</span>
              </Label>
              <Popover
                open={projectComboboxOpen}
                onOpenChange={setProjectComboboxOpen}
              >
                <PopoverTrigger asChild>
                  {formData.projectId ? (
                    <button
                      type="button"
                      className="flex w-full items-start gap-2 rounded-md border border-input bg-muted/40 px-3 py-2 text-left text-xs"
                    >
                      <FolderKanban className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                      <span className="flex-1 leading-snug wrap-break-word whitespace-normal">
                        {selectedProject?.name}
                      </span>
                      <X
                        className="size-3.5 shrink-0 text-muted-foreground hover:text-foreground"
                        onClick={(e) => {
                          e.stopPropagation()
                          setFormData({
                            ...formData,
                            projectId: "",
                            phaseId: "",
                            subPhaseId: "",
                          })
                        }}
                      />
                    </button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-expanded={projectComboboxOpen}
                      className="w-full justify-between font-normal"
                    >
                      <span className="truncate">Sélectionner un projet</span>
                    </Button>
                  )}
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Rechercher un projet..." />
                    <CommandList>
                      <CommandEmpty>Aucun projet trouvé</CommandEmpty>
                      <CommandGroup>
                        {projects.map((p) => (
                          <CommandItem
                            key={p.id}
                            value={p.name}
                            onSelect={() => handleProjectSelect(p.id)}
                          >
                            <span className="wrap-break-word whitespace-normal">
                              {p.name}
                            </span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Phase + Sub-phase row */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {/* Phase — required if project selected */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="phaseId" className="flex items-center gap-1">
                  <Layers className="size-3.5 text-muted-foreground" />
                  Phase{" "}
                  {formData.projectId && (
                    <span className="text-destructive">*</span>
                  )}
                </Label>
                <Select
                  value={formData.phaseId}
                  onValueChange={handlePhaseSelect}
                  disabled={!formData.projectId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une phase" />
                  </SelectTrigger>
                  <SelectContent>
                    {projectPhases.map((ph) => (
                      <SelectItem key={ph.id} value={ph.id}>
                        {ph.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sub-phase — optional */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="subPhaseId" className="flex items-center gap-1">
                  <ListTree className="size-3.5 text-muted-foreground" />
                  Sous-phase{" "}
                  <span className="text-xs text-muted-foreground">
                    (optionnel)
                  </span>
                </Label>
                <Select
                  value={formData.subPhaseId ?? ""}
                  onValueChange={(v) =>
                    setFormData({ ...formData, subPhaseId: v })
                  }
                  disabled={!formData.phaseId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une sous-phase" />
                  </SelectTrigger>
                  <SelectContent>
                    {phaseSubPhases.map((sp) => (
                      <SelectItem key={sp.id} value={sp.id}>
                        {sp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Section: Planification */}
            <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
              Planification
            </p>

            {/* Start date + Due date row */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {/* Start date */}
              <div className="flex flex-col gap-1.5">
                <Label>
                  📅 Début{" "}
                  <span className="text-xs text-muted-foreground">
                    (optionnel)
                  </span>
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        "w-full justify-start font-normal",
                        !formData.startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 size-3.5" />
                      {formData.startDate
                        ? format(formData.startDate, "d MMMM yyyy", {
                            locale: fr,
                          })
                        : "Optionnel"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.startDate ?? undefined}
                      onSelect={(date) =>
                        setFormData({ ...formData, startDate: date ?? null })
                      }
                      locale={fr}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Due date */}
              <div className="flex flex-col gap-1.5">
                <Label>
                  📅 Échéance{" "}
                  <span className="text-xs text-muted-foreground">
                    (optionnel)
                  </span>
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        "w-full justify-start font-normal",
                        !formData.dueDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 size-3.5" />
                      {formData.dueDate
                        ? format(formData.dueDate, "d MMMM yyyy", {
                            locale: fr,
                          })
                        : "Optionnel"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.dueDate ?? undefined}
                      onSelect={(date) =>
                        setFormData({ ...formData, dueDate: date ?? null })
                      }
                      locale={fr}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* End date — edit mode only */}
            {isEdit && (
              <div className="flex flex-col gap-1.5">
                <Label>
                  📅 Fin réelle{" "}
                  <span className="text-xs text-muted-foreground">
                    (optionnel)
                  </span>
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        "w-full justify-start font-normal sm:w-auto",
                        !formData.endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 size-3.5" />
                      {formData.endDate
                        ? format(formData.endDate, "d MMMM yyyy", {
                            locale: fr,
                          })
                        : "Optionnel"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.endDate ?? undefined}
                      onSelect={(date) =>
                        setFormData({ ...formData, endDate: date ?? null })
                      }
                      locale={fr}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {/* Section: Attribution */}
            <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
              Attribution
            </p>

            {/* Attribution row: Column + Assignee + Tags */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {/* Column — hidden if initialLaneId provided */}
              {initialLaneId ? (
                <div className="flex flex-col gap-1.5">
                  <Label className="flex items-center gap-1">
                    <MapPin className="size-3.5 text-muted-foreground" />
                    Colonne
                  </Label>
                  <div className="flex items-center gap-1.5 rounded-md bg-muted/40 px-2.5 py-1.5 text-xs text-muted-foreground">
                    <MapPin className="size-3" />
                    <span>
                      {lanes.find((l) => l.id === initialLaneId)?.name}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="laneId" className="flex items-center gap-1">
                    <MapPin className="size-3.5 text-muted-foreground" />
                    Colonne{" "}
                    <span className="text-xs text-muted-foreground">
                      (optionnel)
                    </span>
                  </Label>
                  <Select
                    value={formData.laneId ?? ""}
                    onValueChange={(v) =>
                      setFormData({ ...formData, laneId: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une colonne" />
                    </SelectTrigger>
                    <SelectContent>
                      {lanes.map((lane) => (
                        <SelectItem key={lane.id} value={lane.id}>
                          {lane.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Assignee — combobox with avatars */}
              <div className="flex flex-col gap-1.5">
                <Label className="flex items-center gap-1">
                  <User className="size-3.5 text-muted-foreground" />
                  Assigné à{" "}
                  <span className="text-xs text-muted-foreground">
                    (optionnel)
                  </span>
                </Label>
                <Popover
                  open={assigneeComboboxOpen}
                  onOpenChange={setAssigneeComboboxOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-expanded={assigneeComboboxOpen}
                      className="w-full justify-start font-normal"
                    >
                      {selectedAssignee ? (
                        <>
                          <Avatar className="size-5">
                            <AvatarFallback className="text-[10px]">
                              {selectedAssignee.name[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="truncate">
                            {selectedAssignee.name}
                          </span>
                        </>
                      ) : (
                        <>
                          <Avatar className="size-5">
                            <AvatarFallback className="text-[10px]">
                              ?
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-muted-foreground">
                            Sélectionner un membre
                          </span>
                        </>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[250px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Rechercher un membre..." />
                      <CommandList>
                        <CommandEmpty>Aucun membre trouvé</CommandEmpty>
                        <CommandGroup>
                          {teamMembers.map((m) => (
                            <CommandItem
                              key={m.id}
                              value={m.name}
                              onSelect={() => {
                                setFormData({
                                  ...formData,
                                  assignedUserId: m.id,
                                })
                                setAssigneeComboboxOpen(false)
                              }}
                            >
                              <Avatar className="size-5">
                                <AvatarFallback className="text-[10px]">
                                  {m.name[0]?.toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="ml-2 truncate">{m.name}</span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Tags — multi-select */}
              <div className="flex flex-col gap-1.5">
                <Label>
                  Tags{" "}
                  <span className="text-xs text-muted-foreground">
                    (optionnel)
                  </span>
                </Label>
                {selectedTagIds.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedTagIds.map((tagId) => {
                      const tag = availableTags?.find((t) => t.id === tagId)
                      if (!tag) return null
                      return (
                        <Badge
                          key={tagId}
                          variant="secondary"
                          className="gap-1 pr-1"
                          style={{
                            backgroundColor: `${tag.color}20`,
                            color: tag.color,
                          }}
                        >
                          <span
                            className="size-2 rounded-full"
                            style={{ backgroundColor: tag.color }}
                          />
                          {tag.name}
                          <button
                            type="button"
                            className="ml-0.5 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedTagIds((prev) =>
                                prev.filter((id) => id !== tagId)
                              )
                            }}
                            aria-label={`Retirer le tag ${tag.name}`}
                          >
                            <X className="size-3" />
                          </button>
                        </Badge>
                      )
                    })}
                  </div>
                )}
                <Popover
                  open={tagsComboboxOpen}
                  onOpenChange={setTagsComboboxOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-expanded={tagsComboboxOpen}
                      className="w-full justify-between font-normal"
                    >
                      <span className="truncate">
                        {selectedTagIds.length === 0
                          ? "+ Ajouter un tag"
                          : `${selectedTagIds.length} tag(s) sélectionné(s)`}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[280px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Rechercher un tag..." />
                      <CommandList>
                        <CommandEmpty>Aucun tag trouvé</CommandEmpty>
                        <CommandGroup>
                          {localTags.map((tag) => (
                            <CommandItem
                              key={tag.id}
                              value={tag.name}
                              onSelect={() => {
                                setSelectedTagIds((prev) =>
                                  prev.includes(tag.id)
                                    ? prev.filter((id) => id !== tag.id)
                                    : [...prev, tag.id]
                                )
                              }}
                            >
                              <span
                                className="mr-2 size-2.5 shrink-0 rounded-full"
                                style={{ backgroundColor: tag.color }}
                              />
                              <span className="truncate">{tag.name}</span>
                              <Check
                                className={cn(
                                  "ml-auto size-3.5",
                                  selectedTagIds.includes(tag.id)
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>

                    <div className="border-t p-3">
                      <p className="mb-2 text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                        Nouveau tag
                      </p>
                      <div className="flex flex-col gap-2">
                        <Input
                          placeholder="Nom du tag"
                          value={newTagName}
                          onChange={(e) => setNewTagName(e.target.value)}
                          className="h-8 text-xs"
                        />
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex gap-1">
                            {tagColors.map((color) => (
                              <button
                                key={color}
                                type="button"
                                className={cn(
                                  "size-4 rounded-full border-2 transition-all hover:scale-110",
                                  newTagColor === color
                                    ? "border-foreground"
                                    : "border-transparent"
                                )}
                                style={{ backgroundColor: color }}
                                onClick={() => setNewTagColor(color)}
                              />
                            ))}
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            className="h-7 px-2 text-[10px]"
                            disabled={!newTagName.trim() || isCreatingTag}
                            onClick={handleCreateTag}
                          >
                            {isCreatingTag ? "..." : "Créer"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Spinner data-icon="inline-start" /> : null}
              {isEdit ? "Enregistrer" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
