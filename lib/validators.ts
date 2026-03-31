import { z } from "zod"

export const companySchema = z.object({
  name: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(255),
  companyEmail: z.string().email("Email invalide"),
  companyAddress: z
    .string()
    .min(5, "L'adresse doit contenir au moins 5 caractères")
    .max(500),
  companyPhone: z
    .string()
    .min(8, "Le numéro de téléphone est invalide")
    .max(20),
  state: z.string().min(1, "La wilaya est requise"),
  formJur: z.string().min(1, "La forme juridique est requise"),
  registre: z.string().min(1, "Le numéro de registre est requis"),
  nif: z.string().min(1, "Le NIF est requis"),
  secteur: z.string().min(1, "Le secteur est requis"),
  logo: z.string().url("URL invalide").optional().or(z.literal("")),
})

export const unitSchema = z.object({
  name: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(255),
  address: z
    .string()
    .min(5, "L'adresse doit contenir au moins 5 caractères")
    .max(500),
  phone: z.string().min(8, "Le numéro de téléphone est invalide").max(20),
  email: z.string().email("Email invalide"),
})

export const projectSchema = z.object({
  name: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(255),
  code: z.string().min(1, "Le code est requis").max(50),
  type: z.string().min(1, "Le type est requis").max(100),
  montantHT: z.number().positive("Le montant HT doit être positif"),
  montantTTC: z.number().positive("Le montant TTC doit être positif"),
  ods: z.date().optional().nullable(),
  delaiMonths: z.number().int().min(0).default(0),
  delaiDays: z.number().int().min(0).default(0),
  status: z.enum(["New", "InProgress", "Pause", "Complete"]),
  signe: z.boolean().default(false),
  clientId: z.string().uuid("Client invalide"),
  unitId: z.string().uuid("Unité invalide"),
  companyId: z.string().uuid("Entreprise invalide"),
})

export const phaseSchema = z.object({
  name: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(255),
  code: z.string().min(1, "Le code est requis").max(50),
  montantHT: z.number().min(0, "Le montant ne peut pas être négatif"),
  startDate: z.date().optional().nullable(),
  endDate: z.date().optional().nullable(),
  status: z.enum(["New", "InProgress", "Pause", "Complete"]),
  obs: z.string().max(1000).optional().nullable(),
  progress: z.number().min(0).max(100).default(0),
  projectId: z.string().uuid("Projet invalide"),
})

export const subPhaseSchema = z.object({
  name: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(255),
  code: z.string().min(1, "Le code est requis").max(50),
  status: z.enum(["TODO", "COMPLETED"]),
  progress: z.number().min(0).max(100).default(0),
  startDate: z.date().optional().nullable(),
  endDate: z.date().optional().nullable(),
  phaseId: z.string().uuid("Phase invalide"),
})

export const taskSchema = z.object({
  title: z.string().min(1, "Le titre est requis").max(255),
  description: z.string().max(2000).optional().nullable(),
  startDate: z.date().optional().nullable(),
  dueDate: z.date().optional().nullable(),
  endDate: z.date().optional().nullable(),
  complete: z.boolean().default(false),
  assignedUserId: z.string().uuid().optional().nullable(),
  laneId: z.string().uuid().optional().nullable(),
  unitId: z.string().uuid("Unité invalide"),
  companyId: z.string().uuid("Entreprise invalide"),
  projectId: z.string().uuid("Projet invalide"),
  phaseId: z.string().uuid("Phase invalide"),
  subPhaseId: z.string().uuid().optional().nullable(),
})

export const clientSchema = z.object({
  name: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(255),
  wilaya: z.string().max(100).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  email: z.string().email("Email invalide").optional().nullable(),
  unitId: z.string().uuid("Unité invalide"),
  companyId: z.string().uuid("Entreprise invalide"),
})

export const invitationSchema = z.object({
  email: z.string().email("Email invalide"),
  unitId: z.string().uuid("Unité invalide"),
  role: z.enum(["OWNER", "ADMIN", "USER"]).default("USER"),
  jobeTilte: z.string().max(100).optional().nullable(),
})

export const timeEntrySchema = z.object({
  description: z.string().max(500).optional().nullable(),
  startTime: z.date(),
  endTime: z.date().optional().nullable(),
  duration: z.number().int().min(0).optional(),
  userId: z.string().uuid("Utilisateur invalide"),
  taskId: z.string().uuid().optional().nullable(),
  projectId: z.string().uuid().optional().nullable(),
})

export const teamMemberSchema = z.object({
  role: z.string().min(1, "Le rôle est requis").max(100),
  teamId: z.string().uuid("Équipe invalide"),
  userId: z.string().uuid("Utilisateur invalide"),
})

export const laneSchema = z.object({
  name: z.string().min(1, "Le nom est requis").max(255),
  unitId: z.string().uuid("Unité invalide"),
  order: z.number().int().min(0).default(0),
  color: z.string().max(20).optional().nullable(),
})

export const tagSchema = z.object({
  name: z.string().min(1, "Le nom est requis").max(100),
  color: z.string().min(4, "Couleur invalide").max(20),
  unitId: z.string().uuid("Unité invalide"),
})

export type CompanyFormData = z.infer<typeof companySchema>
export type UnitFormData = z.infer<typeof unitSchema>
export type ProjectFormData = z.infer<typeof projectSchema>
export type PhaseFormData = z.infer<typeof phaseSchema>
export type SubPhaseFormData = z.infer<typeof subPhaseSchema>
export type TaskFormData = z.infer<typeof taskSchema>
export type ClientFormData = z.infer<typeof clientSchema>
export type InvitationFormData = z.infer<typeof invitationSchema>
export type TimeEntryFormData = z.infer<typeof timeEntrySchema>
export type TeamMemberFormData = z.infer<typeof teamMemberSchema>
export type LaneFormData = z.infer<typeof laneSchema>
export type TagFormData = z.infer<typeof tagSchema>
