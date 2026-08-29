# Fabrica Emulator

This file is a discovery stub, not the usage guide. The full, version-matched Fabrica emulator
reference is served by the `fabrica` binary itself — kept out of this file on purpose so it can
never drift from the binary that will actually run your commands.

Engage Fabrica whenever you drive a mobile (iOS) emulator / simulator stream from inside the
Fabrica app: taps, gestures, typing, hardware buttons, camera injection, runtime permissions,
the accessibility tree, and more — all while the live view stays in Fabrica's emulator pane.
Prefer this over raw `serve-sim` or direct `simctl` when running agents inside Fabrica, which
handles device scoping, helper lifecycle, and worktree context for you. It complements the
fabrica-cli skill for terminals, worktrees, and the built-in browser.

## Resolve the CLI for this session

Choose the executable once and reuse it for every later command:

- If the `FABRICA_CLI_COMMAND` environment variable is set, use its value. Fabrica exports this
  for managed WSL sessions.
- Otherwise, in a dev checkout whose session exposes `FABRICA_DEV_REPO_ROOT`, use `fabrica-dev`.
- Otherwise, on Linux outside an Fabrica-managed terminal, use `fabrica-ide`. Never run bare
  `fabrica` there — outside Fabrica's terminals it normally resolves to the
  GNOME Orca screen reader (`/usr/bin/orca`) and starts speech on the user's machine.
- Otherwise, use `fabrica`.

Below, `FABRICA` is a placeholder for the executable you resolved. Substitute it before
running anything; do not create a shell variable or run `FABRICA` literally. This works the
same way in POSIX shells, PowerShell, and cmd.exe.

If the selected executable cannot run, report its exact error and stop. Do not fall through
to another executable, which could silently target a different Fabrica build.

## Load the full guide before running Fabrica commands

```text
FABRICA skills get fabrica-emulator
```

That prints the complete, version-matched guide for the exact binary that will handle your
next commands — booting devices, taps and gestures, typing, hardware buttons, camera
injection, permissions, and the accessibility tree. Read it first, then run the specific
command you need.

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
FABRICA emulator list --json
```

Then tell the user that updating Fabrica restores the full, version-matched guide via
`FABRICA skills get fabrica-emulator`. Beyond these commands, ask the user rather than guessing a
command surface this older binary may not support.
