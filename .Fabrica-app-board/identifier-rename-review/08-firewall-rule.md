# 08. Windows firewall rule — `Orca Mobile Pairing`

> **STATUS: ⏳ PLANNING — NOT DONE.** Option C decided; plan not finalized or implemented.

## What it is
To let the **mobile companion app** talk to the desktop over the local network, Windows needs an inbound firewall rule. Its display name (what users see in Windows Security → Firewall) is currently `Orca Mobile Pairing`.

## Where it lives
- `src/main/runtime/windows-mobile-firewall.ts:11` — `FIREWALL_RULE_DISPLAY_NAME = 'Orca Mobile Pairing'`

## Visible to users?
**Yes** — it appears in Windows Security / Firewall list where a tech-savvy user can see and toggle it.

## The 0-users impact
Zero — firewall rules are created fresh on each install; there are no installed rules to migrate.

## Options

### Option A — Rename now to `Fabrica Mobile Pairing` (Recommended)
Benefit: no "Orca" leaking in Windows Security.
Tradeoff: must keep the rule *name* consistent between create/delete/update code paths (same file, trivial). Also the rule matches the app by **program path or app identity** — if the executable is renamed to `Fabrica.exe` in the same release (item 07), the rule must point at the new exe path in lockstep.

### Option B — Keep `Orca Mobile Pairing`
Benefit: zero effort.
Tradeoff: permanent "Orca" in Windows Firewall — exactly the kind of mismatch a user spots.

### Option C — Rename only when the mobile app is renamed ✅ DECIDED
Benefit: keeps desktop↔mobile wiring in one change.
Tradeoff: defers a tiny rename; firewall rule display name is desktop-side only, so it doesn't strictly need to wait.

## ✅ DECIDED
**Option C — rename together with the mobile-app lockstep release.** Pair it with items 07/12 (the `Orca Computer Use.app`/bundle-id release) so the rule points at the correct `Fabrica.exe` in a single coordinated change. Low effort, deferred until the mobile/companion rename ships.

Effort: Low. Value: removes an obvious OS-level "Orca" sighting.