# 05. Data folders / `.orca` paths — app config & runtime data directories

> **STATUS: ⛔ BLOCKED — deferred to Group A item 07.** The folder name is NOT a free string: Electron's real `userData` resolves from `productName:'Orca'` (electron-builder), `package.json name:'orca'`, and `app.setName()` (`dev-instance-identity.ts`, `index.ts:2120`). Renaming only the hardcoded `'orca'` in `metadata.ts`/`codex-home-paths.ts` would desync CLI vs Electron handshake. Must ship with the app-name/productName rename.

## What it is
Every app stores its settings and data in a hidden OS folder. Today Fabrica saves to an **"orca" folder** in several places:
- macOS: `~/Library/Application Support/orca`
- Windows: `%APPDATA%/orca`
- Linux: `~/.config/orca`, `~/.local/share/orca`
Plus agent runtime homes like `~/.local/share/orca/codex-runtime-home/...`.

## Where it lives
- `src/cli/runtime/metadata.ts:54,64,69`
- `src/main/codex/codex-home-paths.ts:61-66`
- `src/shared/constants.ts:171`, wsl bridge scripts, etc.

## Visible to users?
Rarely (a technical user poking at their files), but these folders **persist user data** — worktrees, sessions, settings.

## The 0-users impact
**Previously I said this needs a migration (copy `Application Support/orca → Fabrica`). That's now unnecessary.** With 0 users there is nothing in these folders, so the rename is a pure find-and-replace with no migration step, no symlink, no shellout. The `infra-migration_plan.md` §3 migration note can be downgraded to a one-liner.

## Options

### Option A — Rename now to `fabrica`-named folders (Recommended)
Benefit: correct data location from the very first user; no ugly "orca" folder appearing in user profiles at launch. Zero migration needed.
Tradeoff: must rename **both readers and writers consistently** (they're spread over cli + main + shared) or the app looks in one folder and writes to another. Medium effort, but mechanical — the existing test suite catches mismatches.

### Option B — Keep `orca` folders forever
Benefit: zero effort.
Tradeoff: "Orca" appears in every user's filesystem permanently; contradicts the brand; harder to explain to a support user ("go to your `orca` folder…").

### Option C — Rename at launch with symlink/copy fallback
Benefit: safe if a few users appear before launch.
Tradeoff: added complexity for the 0-user case; not needed now.

## ✅ DECIDED
**Option A — rename now**, as a careful pass over `cli/runtime/metadata.ts`, `codex-home-paths.ts`, `constants.ts`, and the WSL/agent-runtime paths, with `grep -rn "orca"` used to find every straggler. Skip any migration. Update `infra-migration_plan.md` §3 to reflect that migration is no longer required.

Effort: Medium-high (many files). Value: prevents a permanent branding leak in every user's filesystem.