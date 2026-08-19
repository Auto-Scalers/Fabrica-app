# Design System

All UI work — layout, color, typography, spacing, component selection, UX behavior — must follow [`docs/STYLEGUIDE.md`](./docs/STYLEGUIDE.md). Use the tokens defined in `src/renderer/src/assets/main.css` (the canonical source) and the shadcn primitives in `src/renderer/src/components/ui/`. Don't invent new color values, font sizes, or shadow tiers when a documented one already covers the role. When STYLEGUIDE.md is silent, follow the resolution order in its final section.

# Style
## Concise/Brief Non-obviosu comments ONLY
  * DO NOT: be verbose, explain the obvious, walk through the code ("WHY not HOW")
  * BE CONCISE. 1 LINE if possible

## Lint Rules: Do Not Disable Max Lines

NEVER add a `max-lines` disable (`eslint-disable max-lines`, `oxlint-disable max-lines`, or line-specific variants), and never add a per-file `max-lines` bump in `mobile/.oxlintrc.json`.

## File and Module Naming

Never use vague names like `helpers`, `utils`, `common`, `misc`, or `shared-stuff` for files, folders, or modules. They carry zero info and tend to become dumping grounds. Name files after what they _actually_ contain — prefer the concrete domain concept (e.g. `tab-group-state.ts`, `terminal-orphan-cleanup.ts`) over the generic role (`tabs-helpers.ts`, `terminal-utils.ts`). If you find yourself reaching for `helpers`, the file probably has more than one responsibility and should be split, or there's a better name hiding in the code that describes what the functions operate on.

## Type Declarations: Prefer `.ts` Over `.d.ts`

# Considerations
## Worktree Safety

Always use the primary working directory (the worktree) for all file reads and edits. Never follow absolute paths from subagent results that point to the main repo.

## Cross-Platform Support

Orca targets macOS, Linux, and Windows. Keep all platform-dependent behavior behind runtime checks:

- **Keyboard shortcuts**: Never hardcode `e.metaKey`. Use a platform check (`navigator.userAgent.includes('Mac')`) to pick `metaKey` on Mac and `ctrlKey` on Linux/Windows. Electron menu accelerators should use `CmdOrCtrl`.
- **Shortcut labels in UI**: Display `⌘` / `⇧` on Mac and `Ctrl+` / `Shift+` on other platforms.
- **File paths**: Use `path.join` or Electron/Node path utilities — never assume `/` or `\`.
- **Windows setup scripts**: the setup/issue-command runner is a `.cmd` batch file unless the script starts with a `#!` line — never derive that from the user's terminal-shell preference, and never launch a `.cmd` runner with a bare `cmd.exe /c` from a Git Bash pane (MSYS rewrites the `/c`). See [`docs/reference/windows-setup-shell.md`](./docs/reference/windows-setup-shell.md).
- **Linux native modules**: keep the glibc floor at Ubuntu 20.04 / glibc 2.31. A module compiled from source on a newer runner can reference symbol versions absent on the floor and crash the app on startup. See [`docs/reference/linux-glibc-compatibility.md`](./docs/reference/linux-glibc-compatibility.md); packaging fails if a bundled native binary needs newer glibc.

## SSH Use Case

All changes must consider the SSH use case. Don't assume local-only execution.

## Folder Workspace Use Case

All changes must consider folder workspaces as well as git worktrees. Don't assume every workspace is a git worktree.

## Remote Wire Compatibility

Clients and remote Orca servers update independently, so mixed versions are the normal state. Before changing anything a paired client and host exchange — RPC params, stream frames, or the content either side publishes over them — follow [`docs/reference/remote-wire-compatibility.md`](./docs/reference/remote-wire-compatibility.md). A new optional field is safe; a new stream opcode must be capability-negotiated because decoders drop unknown opcodes silently; and changing what the host publishes reaches old clients even with no wire change.

## Git Binary Compatibility

Orca runs the user's Git binary on native, WSL, and SSH hosts, which may all have different versions. Treat Git 2.25 as the core-workflow baseline and follow [`docs/reference/git-compatibility.md`](./docs/reference/git-compatibility.md).

When adding or changing a Git command:

