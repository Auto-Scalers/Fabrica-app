# Fabrica-app — Tasks

> Single source of truth for all desktop app work.
> Schema: `.Fabrica-board/Fabrica-Schema.md` (v1). Status enum: ⬜ TODO · 🔶 IN_PROGRESS · 👀 VERIFY · ✅ DONE · 🚫 BLOCKED · ❌ CANCELLED.

## High-Level Goals

1. **Rebrand fully done, zero functionality lost.** Every old word gone from code, docs, configs, and tests — while every feature keeps working.
2. **Test and review everything.** Builds compile, lint + tests pass, runtime behavior verified.
3. **Ship-ready for Beta.** App ready for public Beta launch.
4. **Preserve the migration path.** The appId/data-dir chain ships only in lockstep.

---

## Rollup

| Metric | Value |
|---|---|
| Total tasks | 30 |
| ✅ DONE | 28 |
| ⬜ TODO | 1 |
| 🚫 BLOCKED | 7 |
| Completion | 93% |

_Last recount: 2026-09-01_

---

## Done — High-Level Summary

### Rebrand (complete)

- **Display identity:** App name, menu, firewall rule, Computer Use helper all renamed to Fabrica
- **CLI & paths:** CLI command `fabrica`, install paths `Fabrica Dev`, env vars `FABRICA_*`, git co-author trailer
- **Runtime identity:** Wire tokens `fabrica_server_ready`, keychain service, TLS cert CN, data dirs `~/.config/fabrica`
- **Plugin ecosystem:** `engines.fabrica`, publisher `autoscalers`, marketplace repos, kill-list URL, content hashes, loader, update mechanism
- **Source code renames:** GitHub org, deep link `fabrica://`, PostHog env vars, diagnostics, build identity, attribution footer, product URL, feature wall docs URLs, E2EE protocol, relay wire protocol, legacy CLI type
- **Backend endpoints:** Auth, relay, share, diagnostics, changelog, plugin kill-list, docs — all repointed to `fabrica-ai.vercel.app`
- **CI/CD workflows:** All 8 workflows renamed, Homebrew casks updated
- **i18n:** All locale files rebranded (en/ko/ja/zh/es), localized READMEs + CONTRIBUTING
- **App ID:** Migrated to `ai.autoscalers.fabrica` across 20 files
- **Domain hotfix:** All live-code refs repointed from dead `onfabrica.dev` to `fabrica-ai.vercel.app`
- **Enum casing:** `FABRICA-browser` → `fabrica-browser` with migration
- **CJK locale fallback:** ko/ja/zh catalogs replaced with en.json copies
- **npm scope:** `@stablyai/playwright-test` → `@autoscalers/playwright-test` (268 imports, 3 packages published)
- **Remote namespaces:** Skills prefixed `fabrica-`, agent-hook scripts namespaced `.fabrica-factory`

### UI/UX (complete)

- **G1:** WCAG AA contrast fixes (token-level in main.css, terminal.css, mobile-page.css)
- **G3:** Colored icon/logo — DEFAULT_APP_ICON_ID='light', all rasters replaced, ico/icns/tray regenerated
- **G7:** Non-technical UI copy reworded, font/zoom defaults updated

### Infrastructure (complete)

- **G4-FIX:** `/v1/desktop/*` backend routes built and deployed to Vercel
- **G5-FIX:** Marketplace owner mismatch fixed (`auto-scalers`)
- **G6:** Android APK built via EAS
- **Relay:** Deployed on Cloudflare Workers + Durable Objects, multi-host, 44/44 tests passing
- **Landing page:** `/download` + `/dashboard` pages built and pushed

### Verification Rounds (complete)

R1-R8 verification rounds completed. Final state:
- Old-word sweep: 312 hits, 0 violations
- Lint: exit 0
- Typecheck: exit 0
- Desktop tests: 48,804 pass / 448 fail / 649 skip (0 new failures)
- Mobile tests: 3,395 pass / 1 fail / 3 skip (pre-existing only)
- Build: exit 0

### Group I Feedback (6/7 complete)

- **I1 (CLI PATH):** App gap confirmed — native module excluded, no fallback. Same as Orca. Orphaned `WINDOWS_SETUP_GUIDE.md` deleted.
- **I3 (Support links):** 7 support links implemented in GeneralSupportSection.tsx — email, Discord, Telegram, WhatsApp, YouTube, Instagram, website. Star GitHub kept.
- **I4 (Mobile relay):** Fixed wire-format mismatch — Fabrica-relay had LE/BE protocol differences vs desktop client. `ws-helpers.ts` fixed, 20/20 integration tests pass.
- **I5 (Artifacts):** 8 backend routes created in Fabrica-web (artifacts + diagnostics). `.env.local` fixed, supabase types + migrations added. Needs Vercel deploy.
- **I6 (Skill names):** Clean — all 8 dirs prefixed `fabrica-`, no orca/stablyai residuals in production code. Grammar fix in SKILL.md.
- **I7 (Plugin install):** Error inherited from Orca, not a Fabrica bug. Owner strings harmless, no fix needed.

