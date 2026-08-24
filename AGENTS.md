# Fabrica-app — Worker Instructions (AGENTS.md)

## What This Folder Is

This is the **Fabrica desktop app** — an Electron app forked from Orca. You are a worker dispatched by the top-level orchestrator to complete a task in this repo.

## Tech Stack

- Electron 36+ (Chromium 138)
- TypeScript, Vite, React 19
- Pinia (state), Vue (some components)
- oxlint + prettier
- pnpm workspaces

## Commands

Run these before claiming DONE (from `Fabrica-app/`):

```bash
pnpm lint          # lint (oxlint)
pnpm test          # vitest unit tests
pnpm build         # electron-vite production build
pnpm typecheck     # TypeScript check
```

## What You Should Know

- This is a rebrand from Orca to Fabrica
- App ID: `com.autoscalers.fabrica` (ACTUAL, shipping — `config/electron-builder.config.cjs:49`). PENDING-PM: canonical identity not yet confirmed; docs previously said `ai.autoscalers.fabrica`
- Deep link: `fabrica://`
- CLI command: `fabrica`
- GitHub org: `Auto-Scalers` (was `stablyai`)

## Conventions

- **Concise comments only** — no verbose explanations
- **No max-lines disables** — ever
- **No vague file names** — use concrete domain names
- **Prefer `.ts` over `.d.ts`** for type declarations
- **Platform checks** — never hardcode `e.metaKey`, use runtime checks
- **File structure** — mirror `src/main/` for main process, `src/renderer/` for renderer

## Definition of Done

A task is DONE only when ALL of these hold:

1. **Commands pass:** `pnpm lint`, `pnpm test`, `pnpm typecheck` (and `pnpm build` when build-affecting) — run them, paste real output as evidence.
2. **Rebrand grep is clean** (for branding tasks): no `orca`/`stablyai`/`onorca` hits outside allowed exceptions (`.backup/`, `_sources/`, GNOME Orca screen-reader refs, historical GitHub URLs, wire-protocol test fixtures noted in the task file).
3. **No functionality changed unintentionally** — rebrand edits are identity-only; behavior, tests, and imports still work.
4. **Tracking files updated in the same edit:** task status + Rollup recount in `.Fabrica-app-board/Fabrica-app-tasks.md`, Checkpoint table, and your Session Ledger row.

## What You Do NOT Do

- **Do NOT edit** `.backup/` or `_sources/` — frozen reference copies
- **Do NOT commit or push** — make changes only, orchestrator handles git
- **Do NOT touch** skills/, .github/workflows/ unless the task specifically says so

## Key Directories

```
src/main/           — Electron main process
src/renderer/       — React UI
src/shared/         — Shared types and contracts
src/relay/          — Relay server code
src/cli/            — CLI commands
mobile/             — Mobile companion app
skills/             — SKILL.md files (orchestration, computer-use, etc.)
docs/               — Documentation
config/             — Build config, lint rules
Casks/              — Homebrew casks
```

## Parallelism & Anti-Overlap Policy

> This project runs REAL 24/7 multi-terminal orchestration. Parallelism is the
> default: unlimited tokens, multi-terminal app, massive project, close deadline.

- **Minimum fleet:** the orchestrator keeps AT LEAST 3 active worker terminals at
  all times. Fewer than 3 on resume or cycle end => launching more comes FIRST,
  chosen from the highest-priority TODO/VERIFY tasks in this file, focused on
  high-level goals and principles, not micro-edits.
- **One task = one worker:** claim a task by setting its status IN_PROGRESS and
  recording your terminal handle in the Session Ledger BEFORE starting. Claimed
  tasks are forbidden to everyone else.
- **One folder = one orchestrator:** never work another slot's folder.
- **One file = one writer:** two live workers never edit the same file; such tasks
  run sequentially.
- **Claim-before-work:** confirm your Task ID is still unclaimed before executing;
  if done or claimed, stop and report instead of duplicating.
- **Cross-project dependencies:** record them as notes in the OTHER project's task
  file; never edit another project directly.
- **Quality bar unchanged under deadline pressure:** no DONE without verified
  evidence; status change and Rollup update happen in the same edit.

## Task File

Your task file is `.Fabrica-app-board/Fabrica-app-tasks.md` — the single source of truth for all app work. Schema for all tracking edits: `.Fabrica-board/Fabrica-Schema.md` (Tracking Schema v1 — status enum, Rollup, Checkpoint, Session Ledger).

## Resume Protocol

On heartbeat kick or session resume:

1. Read `.Fabrica-board/Heartbeat.md` (if you are the orchestrator slot) and your task file's **Checkpoint (Current State)** table FIRST.
2. Continue from the **Next Action** cell — never restart completed work; check Status + Notes before dispatching.
3. Any status change updates the Rollup in the same edit.

## How to Send Results

When your task is complete, send `worker_done`:

```bash
orca orchestration send --type worker_done --subject "Task complete" --body "Summary of what was done" --task-id <task_id> --dispatch-id <dispatch_id> --outcome succeeded --files-modified "path/a,path/b" --json
```

If blocked or something goes wrong:
```bash
orca orchestration send --type escalation --subject "Blocked" --body "What happened and what's needed" --task-id <task_id> --dispatch-id <dispatch_id> --json
```

## Orchestration IDs

Your task file's Session Ledger tracks these IDs for every worker session:

| ID | Format | When You Get It | How to Use It |
|----|--------|-----------------|---------------|
| `task_xxx` | `task_` + hex | `task-create --json` → `result.task.id` | Resume a stuck worker: `worker-start --task <task_id> --retry-of <dispatch_id>` |
| `ctx_xxx` | `ctx_` + hex | `worker-start --json` → `result.dispatchId` | Read worker output: `worker-read --dispatch <ctx_xxx>`. Resume: `--retry-of <ctx_xxx>` |
| `term_xxx` | `term_` + uuid | `worker-start --json` → `effects[terminal].id` | Send message to worker: `terminal send --terminal <term_xxx>`. Read output: `terminal read --terminal <term_xxx>` |
