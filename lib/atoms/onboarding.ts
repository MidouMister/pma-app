import { atom } from "jotai"
import type { CompanyFormData, UnitFormData } from "@/lib/validators"

export const currentStepAtom = atom(0)

export const companyDataAtom = atom<Partial<CompanyFormData>>({})

export const unitDataAtom = atom<Partial<UnitFormData>>({})

export type TeamInviteEntry = {
  email: string
  role: "ADMIN" | "USER"
}

export const teamInvitesAtom = atom<TeamInviteEntry[]>([])

export const isSubmittingAtom = atom(false)
