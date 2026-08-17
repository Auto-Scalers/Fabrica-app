# 01. Wire tokens — `orca_server_ready`, `orca:serve-ready`

## What it is
These are **passwords-like tokens the desktop app and its remote/headless server exchange to confirm "I'm ready."**
When you start a headless Fabrica server and a laptop connects to it, the laptop waits for a message that says `orca_server_ready` or `orca:serve-ready` before it believes the server is up. The token is **never shown to a user** — it's pure machine-to-machine signaling.

## Where it lives
- `src/shared/serve-update-handoff.ts:32` and `src/main/serve-update-handoff.ts:61` (`orca:serve-ready`)
- `src/main/server/serve-readiness.ts:73` (`orca_server_ready`)
- plus their test fixtures

## Visible to users?
No. Never on screen, never in a file a user reads.

## The 0-users impact
No impact either way — this was never about user data.

## Options

### Option A — Keep as `orca`
Benefit: zero effort, zero risk.
Tradeoff: the word "orca" lingers invisibly inside the product forever.

### Option B — Rename to `fabrica_server_ready` / `fabrica:serve-ready` (✅ DECIDED)
Benefit: 100% consistent naming across the codebase.
Tradeoff: breaks pairing between a new laptop and an old server if versions ever mix — **moot at 0 users**, and both sides always ship together from the same repo. Applied 2026-08-13.

### Option C — Send both tokens (accept old + new)
Benefit: smooth transition if versions ever mix.
Tradeoff: extra code for a case that doesn't exist yet (0 users).

## Recommendation
**Option B — rename done.** Client and server both changed in the same release (always true at 0 users), so no version skew is possible. Verified: zero remaining `orca_server_ready` / `orca:serve-ready` occurrences.
