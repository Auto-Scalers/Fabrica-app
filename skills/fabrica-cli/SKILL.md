---
name: fabrica-cli
description: >-
  Use the public `fabrica` CLI to operate Fabrica-managed worktrees, folder contexts,
  terminals, repos, automations, artifacts, worktree comments, and the browser
  embedded inside the Fabrica app. Use when the user says "$fabrica-cli", "use fabrica cli",
  "Fabrica worktree", "child worktree", "cardStatus", "spawn codex/claude in a worktree",
  "read/wait/send Fabrica terminal", "terminal send", "full handoff", "handover",
  "give this to another agent", "another worktree", "Fabrica browser", "fabrica artifacts",
  "share HTML/Markdown", "public artifact link", or "control the browser inside
  Fabrica". Prefer this over raw `git worktree`, ad hoc
  PTYs, Playwright, or Computer Use when the task touches Fabrica-managed state.
  Use Computer Use for browser windows, webviews, or desktop UI outside Fabrica's
  embedded browser.
---

# Fabrica CLI

This file is a discovery stub, not the usage guide. The full, version-matched Fabrica CLI
reference is served by the `fabrica` binary itself — kept out of this file on purpose so it
can never drift from the binary that will actually run your commands.

Engage Fabrica whenever its running editor/runtime is the source of truth: Fabrica-managed
worktrees, folder contexts, terminals, repos, automations, worktree comments, and the
browser embedded inside the Fabrica app. Triggers include "$fabrica-cli", "Fabrica worktree",
"child worktree", "spawn codex/claude in a worktree", "read/wait/send Fabrica terminal",
"full handoff" / "handover" / "give this to another agent", and "control the browser
inside Fabrica". Use plain shell tools when Fabrica state does not matter.

## Resolve the CLI for this session

Choose the executable once and reuse it for every later command:

- If the `FABRICA_CLI_COMMAND` environment variable is set, use its value. Fabrica exports this
  for managed WSL sessions.
- Otherwise, in a dev checkout whose session exposes `FABRICA_DEV_REPO_ROOT`, use `fabrica-dev`.
- Otherwise, on Linux outside an Fabrica-managed terminal, use `fabrica-ide`.
- Otherwise, use `fabrica`.

Below, `FABRICA` is a placeholder for the executable you resolved. Substitute it before
running anything; do not create a shell variable or run `FABRICA` literally. This works the
same way in POSIX shells, PowerShell, and cmd.exe.

If the selected executable cannot run, report its exact error and stop. Do not fall through
to another executable, which could silently target a different Fabrica build.

## Load the full guide before running Fabrica commands

```text
FABRICA skills get fabrica-cli
```

That prints the complete, version-matched guide for the exact binary that will handle your
next commands — worktrees, handoffs, terminals, automations, and the built-in browser.
Read it first, then run the specific command you need.

Don't guess subcommands or flags from memory or from a cached copy of this stub. They
change between Fabrica releases, and this file deliberately no longer lists them. Confirm the
app is up with `FABRICA status --json` (start it with `FABRICA open --json` if needed), and
prefer `--json` for agent-driven calls.

## If an older Fabrica does not recognize `skills get`

Use this fallback only when the selected binary explicitly reports that `skills get` is an
unknown command. Another failure is not proof of an older binary; report it rather than
guessing or changing executables. For a confirmed pre-guide binary, use only this bounded,
read-only bootstrap to orient. Do not dead-end and do not invent commands:

```text
FABRICA status --json
FABRICA worktree ps --json
FABRICA terminal list --json
```

Then tell the user that updating Fabrica restores the full, version-matched guide via
`FABRICA skills get fabrica-cli`. Beyond these commands, ask the user rather than guessing a
command surface this older binary may not support.