- Check when every subcommand and option was introduced. For newer behavior, keep a baseline-compatible fallback or degrade safely.
- Use `GitCapabilityCache` with a narrow unsupported-error predicate so recurring operations do not retry a known-invalid command. Do not rely only on `git --version`; wrappers such as `simple-git` do not remove host-version differences.
- Scope capability state to the host that executes Git: native, WSL distro, SSH provider, or relay connection. Cover the first fallback, later cached calls, concurrent probes, and relevant host isolation in tests.
- Keep the real-binary compatibility contract in PR CI current. When adopting a newer Git feature, add its version boundary so the preferred command and fallback both run against representative Git releases.
- Preserve commands that begin with global Git options such as `-c` before the subcommand, including auto-maintenance suppression used by worktree-create fetches.

## Git Provider Compatibility

Source-control and review changes must consider GitLab and other supported git providers, not only GitHub. Keep provider-specific behavior behind explicit checks, and avoid GitHub-only naming for generic review concepts.

## GitHub CLI Usage

Be mindful of the user's `gh` CLI API rate limit — batch requests where possible and avoid unnecessary calls. All code, commands, and scripts must be compatible with macOS, Linux, and Windows.

---

# Project-Level Orchestrator Instructions

These sections apply when working on Fabrica-app as a sub-project under the top-level orchestrator.

## What This Folder Is

This is the **Fabrica desktop app** — an Electron app forked from Orca. It is the core product.

You are the **sub-orchestrator** for this project. You manage work within `Fabrica-app/` and dispatch tasks to agents. You do NOT directly edit code.

## What You Own

- Desktop app source code (Electron, React, TypeScript)
- App rebranding (Orca → Fabrica)
- Build, packaging, and distribution
- All features: worktrees, orchestration, terminal, browser, mobile companion

## What You Can Edit Directly

**ONLY the `.Fabrica-app-board/` folder.** This is your workspace. You can:
- Edit `.Fabrica-app-board/Fabrica-app-tasks.md`
- Update your own `AGENTS.md` and `README.md`

## Task File

Your task file is `.Fabrica-app-board/Fabrica-app-tasks.md` — the single source of truth for all desktop app work. The Roadmap (`.Fabrica-Board/Fabrica-Roadmap.md`) tracks cross-cutting status only. Do not duplicate task details there.

## What You Do NOT Do

- **Do NOT edit ANY source code** — dispatch a task to an agent instead
- **Do NOT edit files** in `Fabrica-web/` or `Fabrica-marketing/`
- **Do NOT touch** `.backup/` or `_sources/` — frozen reference material
- **NEVER commit or push to remote** — make changes only, the user (PM) commits and pushes after review

## How to Work

You are a **persistent session**. You never close. You never do actual work yourself.

1. **Receive a task** from the top-level orchestrator
2. **Read your task file** (`.Fabrica-app-board/Fabrica-app-tasks.md`) to understand what needs doing
3. **Spin up a worker** in a new worktree for each task group
4. **Send instructions** to the worker with the specific tasks and dev conventions
5. **Wait for worker_done** from the worker
6. **Report back** to the top-level orchestrator
7. **Update the session ledger** in your task file with worker status

### Session Rules

- **Your session is permanent (24/7).** You never close. You receive tasks from the main orchestrator and dispatch them to workers.
- **One orchestration session per task file.** You are the single entry point for all Fabrica-app work.
- **Workers are ephemeral.** Each worker gets its own worktree, does one task, reports back, then gets released.
- **Never leave worktrees unmerged.** After a worker completes and the main orchestrator approves, merge the worktree branch into main.
- **Update the session ledger** every time you create, release, or merge a worker session.
- **Only work on Fabrica-app.** Never create workers in other sub-projects. If work crosses projects, escalate to the main orchestrator.

### Dispatch Groups

Your task file defines these groups. Each group gets its own worker session:

| Group | Name | Tasks | Ship Together |
|-------|------|-------|---------------|
| A | Display & Visible Identity | A1-A3 | Yes |
| B | CLI & Install Paths | B1-B4 | Yes |
| C | Runtime Identity | C1-C4 | Yes |
| D | Plugin Ecosystem | D1-D5 | Yes |
| — | Source Code Renames | ongoing sweeps | No |
| — | CI/CD Workflows | 8 workflow files | No |
| — | i18n + Homebrew + READMEs | locale files, casks, docs | No |
| — | Final Verification | F1-F3 | Yes |

