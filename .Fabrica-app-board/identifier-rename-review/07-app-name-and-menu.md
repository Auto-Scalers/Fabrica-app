# 07. App name / About / app menu / productName

## What it is
The **name of the product itself** as the OS and app chrome report it:
- `productName` in `config/electron-builder.config.cjs:94` (`'Orca'`)
- Executable name `Orca.exe` (`win.executableName`, so the packaged app is `Orca.exe`)
- Window title / dock / taskbar / About panel / app menu label
- Notification sender ("Orca")
- The **app data identifier** `com.stablyai.orca` in packaging

## Where it lives
Packaging: `config/electron-builder.config.cjs` (§2.2 of infra plan). Runtime: `src/main/index.ts`, menu (`register-app-menu.ts`), notifications, About UI.

## Visible to users?
**Yes — everywhere.** This is the brand.

## The 0-users impact
No stored data ties to the *display* name alone, but the **bundle id / appId** (`com.stablyai.orca`) doubles as an OS-level identity. Renaming the *display* name is cosmetic; renaming the *appId* is the heavier part because old shortcuts/settings key off it — with 0 users, `appId` can also be renamed cleanly.

## Options

### Option A — Rename display name now; defer `appId` decision (Recommended)
Benefit: the instant win — window, dock, About, menu, notifications all say "Fabrica" with moderate effort. Keep `appId` as `com.stablyai.orca` until the mobile/native companions are named (they must match, see `12-computer-use-app.md`).
Tradeoff: a greenfield user's system will show "Fabrica" but the underlying product id still says `orca`. Users never see appId, so acceptable.

### Option B — Rename display name AND `appId` (`com.fabrica.app`) now
Benefit: fully clean.
Tradeoff: `appId` is coupled to the mobile app + macOS helper bundle ids (`com.stablyai.orca`) in `macos-computer-use-permissions.ts` and `src/main/ipc/mobile.ts`. Changing desktop alone **breaks desktop↔mobile pairing and macOS Computer-Use permission prompts** unless renamed together — this is the "do not do on desktop alone" trap in infra plan §11.4.

### Option C — Rename everything in one coordinated release
Benefit: the complete brand change.
Tradeoff: biggest single-change blast radius; couples three products (desktop + mobile + helper). Do this as a well-tested launch-cutover item, not a stray edit.

## Recommendation
**Option A now (display name = Fabrica everywhere user-visible), then coordinate the `appId`/bundle-id rename** (Option B) into a dedicated release that renames the mobile app and macOS helper in lockstep — this is the same release that handles items 08, 09, 12.

## ✅ DECIDED (2026-08-13)
**Option A — display-name rename implemented.** `productName`, Windows `executableName`, window title, About panel, app menu, tray tooltip, notifications, and the Codex client title are all `Fabrica`. `appId` / `appUserModelId` stay `com.stablyai.orca` until the coordinated bundle-id release. Linux `executableName: 'orca-ide'` stays (GNOME Orca conflict).

**Deferred to item 10 (install path):** the download artifact filenames — `orca-windows-setup.exe`, `orca-macos-${arch}.dmg`, `orca-linux*.deb`/`*.rpm`, `orca-ide_*` (`config/electron-builder.config.cjs:317,412,451-477`) — ship with the install-path/CLI rename.

Effort: Medium now. Value: the most visible win on the list.