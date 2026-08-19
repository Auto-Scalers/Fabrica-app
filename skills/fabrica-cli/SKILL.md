---
name: fabrica-cli
description: >-
  Use the public `fabrica` CLI to operate fabrica-managed worktrees, folder contexts,
  terminals, repos, automations, artifacts, worktree comments, and the browser
  embedded inside the fabrica app. Use when the user says "$fabrica-cli", "use fabrica cli",
  "fabrica worktree", "child worktree", "cardStatus", "spawn codex/claude in a worktree",
  "read/wait/send fabrica terminal", "terminal send", "full handoff", "handover",
  "give this to another agent", "another worktree", "fabrica browser", "fabrica artifacts",
  "share HTML/Markdown", "public artifact link", or "control the browser inside
  fabrica". Prefer this over raw `git worktree`, ad hoc
  PTYs, Playwright, or Computer Use when the task touches fabrica-managed state.
  Use Computer Use for browser windows, webviews, or desktop UI outside fabrica's
  embedded browser.
---

# fabrica CLI

This file is a discovery stub, not the usage guide. The full, version-matched fabrica CLI
reference is served by the `fabrica` binary itself — kept out of this file on purpose so it
can never drift from the binary that will actually run your commands.

Engage fabrica whenever its running editor/runtime is the source of truth: fabrica-managed
worktrees, folder contexts, terminals, repos, automations, worktree comments, and the
browser embedded inside the fabrica app. Triggers include "$fabrica-cli", "fabrica worktree",
"child worktree", "spawn codex/claude in a worktree", "read/wait/send fabrica terminal",
"full handoff" / "handover" / "give this to another agent", and "control the browser
inside fabrica". Use plain shell tools when fabrica state does not matter.

## Resolve the CLI for this session

Choose the executable once and reuse it for every later command:

- If the `FABRICA_CLI_COMMAND` environment variable is set, use its value. fabrica exports this
  for managed WSL sessions.
- Otherwise, in a dev checkout whose session exposes `FABRICA_DEV_REPO_ROOT`, use `fabrica-dev`.
- Otherwise, on Linux outside a Fabrica-managed terminal, use `fabrica-ide`. Never run bare
  `fabrica` there — outside Fabrica's terminals it normally resolves to the
  GNOME Orca screen reader (`/usr/bin/orca`) and starts speech on the user's machine.
- Otherwise, use `fabrica`.

Below, `fabrica` is a placeholder for the executable you resolved. Substitute it before
running anything; do not create a shell variable or run `fabrica` literally. This works the
same way in POSIX shells, PowerShell, and cmd.exe.

If the selected executable cannot run, report its exact error and stop. Do not fall through
to another executable, which could silently target a different fabrica build.

## Load the full guide before running fabrica commands

```text
fabrica skills get fabrica-cli
```

That prints the complete, version-matched guide for the exact binary that will handle your
next commands — worktrees, handoffs, terminals, automations, and the built-in browser.
Read it first, then run the specific command you need.

Don't guess subcommands or flags from memory or from a cached copy of this stub. They
change between fabrica releases, and this file deliberately no longer lists them. Confirm the
app is up with `fabrica status --json` (start it with `fabrica open --json` if needed), and
prefer `--json` for agent-driven calls.

## If an older fabrica does not recognize `skills get`

Use this fallback only when the selected binary explicitly reports that `skills get` is an
unknown command. Another failure is not proof of an older binary; report it rather than
guessing or changing executables. For a confirmed pre-guide binary, use only this bounded,
read-only bootstrap to orient. Do not dead-end and do not invent commands:

```text
fabrica status --json
fabrica worktree ps --json
fabrica terminal list --json
```

Then tell the user that updating fabrica restores the full, version-matched guide via
`fabrica skills get fabrica-cli`. Beyond these commands, ask the user rather than guessing a
command surface this older binary may not support.