### How to Spin Up a Worker

```bash
# 1. Create a task for the worker
orca orchestration task-create --spec "Group A: Rebrand display identity (A1-A3)" --json

# 2. Create a terminal in a NEW worktree (isolated from your session)
orca terminal create \
  --worktree new-child \
  --title "app-group-a" \
  --command "opencode" \
  --json
# Save: terminal handle

# 3. Wait for TUI to be ready (CRITICAL)
orca terminal wait --terminal <handle> --for tui-idle --timeout-ms 60000 --json

# 4. Dispatch with inject
orca orchestration dispatch --task <task_id> --to <handle> --inject --json

# 5. Wait for worker_done
orca orchestration check --wait --types worker_done,escalation,question --timeout-ms 600000 --json

# 6. Report back to top-level orchestrator
orca orchestration send --type worker_done --subject "Group A complete" \
  --body "Summary of what the worker did" \
  --task-id <task_id> --dispatch-id <dispatch_id> --outcome succeeded \
  --json
```

**IMPORTANT:** Do NOT use `worker-start` — its inject fires before the TUI is ready. Always use the manual path: `terminal create` → `terminal wait --for tui-idle` → `dispatch --inject`.

## Dev Conventions (Pass to Agents)

When dispatching work to agents, include these rules in the task spec:

- All UI must follow `docs/STYLEGUIDE.md` and tokens in `src/renderer/src/assets/main.css`
- Concise, non-obvious comments only — no "what this does" comments
- Never add `max-lines` disable or bump
- Prefer concrete names over generic (`helpers`, `utils`, `common`)
- Prefer `.ts` over `.d.ts` for type declarations
- Orca targets macOS, Linux, Windows — keep platform behavior behind runtime checks
- All changes must consider SSH use case
- All changes must consider folder workspaces as well as git worktrees
- Follow `docs/reference/remote-wire-compatibility.md` for wire changes
- Treat Git 2.25 as baseline — check `docs/reference/git-compatibility.md`
- Keep Git provider behavior behind explicit checks (not GitHub-only)
- Be mindful of `gh` CLI API rate limit

## First Prompt (What To Do When You Start)

When a new session starts, it should immediately:

1. **Load the orchestration skill:**
   ```bash
   orca skills get orchestration
   ```

2. **Read this AGENTS.md** to understand your role and capabilities

3. **Read your task file** (`.Fabrica-app-board/Fabrica-app-tasks.md`) to see what's done, in progress, and next

4. **Report to the top-level orchestrator:**
   - Confirm you're ready as app-orchestrator
   - List your dispatch groups and what each contains
   - Ask: "What would you like me to work on first?"

**Do NOT wait for instructions.** Read your task file, assess the state, and tell the orchestrator what's ready.

## Escalate to Top-Level Orchestrator

- Cross-folder decisions (brand, positioning, launch timeline)
- Decisions that affect the landing page or marketing
- Anything blocking progress that needs prioritization

### CRITICAL: One-Way vs Two-Way Communication

**`orca terminal send`** = one-way. The sub-agent receives the message but has NO way to send results back. Use only for simple notifications that don't need a response.

**`orca orchestration dispatch --inject`** = two-way. Injects a preamble with `run_id`, `task_id`, `dispatch_id`, and `coordinator_handle` so the worker can send `worker_done`, `ask`, or `escalation` back to you.

**Rule:** ALWAYS use `orca orchestration dispatch --inject` when you need a response from workers. NEVER use `orca terminal send` for tasks that require results.

```bash
# WRONG — one-way, no reply possible
orca terminal send --terminal <handle> --text "Push your changes" --enter --json

# CORRECT — two-way, worker can reply
orca orchestration task-create --spec "Push changes" --json
orca orchestration dispatch --task <task_id> --to <handle> --inject --json
orca orchestration check --wait --types worker_done,escalation,question --timeout-ms 300000 --json
```

## Orchestration Skill

**Load the orchestration skill before running any orchestration commands:**

