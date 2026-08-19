# Fabrica-app — Worker Instructions (AGENTS.md)

## What This Folder Is

This is the **Fabrica desktop app** — an Electron app forked from Orca. You are a worker dispatched by the top-level orchestrator to complete a task in this repo.

## Tech Stack

- Electron 36+ (Chromium 138)
- TypeScript, Vite, React 19
- Pinia (state), Vue (some components)
- oxlint + prettier
- pnpm workspaces

## What You Should Know

- This is a rebrand from Orca to Fabrica
- App ID: `ai.autoscalers.fabrica`
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

## Task File

Your task file is `.Fabrica-app-board/Fabrica-app-tasks.md` — the single source of truth for all app work.

## How to Send Results

When your task is complete, send `worker_done`:

```bash
orca orchestration send --type worker_done --subject "Task complete" --body "Summary of what was done" --task-id <task_id> --dispatch-id <dispatch_id> --outcome succeeded --files-modified "path/a,path/b" --json
```

If blocked or something goes wrong:
```bash
orca orchestration send --type escalation --subject "Blocked" --body "What happened and what's needed" --task-id <task_id> --dispatch-id <dispatch_id> --json
```
