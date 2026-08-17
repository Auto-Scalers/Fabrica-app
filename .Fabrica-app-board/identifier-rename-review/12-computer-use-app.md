# 12. `Orca Computer Use.app` — macOS helper app

## What it is
On macOS, Fabrica's "computer use" (controlling the Mac with the AI) is performed by a tiny **helper app** bundled inside the main app, named `Orca Computer Use.app`. It's the process that actually clicks/reads the screen, and it needs special macOS permissions (Accessibility, Screen Recording).

## Where it lives
- `config/electron-builder.config.cjs:279,383-384` (bundling + signing)
- `src/main/computer/macos-native-provider-paths.ts:10-13` (path resolution)
- `macos-computer-use-permissions.ts` (permission prompts), `macos-native-provider-client.ts`, plus build scripts `config/scripts/build-computer-macos.mjs` and tests

## Visible to users?
Semi — the name appears in macOS System Settings → Privacy & Security / App Management when the helper asks for permission, and in Activity Monitor.

## The 0-users impact
Zero — the helper is bundled fresh with each install; no installed helper to migrate.

## Options

### Option A — Rename now to `Fabrica Computer Use.app` (Recommended, but in lockstep)
Benefit: no "Orca" in macOS permissions UI.
Tradeoff: the desktop app **detects this helper by its exact name** (`macos-native-provider-paths.ts`, permission checks) — the helper name, the packaging config, the signing step, and the permission-detection code must all change **together**, or computer use silently breaks on macOS. Low risk at 0 users; just do it as one unit.

### Option B — Keep `Orca Computer Use.app`
Benefit: zero effort; nothing to coordinate.
Tradeoff: "Orca" permanently visible in macOS privacy settings and Activity Monitor.

### Option C — Rename helper AND its bundle id in the coordinated appId release
Benefit: aligns with item 07/08 — the macOS helper's bundle id is matched by the mobile app's permission flow (`macos-computer-use-permissions.ts`, `com.stablyai.orca`).
Tradeoff: the biggest of the three; must be sequenced with the mobile-app + appId rename (infra plan §11.4).

## Recommendation
**Option A — rename to `Fabrica Computer Use.app` now, changing helper name + packaging + detection + signing as one unit.** Leave the *bundle id* (`com.stablyai.orca`) for the coordinated appId release (item 07), since the bundle id is what the mobile pairing flow checks.

Effort: Medium. Value: removes "Orca" from macOS privacy UI; the one part of this list that genuinely *needs* coordination.