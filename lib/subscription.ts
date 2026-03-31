import type { SubscriptionStatus } from "@/lib/constants"

const GRACE_PERIOD_DAYS = 7
const READONLY_GRACE_DAYS = 7

/**
 * Computes the subscription status based on endAt date and current date.
 * Used for TRIAL subscriptions that auto-expire.
 */
export function computeTrialStatus(endAt: Date): SubscriptionStatus {
  const now = new Date()
  const graceEnd = new Date(
    endAt.getTime() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000
  )

  if (endAt > now) {
    return "TRIAL"
  }

  if (now >= endAt && graceEnd > now) {
    return "GRACE"
  }

  return "READONLY"
}

/**
 * Determines the expected status for a subscription based on its current status and endAt.
 * This is used to sync the database Subscription.status field with actual state.
 */
export function computeExpectedStatus(
  currentStatus: SubscriptionStatus,
  endAt: Date
): SubscriptionStatus {
  // If manually set to ACTIVE or SUSPENDED, respect that
  if (currentStatus === "ACTIVE" || currentStatus === "SUSPENDED") {
    return currentStatus
  }

  // For TRIAL status, compute based on dates
  if (currentStatus === "TRIAL") {
    return computeTrialStatus(endAt)
  }

  // For GRACE or READONLY, check if further degradation is needed
  const now = new Date()
  const graceEnd = new Date(
    endAt.getTime() + READONLY_GRACE_DAYS * 24 * 60 * 60 * 1000
  )

  if (currentStatus === "GRACE" && now >= graceEnd) {
    return "READONLY"
  }

  return currentStatus
}

export function isMutationAllowed(status: SubscriptionStatus): boolean {
  return status === "TRIAL" || status === "ACTIVE" || status === "GRACE"
}

export function getTrialDaysRemaining(endAt: Date): number {
  const now = new Date()
  const diffMs = endAt.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (24 * 60 * 60 * 1000))
  return Math.max(0, diffDays)
}

export function getGraceDaysRemaining(endAt: Date): number {
  const now = new Date()
  const graceEnd = new Date(
    endAt.getTime() + READONLY_GRACE_DAYS * 24 * 60 * 60 * 1000
  )
  const diffMs = graceEnd.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (24 * 60 * 60 * 1000))
  return Math.max(0, diffDays)
}

export function getSubscriptionDisplayStatus(endAt: Date): {
  status: SubscriptionStatus
  daysRemaining: number
} {
  const status = computeTrialStatus(endAt)

  if (status === "TRIAL") {
    return { status, daysRemaining: getTrialDaysRemaining(endAt) }
  }

  if (status === "GRACE") {
    return { status, daysRemaining: getGraceDaysRemaining(endAt) }
  }

  return { status: "READONLY", daysRemaining: 0 }
}
