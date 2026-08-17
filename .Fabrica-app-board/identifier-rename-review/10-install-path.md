# 10. Windows install path — `Program Files\Orca Dev`

> **STATUS: ⏳ PLANNING — NOT DONE.** Option C decided; plan not finalized or implemented.

## What it is
When Fabrica installs its terminal command (`orca`/`orca-dev`) on Windows, it places a launcher under the user's profile at `Programs\Orca Dev\bin\orca-dev.cmd`. This is a folder name a user can see in File Explorer / Start Menu.

## Where it lives
- `src/main/cli/cli-installer.ts:340,343,354` — install paths like `Programs/Orca Dev/bin/orca-dev.cmd`, `~/.local/bin/orca-dev`, `~/.local/bin/orca-ide`

## Visible to users?
**Yes** — folder names and Start Menu entries.

## The 0-users impact
Zero — no installed launchers exist to move.

## Options

### Option A — Rename now to `Programs\Fabrica Dev\bin\fabrica-dev.cmd` (Recommended)
Benefit: no "Orca" on disk; folder name matches brand from the first install.
Tradeoff: must rename the **installer paths AND every place that detects/repairs an existing install** together, or the app installs `fabrica-dev` but still looks for the old `orca-dev` path and shows "not installed." Mechanical find-and-replace + tests.

### Option B — Keep `Orca Dev`
Benefit: zero effort.
Tradeoff: "Orca Dev" folder on every Windows user's machine forever.

### Option C — Rename together with the CLI command rename (item 11) ✅ DECIDED
Benefit: install path and command name change as one coherent unit.
Tradeoff: couples two changes; fine, but the folder name can also be corrected independently of the command name.

## ✅ DECIDED
**Option C — rename together with item 11 (CLI command).** Rename the install paths + the packaged launcher names (`orca.cmd`→`fabrica.cmd`, `orca.exe`→`fabrica.exe` in `config/electron-builder.config.cjs` §2.2) as one unit, so the installer, the PATH entry, and the uninstaller all agree. Confirmed 2026-08-13: ships in the same coordinated Group B release as items 11, 02, 06.

**Scope extended (2026-08-13, from item 07):** this item also owns the **download artifact filenames** still branded `orca`: `orca-windows-setup.${ext}`, `orca-macos-${arch}.${ext}`, `orca-linux.${ext}`, `orca-ide_${version}_${arch}.${ext}` (`config/electron-builder.config.cjs:317,412,451-477`). Rename those to `fabrica-*` in the same coordinated release as the install-path + CLI rename.

Effort: Medium. Value: removes an obvious "Orca" folder from user machines.