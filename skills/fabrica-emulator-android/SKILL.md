---
name: fabrica-emulator-android
description: >
  Control an Android emulator / device from inside Fabrica using the `fabrica` CLI.
  Use for listing/booting AVDs, taps, swipes, typing, hardware buttons (incl. Back
  and Recents), rotation, app install/launch, runtime permissions, the accessibility
  tree, and logcat — driving a real adb-connected device or emulator. Cross-platform
  (Windows, Linux, macOS). Complements the fabrica-emulator (iOS) and fabrica-cli skills.
license: Apache-2.0
---

# Fabrica Emulator (Android)

This file is a discovery stub, not the usage guide. The full, version-matched Fabrica Android
emulator reference is served by the `fabrica` binary itself — kept out of this file on purpose
so it can never drift from the binary that will actually run your commands.

Engage Fabrica whenever you drive an adb-connected Android emulator or device from inside the
Fabrica app: listing/booting AVDs, taps, swipes, typing, hardware buttons (including Back and
Recents), rotation, app install/launch, runtime permissions, the accessibility tree, and
logcat. It is cross-platform (Windows, Linux, macOS) and complements the fabrica-emulator (iOS)
and fabrica-cli skills.

## Resolve the CLI for this session

Choose the executable once and reuse it for every later command:

- If the `FABRICA_CLI_COMMAND` environment variable is set, use its value. Fabrica exports this
  for managed WSL sessions.
- Otherwise, in a dev checkout whose session exposes `FABRICA_DEV_REPO_ROOT`, use `fabrica-dev`.
- Otherwise, on Linux outside an Fabrica-managed terminal, use `fabrica-ide`. Never run bare
  `fabrica` there — outside Fabrica's terminals it normally resolves to the
  GNOME Fabrica screen reader (`/usr/bin/orca`) and starts speech on the user's machine.
- Otherwise, use `fabrica`.

Below, `FABRICA` is a placeholder for the executable you resolved. Substitute it before
running anything; do not create a shell variable or run `FABRICA` literally. This works the
same way in POSIX shells, PowerShell, and cmd.exe.

If the selected executable cannot run, report its exact error and stop. Do not fall through
to another executable, which could silently target a different Fabrica build.

## Load the full guide before running Fabrica commands

```text
FABRICA skills get fabrica-emulator-android
```

That prints the complete, version-matched guide for the exact binary that will handle your
next commands — booting AVDs, taps and swipes, typing, hardware buttons, app lifecycle,
permissions, the accessibility tree, and logcat. Read it first, then run the specific
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
FABRICA emulator devices --json
```

Then tell the user that updating Fabrica restores the full, version-matched guide via
`FABRICA skills get fabrica-emulator-android`. Beyond these commands, ask the user rather than
guessing a command surface this older binary may not support.
