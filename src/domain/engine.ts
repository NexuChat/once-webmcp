import type {
  Approval,
  AssistancePlan,
  CommitReceipt,
  DisclosureDecision,
  EligibilityDecision,
  HouseholdProfile,
  ProfileField,
  Proposal,
  ServiceProgram,
} from './types'

const readField = (profile: HouseholdProfile, field: ProfileField): unknown => profile[field]

export function checkEligibility(
  profile: HouseholdProfile,
  program: ServiceProgram,
): EligibilityDecision {
  const missingFields = program.requiredFields.filter((field) => {
    const value = readField(profile, field)
    return value === undefined || value === null || value === ''
  })

  if (missingFields.length > 0) {
    return {
      programId: program.id,
      status: 'needs-information',
      eligible: false,
      reasons: ['More information is required before a decision can be made'],
      evidence: [],
      missingFields,
    }
  }

  if (
    program.requiredFields.includes('monthlyIncome') &&
    (profile.monthlyIncome ?? Number.POSITIVE_INFINITY) > program.incomeLimit
  ) {
    return {
      programId: program.id,
      status: 'ineligible',
      eligible: false,
      reasons: ['Income is above the published program limit'],
      evidence: ['monthlyIncome'],
      missingFields: [],
    }
  }

  const reasons = program.requiredFields.includes('monthlyIncome')
    ? ['Income is within the program limit', 'All required information is available']
    : ['All required information is available']

  return {
    programId: program.id,
    status: 'eligible',
    eligible: true,
    reasons,
    evidence: [...program.requiredFields],
    missingFields: [],
  }
}

export function minimizeDisclosure(
  profile: HouseholdProfile,
  program: ServiceProgram,
): DisclosureDecision {
  const approvedFields: ProfileField[] = []
  const blockedFields: DisclosureDecision['blockedFields'] = []
  const sharedData: DisclosureDecision['sharedData'] = {}

  for (const field of program.requestedFields) {
    if (!program.fieldPurposes[field]) {
      blockedFields.push({ field, reason: 'No declared purpose for this field' })
      continue
    }

    if (!program.requiredFields.includes(field)) {
      blockedFields.push({ field, reason: 'Field is not required by this service' })
      continue
    }

    approvedFields.push(field)
    sharedData[field] = readField(profile, field)
  }

  return { approvedFields, blockedFields, sharedData }
}

export function scanProviderContent(content: string): { safe: boolean; reason?: string } {
  const unsafePatterns = [
    /ignore\s+(all\s+)?previous\s+instructions?/i,
    /system\s+prompt/i,
    /reveal\s+.*(profile|secret|private|credential)/i,
    /send\s+all\s+.*(data|information)/i,
  ]

  if (unsafePatterns.some((pattern) => pattern.test(content))) {
    return { safe: false, reason: 'Instruction-like provider content was quarantined' }
  }

  return { safe: true }
}

export function buildAssistancePlan(
  profile: HouseholdProfile,
  servicePrograms: ServiceProgram[],
): AssistancePlan {
  const usedSlots = new Set<string>()
  const assignments: AssistancePlan['assignments'] = []
  let avoidedConflicts = 0

  for (const program of servicePrograms) {
    if (!checkEligibility(profile, program).eligible) continue

    const slot = program.slots.find((candidate) => {
      const blocked = profile.blockedSlots.includes(candidate.id) || usedSlots.has(candidate.id)
      if (blocked) avoidedConflicts += 1
      return !blocked
    })

    if (!slot) continue
    usedSlots.add(slot.id)
    assignments.push({
      programId: program.id,
      provider: program.provider,
      category: program.category,
      title: program.title,
      slot: slot.id,
      slotLabel: slot.label,
    })
  }

  return { assignments, conflicts: [], avoidedConflicts }
}

function stableSerialize(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableSerialize).join(',')}]`
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
      a.localeCompare(b),
    )
    return `{${entries.map(([key, item]) => `${key}:${stableSerialize(item)}`).join(',')}}`
  }
  return JSON.stringify(value)
}

function fingerprint(value: unknown): string {
  const input = stableSerialize(value)
  let hash = 2_166_136_261
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index)
    hash = Math.imul(hash, 16_777_619)
  }
  return `fp_${(hash >>> 0).toString(16).padStart(8, '0')}`
}

export function createProposal(
  profile: HouseholdProfile,
  servicePrograms: ServiceProgram[],
  createdAt = Date.now(),
): Proposal {
  const plan = buildAssistancePlan(profile, servicePrograms)
  const applications = plan.assignments.map((assignment) => {
    const program = servicePrograms.find((item) => item.id === assignment.programId)
    if (!program) throw new Error('PROGRAM_NOT_FOUND')
    return {
      ...assignment,
      disclosure: minimizeDisclosure(profile, program),
      status: 'staged' as const,
    }
  })
  const profileRevision = fingerprint(profile)
  const proposalBody = { profileRevision, applications, plan, createdAt }

  return { ...proposalBody, fingerprint: fingerprint(proposalBody) }
}

export function approveProposal(proposal: Proposal, now = Date.now()): Approval {
  return {
    proposalFingerprint: proposal.fingerprint,
    expiresAt: now + 5 * 60_000,
    used: false,
  }
}

export function commitApprovedProposal(
  proposal: Proposal,
  approval: Approval | null,
  now = Date.now(),
): { receipts: CommitReceipt[]; approval: Approval } {
  if (!approval) throw new Error('HUMAN_APPROVAL_REQUIRED')
  if (approval.used) throw new Error('APPROVAL_ALREADY_USED')
  if (approval.proposalFingerprint !== proposal.fingerprint) throw new Error('APPROVAL_MISMATCH')
  if (now > approval.expiresAt) throw new Error('APPROVAL_EXPIRED')

  const receipts = proposal.applications.map((application, index) => ({
    id: `receipt_${proposal.fingerprint.slice(3)}_${index + 1}`,
    programId: application.programId,
    provider: application.provider,
    committedAt: now,
    fieldsShared: application.disclosure.approvedFields,
  }))

  return { receipts, approval: { ...approval, used: true } }
}
