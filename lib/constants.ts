export const PLAN_LIMITS = {
  STARTER: {
    maxUnits: 1,
    maxProjects: 5,
    maxTasksPerProject: 20,
    maxMembers: 10,
  },
  PRO: {
    maxUnits: 5,
    maxProjects: 30,
    maxTasksPerProject: 200,
    maxMembers: 50,
  },
  PREMIUM: {
    maxUnits: null,
    maxProjects: null,
    maxTasksPerProject: null,
    maxMembers: null,
  },
} as const

export const NOTIFICATION_TYPES = {
  INVITATION: "INVITATION",
  PROJECT: "PROJECT",
  TASK: "TASK",
  CLIENT: "CLIENT",
  PHASE: "PHASE",
  TEAM: "TEAM",
  LANE: "LANE",
  TAG: "TAG",
  PRODUCTION: "PRODUCTION",
  GENERAL: "GENERAL",
} as const

export const STATUS_COLORS = {
  New: "bg-blue-100 text-blue-800",
  InProgress: "bg-yellow-100 text-yellow-800",
  Pause: "bg-orange-100 text-orange-800",
  Complete: "bg-green-100 text-green-800",
} as const

export const WILAYAS = [
  { code: "01", name: "Adrar" },
  { code: "02", name: "Chlef" },
  { code: "03", name: "Laghouat" },
  { code: "04", name: "Oum El Bouaghi" },
  { code: "05", name: "Batna" },
  { code: "06", name: "Béjaïa" },
  { code: "07", name: "Biskra" },
  { code: "08", name: "Béchar" },
  { code: "09", name: "Blida" },
  { code: "10", name: "Bouira" },
  { code: "11", name: "Tamanrasset" },
  { code: "12", name: "Tébessa" },
  { code: "13", name: "Tlemcen" },
  { code: "14", name: "Tiaret" },
  { code: "15", name: "Tizi Ouzou" },
  { code: "16", name: "Alger" },
  { code: "17", name: "Djelfa" },
  { code: "18", name: "Jijel" },
  { code: "19", name: "Sétif" },
  { code: "20", name: "Saïda" },
  { code: "21", name: "Skikda" },
  { code: "22", name: "Sidi Bel Abbès" },
  { code: "23", name: "Annaba" },
  { code: "24", name: "Guelma" },
  { code: "25", name: "Constantine" },
  { code: "26", name: "Médéa" },
  { code: "27", name: "Mostaganem" },
  { code: "28", name: "Msila" },
  { code: "29", name: "Mascara" },
  { code: "30", name: "Ouargla" },
  { code: "31", name: "Oran" },
  { code: "32", name: "El Bayadh" },
  { code: "33", name: "Illizi" },
  { code: "34", name: "Bordj Bou Arreridj" },
  { code: "35", name: "Boumerdès" },
  { code: "36", name: "El Tarf" },
  { code: "37", name: "Tindouf" },
  { code: "38", name: "Tissemsilt" },
  { code: "39", name: "El Oued" },
  { code: "40", name: "Khenchela" },
  { code: "41", name: "Souk Ahras" },
  { code: "42", name: "Tipaza" },
  { code: "43", name: "Mila" },
  { code: "44", name: "Aïn Defla" },
  { code: "45", name: "Naâma" },
  { code: "46", name: "Aïn Témouchent" },
  { code: "47", name: "Ghardaïa" },
  { code: "48", name: "Relizane" },
] as const

export type Wilaya = (typeof WILAYAS)[number]

export const SUBSCRIPTION_STATUS_LABELS = {
  TRIAL: "Essai gratuit",
  ACTIVE: "Actif",
  GRACE: "Grâce (accès limité)",
  READONLY: "Lecture seule",
  SUSPENDED: "Suspendu",
} as const

export const SUBSCRIPTION_STATUSES = {
  TRIAL: "TRIAL",
  ACTIVE: "ACTIVE",
  GRACE: "GRACE",
  READONLY: "READONLY",
  SUSPENDED: "SUSPENDED",
} as const

export type SubscriptionStatus =
  (typeof SUBSCRIPTION_STATUSES)[keyof typeof SUBSCRIPTION_STATUSES]

export const TASK_DEPENDENCY_TYPES = {
  FINISH_TO_START: "finishToStart",
  START_TO_START: "startToStart",
  FINISH_TO_FINISH: "finishToFinish",
  START_TO_FINISH: "startToFinish",
} as const

export type TaskDependencyType =
  (typeof TASK_DEPENDENCY_TYPES)[keyof typeof TASK_DEPENDENCY_TYPES]

export const ROLES = {
  OWNER: "OWNER",
  ADMIN: "ADMIN",
  USER: "USER",
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

export const PROJECT_STATUSES = {
  NEW: "New",
  IN_PROGRESS: "InProgress",
  PAUSE: "Pause",
  COMPLETE: "Complete",
} as const

export type ProjectStatus =
  (typeof PROJECT_STATUSES)[keyof typeof PROJECT_STATUSES]

export const INVITATION_STATUSES = {
  PENDING: "PENDING",
  ACCEPTED: "ACCEPTED",
  REJECTED: "REJECTED",
} as const

export type InvitationStatus =
  (typeof INVITATION_STATUSES)[keyof typeof INVITATION_STATUSES]