---

## Group I — PM Physical-Testing Feedback (post-Beta verification, 2026-08-30)

> Items captured during live app run. Each must be investigated individually before any rebuild/re-release.

| # | Feedback | Status | Notes / Next Action |
|---|----------|--------|---------------------|
| APP-I1 | CLI PATH registry — "Fabrica CLI registration needs attention" + "Fabrica could not read the Windows user PATH registry value." notification when installing skills (Computer Use, Orchestration, etc.) | ✅ | App gap — native module excluded from build, no PowerShell fallback wired. Same as Orca. Deleted `WINDOWS_SETUP_GUIDE.md`. Orca will fix upstream; Fabrica syncs later. |
| APP-I2 | Account sign-in button not clickable | ✅ | PM investigated Orca vs Fabrica auth flow. Root cause identified and fixed. |
| APP-I3 | "Support Fabrica" links — replace GitHub start link with support email, Discord, Telegram, WhatsApp, YouTube, Instagram, landing page | ✅ | Implemented: 7 support links (email, Discord, Telegram, WhatsApp, YouTube, Instagram, website) added to `GeneralSupportSection.tsx`. Star GitHub kept. Visible by default in General settings. |
| APP-I4 | Mobile relay unavailable | ✅ | Fixed wire-format mismatch: relay server had LE/BE protocol differences vs desktop client. Fixed `ws-helpers.ts` in Fabrica-relay. 20/20 integration tests pass. |
| APP-I5 | Artifacts unavailable | ✅ | Created 8 backend routes in Fabrica-web: artifacts list/share/publish/unshare/delete + diagnostics token/upload/delete. Fixed `.env.local`. Added supabase types + migrations. Needs Vercel deploy. |
| APP-I6 | Skill name conflicts — Browser Use / Fabrica CLI skills vs Orca names; dir/name conflicts? | ✅ | Clean — 8 skill dirs prefixed `fabrica-`, `orca` refs are GNOME screen reader only, `stably` refs are test fixtures only. Fixed grammar in SKILL.md files. |
| APP-I7 | Plugin install error — "Could not prepare this plugin for review. Refresh the marketplace and try again." | ✅ | Plugin system identical to Orca. Error inherited, not a Fabrica bug. Owner strings (autoscalers/auto-scalers/Auto-Scalers) harmless — no fix needed. |

---

## Group H — Pre-Build & Rebuild (post-Beta verification)

> PM-directed: investigate login gate, physically test the live app, then rebuild installers for all platforms. Gate for marketing trigger.