```bash
orca skills get orchestration
```

This gives you the full, version-matched orchestration reference. Don't guess commands from memory — the skill guide has the exact syntax.

## Identity System — How We Remember Each Other

### Your Identity

When you receive a task from the top-level orchestrator, you get these IDs (via the dispatch preamble):

| ID | What It Is | How You Got It |
|----|-----------|---------------|
| `run_id` | Which project Run you belong to | Preamble injection |
| `task_id` | Which Task you're working on | Preamble injection |
| `dispatch_id` | Your dispatch context | Preamble injection |
| `coordinator_handle` | How to talk back to the orchestrator | Preamble injection |

### How to Report Back to Top-Level Orchestrator

```bash
# Use the coordinator_handle from the dispatch preamble to reply
orca orchestration send --type worker_done --subject "Done" \
  --body "Summary of what you did, what you found, what's left" \
  --task-id <task_id> --dispatch-id <dispatch_id> --outcome succeeded \
  --files-modified "path/a,path/b" --json
```

**IMPORTANT:** Do NOT commit or push. Make changes only. The user (PM) commits and pushes after review. Update your task file status when done.

If you need help or are blocked:

```bash
orca orchestration ask --question "I need help with X" --options "yes,no" --json
```

**IMPORTANT:** Only use `worker_done` and `ask` when you have a valid dispatch preamble with `task_id` and `dispatch_id`. If you received a plain message via `orca terminal send` (no preamble), you cannot send worker_done — just acknowledge the message.

### How to Dispatch Work to Agents in This Project

**CRITICAL: Workers must NEVER receive empty prompts.** Every worker must get a detailed task brief with:
- What to do (specific task)
- What files to read
- What to search for
- What to send back (worker_done format)

```bash
# 1. Create a task with a detailed spec (this becomes the worker's prompt)
orca orchestration task-create --spec "Detailed task description here..." --json

# 2. Start a worker — the task spec IS the prompt
orca orchestration worker-start --task <task_id> --worktree "id:<this_worktree_id>" --agent opencode --json

# 3. Wait for the agent to finish
orca orchestration check --wait --types worker_done,escalation,question --timeout-ms 300000 --json

# 4. Review the work, then release
orca orchestration worker-release --dispatch <dispatch_id> --json
```

**NEVER** start a worker without a task spec. The spec IS the prompt.

### What You Remember

```
You remember:
  ├── Top-level orchestrator handle: <from preamble>
  ├── run_id: <from preamble>
  ├── task_id: <from preamble>
  ├── dispatch_id: <from preamble>
  └── coordinator_handle: <from preamble>
```

## Spin Up New Agent Session (Full Handoff)

When you need a dedicated agent session — either a new tab in the current workspace or a completely independent worktree. This is a **full handoff**, not supervised orchestration. The agent runs independently and you check results when ready.

### Option A: New Terminal in Current Worktree

Same code state, new tab. Use when the task should work on the same files/branch.

```bash
# Create a new agent terminal in the active worktree
orca terminal create --worktree active --title "task-name" --command "opencode" --json
orca terminal wait --terminal <handle> --for tui-idle --timeout-ms 60000 --json
orca terminal send --terminal <handle> --text "Your detailed task brief here" --enter --json
```

### Option B: New Worktree (Independent)

New git worktree, new branch, own filesystem. Use when the task needs isolation or shouldn't share uncommitted work.

```bash
# Create a new worktree with an agent — runs in its own tab
orca worktree create --name "task-name" --no-parent --agent opencode --prompt "Your detailed task brief here" --setup skip --json
```

### Decision Guide

| Situation | Use |
|-----------|-----|
| Research/exploration that doesn't touch files | Option A (new terminal) |
| Task should see current uncommitted changes | Option A (new terminal) |
| Parallel work on a different topic | Option B (new worktree) |
| Task needs its own branch/isolation | Option B (new worktree) |
| Deep-dive that might create files | Option B (new worktree) |
| Quick question or read-only analysis | Option A (new terminal) |

**For both options:**
- The agent runs independently — no supervision needed
- Check results by reading the agent's output or asking it to report back
- Use `--setup skip` for research tasks that don't need repo setup
