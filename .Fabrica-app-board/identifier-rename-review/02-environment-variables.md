# 02. Environment variables — `ORCA_*`

> **STATUS: ✅ DECIDED (2026-08-13) — planning locked; implementation not started.** Full rename to `FABRICA_*`, shipped in the coordinated Group B release with items 06, 10, 11.

## What it is
Environment variables are **settings the operating system hands to a program when it starts**. They're set by our own scripts, CI, shell hooks, and the release pipeline — a user never types them and never sees them.

## The real scale (counted in code)
~**400+ distinct `ORCA_*` variables**, ~**2,700 total occurrences**. Examples by family:
- Build/CI/release: `ORCA_BUILD_COMMIT`, `ORCA_BUILD_IDENTITY`, `ORCA_MAC_RELEASE`, `ORCA_WINDOWS_EXPECTED_THUMBPRINTS` (Windows signing-cert trust — a security gate)
- Credentials: `ORCA_CLOUD_AUTH_TOKEN`, `ORCA_BITBUCKET_ACCESS_TOKEN`, `ORCA_AZURE_DEVOPS_PAT`, `ORCA_SSH_PUBLIC_KEY`
- Agent wiring: `ORCA_TERMINAL_HANDLE`, `ORCA_PANE_KEY`, `ORCA_AGENT_LAUNCH_TOKEN`, `ORCA_AGENT_HOOK_*`
- Pairing/relay: `ORCA_PAIRING_CODE`, `ORCA_RELAY_URL`, `ORCA_SERVE_PORT`
- Telemetry gates: `ORCA_POSTHOG_WRITE_KEY`, `ORCA_TELEMETRY_DISABLED`
- Test/bench harnesses: ~150 (e.g. `ORCA_TYPING_BENCH_*`, `ORCA_FREEZE_*`)

## Visible to users?
No. Only developers, CI, and the app's own processes see these.

## The 0-users impact
Users were never involved. The difficulty is **internal coupling** (app ↔ agent tools ↔ CI ↔ backend), not user migration.

---

## ✅ DECIDED: Full rename to `FABRICA_*` — no loss of functionality

**The one rule that makes a full rename safe — the "both-sides must change together" rule:**

Some `ORCA_*` variables work like a shared password between two systems (e.g. the app sets `ORCA_AGENT_LAUNCH_TOKEN` and the codex/claude tool reads it). Rename only *one* side and the two no longer recognize each other (an agent silently won't start). So:

> **Every variable is renamed in both places — the writer AND every reader — in the same release.**

There is no third party involved: we own the app code, the CI scripts, the release pipeline, the agent config, and the backend. So the rule is fully mechanical. The test suite (which reads and writes these vars) verifies the whole map for us.

### A small nuance to keep straight
- Most vars are **internal to one code path** (set and read in our repo) → plain find-and-replace, near-zero risk.
- A subset (below) crosses an **external surface** — those must keep the old name in production data/scripts **until** the paired side ships the new name in the same release:
  - Agent tools we launch: codex / claude / GH CLI (read `ORCA_AGENT_LAUNCH_TOKEN`, `ORCA_TERMINAL_HANDLE`, `ORCA_PANE_KEY`, `ORCA_WINDOWS_EXPECTED_THUMBPRINTS`)
  - Remote/relay hooks that inject `ORCA_AGENT_HOOK_*` over the wire
  - CI secrets + PostHog backend for `ORCA_POSTHOG_WRITE_KEY`, `ORCA_CLOUD_*`
  - Shell wrappers on user machines (created from our own templates, so renamed in the same release)

### Sequencing (per the plan)
Do the env-var rename **together with item 11 (CLI command) and the CI/telemetry rebrand** — they touch the same external surfaces, so a single coordinated release keeps every writer/reader in sync. Same mechanical rule, same test gate.

## The one genuinely user-visible var
`ORCA_PRODUCT_URL` (defaults to `github.com/stablyai/orca`) and the `ORCA_GIT_COMMIT_TRAILER` default ("Co-authored-by: Orca") — these carry visible brand/URL, so they should be renamed in the same release as item 06 (git trailer). Everything else is invisible.

## Options

### Option A — Full rename now to `FABRICA_*` (✅ DECIDED)
Benefit: 100% consistent naming; grep for `ORCA_` returns zero.
Tradeoff: large mechanical change across ~many files — safe because we own every surface and the both-sides rule is enforced by the test suite.

### Option B — Keep as `ORCA_*`
Rejected: user chose full renaming.

### Option C — Rename only the "user-visible" ones, keep plumbing
Rejected: two naming schemes coexisting is *more* confusing than all-or-nothing.

## Recommendation
**Option A — full rename to `FABRICA_*`, shipped in the same release as items 06, 11, and the CI/telemetry rebrand.** No user-visible functionality changes; verified by the full test suite which exercises most of these variables.

**Blockers? None.** This is effort and coordination, not a wall.