# Security model

This is a synthetic working demonstration. Do not enter real personal, medical, financial, or government-identification data.

## Boundaries

- No backend, database, analytics, external provider call, or real submission exists.
- The household profile and state are in browser memory and disappear on reload.
- The chosen agent can read the approved planning constraints: household size, income, area, accessibility needs, languages, and blocked schedule slots.
- Government ID and health notes are withheld from the agent. Providers receive only fields with a declared purpose after human approval.
- Provider notices are untrusted content. A bounded demonstration heuristic quarantines known instruction-shaped patterns before tool output. It is not a complete prompt-injection defense.
- Tool outputs are intentionally bounded; no tool returns the complete profile object.
- The mutating commit tool is registered only after visible human approval; before approval, it is absent from the browser's tool surface.
- Approval is bound to one proposal fingerprint, expires after five minutes, and cannot be replayed.

The fingerprint is a deterministic change detector for the demo, not a cryptographic signature or security token. A production system would require authenticated providers, cryptographic consent receipts, durable revocation, authorization, encrypted storage, abuse controls, and independent security/privacy review.

Report security issues privately to the repository owner rather than opening a public exploit report.
