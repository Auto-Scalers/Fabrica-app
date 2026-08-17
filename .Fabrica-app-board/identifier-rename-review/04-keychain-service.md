# 04. Keychain service name — `Orca Claude Code Managed Credentials`

> **STATUS: ✅ IMPLEMENTED (2026-08-13).** `keychain.ts:5` → `'Fabrica Claude Code Managed Credentials'`; lint + `keychain.test.ts` pass.

## What it is
When a user signs in to a Claude Code account, the app stores the login token in the **macOS Keychain** (the system's secure password vault) under a *service name*. Right now that name is `Orca Claude Code Managed Credentials`. It's how macOS labels the entry in "Passwords" settings.

## Where it lives
- `src/main/claude-accounts/keychain.ts:5` — `ORCA_CLAUDE_SERVICE = 'Orca Claude Code Managed Credentials'`

## Visible to users?
Semi — a user glancing at macOS Keychain / Passwords would see the "Orca" label.

## The 0-users impact
**This is the item I previously warned could "log users out" — and that warning is now irrelevant.** Users get logged out *if* a stored token lives under the old name and the app suddenly looks under a new name. With **0 users, there are no stored tokens** → renaming is free, nobody gets logged out.

## Options

### Option A — Rename now to `Fabrica Claude Code Managed Credentials` (Recommended)
Benefit: correct name from day one; since no tokens exist yet, zero migration, zero logout risk.
Tradeoff: must rename the lookup AND the write in the same change (they're in the same file — trivial); old code reading the constant just works.

### Option B — Keep `Orca...`
Benefit: zero effort.
Tradeoff: users will one day see "Orca" in their Keychain and wonder why the app is called Fabrica. Awkward forever after launch.

### Option C — Rename later, at launch, with a credential-migration routine
Benefit: preserves tokens if some appear before launch.
Tradeoff: unnecessary complexity — 0 users means nothing to preserve.

## ✅ DECIDED
**Option A — rename now.** Free today (no tokens exist), and avoids a permanent "Orca" label in users' Keychains. Low effort, ~1 file + tests.

Note: the mobile companion app's codex/Claude sign-in mechanism uses a similar service; if the mobile app ever stores tokens under a separate service name, rename both in lockstep (see `12-computer-use-app.md` for the wiring rule).