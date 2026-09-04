import { demoProfile, programs } from './seed'
import type { AppState, AuditEvent } from './types'

const initialAudit: AuditEvent[] = [
  {
    id: 'audit-ready',
    at: 1,
    actor: 'system',
    action: 'Capsule ready',
    detail: 'Synthetic household data is held locally in this browser.',
    tone: 'safe',
  },
]

export function createInitialState(overrides: Partial<AppState> = {}): AppState {
  return {
    phase: 'idle',
    profile: demoProfile,
    programs,
    proposal: null,
    approval: null,
    receipts: [],
    audit: initialAudit,
    ...overrides,
  }
}