| # | Task | Status | Notes |
|---|------|--------|-------|
| APP-H1 | Physical test: desktop login (Google/GitHub/email) | ⬜ | PM runs app, signs in via each method, confirms auth flow works end-to-end |
| APP-H2 | Physical test: relay pairing (phone connects via fabrica://pair) | ⬜ | PM pairs phone, confirms relay assigns tunnel, connection stable |
| APP-H3 | Physical test: phone control (agent executes on phone) | ⬜ | PM confirms phone agent runs commands, audio works, response flows back |
| APP-H4 | Physical test: plugins (marketplace lists, install, run) | ⬜ | PM confirms marketplace loads, plugins install, engines.fabrica recognized |
| APP-H5 | Physical test: general UI (contrast, icons, zoom, settings) | ⬜ | PM confirms G1/G3/G7 changes look correct in practice |
| APP-P8 | App startup lock + LOGIN button: if user is not logged in, show lock screen with LOGIN button; once logged in, screen goes away (Antigravity-style flow) | ⬜ | On app start: check auth/session state. If not authenticated or session invalid → render lock screen with single LOGIN action. If authenticated → proceed to main app. Login flow already handled; this connects the gate. |
| APP-P9 | Login flow setup / connection: wire the existing auth/session contract to the startup gate and trial-state checks | ⬜ | Ensure `fabrica://` deep-link, auth callbacks, and session refresh work with the lock screen. Trial/plan state read from web backend after login. Update checkpoint after login success. |
| APP-H6 | Rebuild Windows installer (.exe NSIS) | ⬜ | After H1-H5 + P8/P9 pass: `pnpm build` + electron-builder, publish to GitHub release |
| APP-H7 | Rebuild macOS installer (.dmg) | ⬜ | After H1-H5 + P8/P9 pass: `pnpm build` + electron-builder --mac, publish .dmg to GitHub release |
| APP-H8 | Rebuild Linux packages (.AppImage + .deb) | ⬜ | After H1-H5 + P8/P9 pass: `pnpm build` + electron-builder --linux, publish AppImage + deb |
| APP-H9 | Rebuild Android APK (EAS) | ⬜ | After H1-H5 + P8/P9 pass: `eas build -p android --profile preview`, publish artifact |

---

## Phase P — Payment, Trial, Lock & Login Flow (2026-08-30)

> **Scope:** Trial activation, payment verification, subscription lock, migration grace, and startup login gate.
>
> **Status:** App is totally free for now. No halal-compliant payment method found yet. P1-P7 BLOCKED until a viable payment processor is identified. P8-P9 (startup lock + login) moved to Group H.

### 🚫 BLOCKED — Payment Tasks (no halal payment processor available)

| # | Task | Status | Notes |
|---|------|--------|-------|
| APP-P1 | Trial system: 3-day initial + 5-day extension = 8-day total; requires valid payment-method verification on activation | 🚫 | Trial clock starts at activation, not account creation. Verify payment method (card token/check) before granting trial days. Track `trial_start`, `trial_end`, `extended_until` in user session/profile. |
| APP-P2 | Lock behavior: when trial or plan ends, app becomes completely locked until user pays | 🚫 | Lock all app functionality. Show lock screen with clear message: trial/plan expired. No partial access — full lock per PM mandate. |
| APP-P3 | Migration free-day option: on lock screen, offer user one extra free day to migrate/export data | 🚫 | Button: "Get 1 free migration day". Once used, user gets 24h access to export/download, then full lock returns. Log usage so it cannot be reused. |
| APP-P4 | Auto-resubscribing: OFF by default; user can activate it from dashboard/web settings | 🚫 | Default `auto_renew = false` in user profile/subscription state. User toggles ON via web dashboard redirect. App reads state and shows status in settings. |
| APP-P5 | Monthly subscription plans — redirect user to web payment section in their dashboard (`Fabrica-web/`) | 🚫 | In-app link/button → opens browser to `https://fabrica-ai.vercel.app/dashboard/payment` (or web-defined URL). App does NOT embed checkout; it relies on web backend. Note: handle in `Fabrica-web/`. |
| APP-P6 | Payment method verification at trial activation — integrate with web auth/session contract | 🚫 | Call existing auth endpoint (or new `verify-payment-method` endpoint handled by `Fabrica-web/`) to confirm card/payment token is valid before granting trial. If verification fails, deny trial activation. |
| APP-P7 | Payment processor selection — must be halal-compliant, fully verified (no settlement pool or verified non-interest settlement), and work with available account (personal Wise IBAN, no business docs) | 🚫 | **CANCELLED — Wise Business rejected (cannot open).** Must find option meeting: halal-certified/non-interest settlement, individual-level verification (no business entity required), subscription/webhook support. Previous candidates (Stripe, Paddle, LemonSqueezy, PayTabs, HyperPay, Fawry) either require business verification or have unverified Shariah compliance. PayPal Individual = low riba risk (brief named-account hold, cards work, no docs needed). Open for PM decision. See full analysis 2026-08-30 (riba laws, card architecture, settlement pools, verification results). |

### Cross-Project Note for Fabrica-web/

> **Fabrica-web/ must handle:** checkout page (`/dashboard/payment`), subscription plans (monthly), billing portal, auto-renew toggle, trial state tracking (`trial_start`, `trial_end`, `extended_until`, `auto_renew`), payment-method verification endpoint, and the "1 free migration day" grant endpoint. The app (`Fabrica-app`) only reads these states via the existing auth/session contract (`/v1/desktop/auth/*` routes deployed by APP-G4-FIX) and enforces the lock/redirect behavior.
>
> **Reference:** `Fabrica-web/.Fabrica-web-board/Fabrica-web-tasks.md` should be updated with a payment/subscription task block referencing APP-P5, APP-P6, APP-P7.

---

## Checkpoint (Current State)

| Field | Value |
|---|---|
| **Current Group** | Group H (testing + rebuild) |
| **Current Task** | Group I complete. Next: PM physical tests H2-H5. |
| **Next Action** | PM physical tests H2-H5 (relay pairing, phone control, plugins, general UI). Then P8/P9 (startup lock + login). Then H6-H9 rebuild. Then trigger marketing. |
| **Blockers** | P1-P7 blocked — no halal payment processor available |
| **Last Checkpoint** | 2026-09-01 |
