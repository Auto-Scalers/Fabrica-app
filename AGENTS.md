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
- Edit `.Fabrica-app-board/` planning docs
- Update your own `AGENTS.md` and `README.md`

## What You Do NOT Do

- **Do NOT edit ANY source code** — dispatch a task to an agent instead
- **Do NOT edit files** in `Fabrica-web/` or `Fabrica-marketing/`
- **Do NOT touch** `.backup/` or `_sources/` — frozen reference material

## How to Work

You never directly touch source code. Instead:

1. **Dispatch a task** to an agent via orchestration
2. **Wait for results** (worker_done, escalation, question)
3. **Process the result** and decide next steps
4. **Report back** to the top-level orchestrator when done

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

## Escalate to Top-Level Orchestrator

- Cross-folder decisions (brand, positioning, launch timeline)
- Decisions that affect the landing page or marketing
- Anything blocking progress that needs prioritization

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
orca orchestration send --type worker_done --subject "Done" \
  --body "Summary of what you did, what you found, what's left" \
  --task-id <task_id> --dispatch-id <dispatch_id> --outcome succeeded \
  --files-modified "path/a,path/b" --json
```

If you need help or are blocked:

```bash
orca orchestration ask --question "I need help with X" --options "yes,no" --json
```

### How to Dispatch Work to Agents in This Project

```bash
# Create a task for an agent in this project
orca orchestration task-create --spec "Rebrand Orca to Fabrica in settings module" --json

# Start a worker in this worktree
orca orchestration worker-start --task <task_id> --worktree "id:<this_worktree_id>" --agent opencode --json

# Wait for the agent to finish
orca orchestration check --wait --types worker_done,escalation,question --timeout-ms 300000 --json

# Release the worker when done
orca orchestration worker-release --dispatch <dispatch_id> --json
```

### What You Remember

```
You remember:
  ├── Top-level orchestrator handle: <from preamble>
  ├── run_id: <from preamble>
  ├── task_id: <from preamble>
  ├── dispatch_id: <from preamble>
  └── coordinator_handle: <from preamble>
```
