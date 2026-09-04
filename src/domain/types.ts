export type ProfileField =
  | 'adults'
  | 'children'
  | 'monthlyIncome'
  | 'postalArea'
  | 'mobilityNeeds'
  | 'languages'
  | 'availability'
  | 'governmentId'
  | 'healthNotes'

export type ServiceCategory = 'shelter' | 'food' | 'health' | 'transport'

export interface TimeSlot {
  id: string
  day: 'Monday' | 'Tuesday' | 'Wednesday'
  start: string
  end: string
  label: string
}

export interface HouseholdProfile {
  adults: number
  children: number
  monthlyIncome?: number
  postalArea: string
  mobilityNeeds: boolean
  languages: string[]
  availability: string[]
  blockedSlots: string[]
  governmentId: string
  healthNotes: string
}

export interface ServiceProgram {
  id: string
  provider: string
  category: ServiceCategory
  title: string
  summary: string
  incomeLimit: number
  requiredFields: ProfileField[]
  requestedFields: ProfileField[]
  fieldPurposes: Partial<Record<ProfileField, string>>
  slots: TimeSlot[]
  providerNotice: string
  accent: string
}

export interface EligibilityDecision {
  programId: string
  status: 'eligible' | 'ineligible' | 'needs-information'
  eligible: boolean
  reasons: string[]
  evidence: ProfileField[]
  missingFields: ProfileField[]
}

export interface DisclosureDecision {
  approvedFields: ProfileField[]
  blockedFields: Array<{ field: ProfileField; reason: string }>
  sharedData: Partial<Record<ProfileField, unknown>>
}

export interface PlanAssignment {
  programId: string
  provider: string
  category: ServiceCategory
  title: string
  slot: string
  slotLabel: string
}

export interface AssistancePlan {
  assignments: PlanAssignment[]
  conflicts: string[]
  avoidedConflicts: number
}

export interface StagedApplication extends PlanAssignment {
  disclosure: DisclosureDecision
  status: 'staged'
}

export interface Proposal {
  fingerprint: string
  profileRevision: string
  createdAt: number
  applications: StagedApplication[]
  plan: AssistancePlan
}

export interface Approval {
  proposalFingerprint: string
  expiresAt: number
  used: boolean
}

export interface CommitReceipt {
  id: string
  programId: string
  provider: string
  committedAt: number
  fieldsShared: ProfileField[]
}

export interface AuditEvent {
  id: string
  at: number
  actor: 'human' | 'agent' | 'system'
  action: string
  detail: string
  tone: 'neutral' | 'safe' | 'warning'
}

export type JourneyPhase = 'idle' | 'planned' | 'reviewing' | 'approved' | 'committed'

export interface AppState {
  phase: JourneyPhase
  profile: HouseholdProfile
  programs: ServiceProgram[]
  proposal: Proposal | null
  approval: Approval | null
  receipts: CommitReceipt[]
  audit: AuditEvent[]
}
