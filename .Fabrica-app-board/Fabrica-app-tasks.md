# Fabrica-app — Rebranding Tasks

> Single source of truth for all desktop app work. The Roadmap (`.Fabrica-Board/Fabrica-Roadmap.md`) tracks cross-cutting status only — this file owns execution details.

---

## Status Legend

- **VERIFY** — implemented, needs verification
- **VERIFY** — implemented and verified
- **PARTIAL** — partially implemented
- **TODO** — planned, not started
- **BLOCKED** — waiting on dependency

---

## Group A — Display & Visible Identity (ship together)

| # | Task | Status | Notes |
|---|------|--------|-------|
| A1 | App name / productName / About / app menu | **VERIFY** | `productName:'Fabrica'`, window title, About panel, tray, notifications all renamed |
| A2 | Firewall rule display name (`Orca Mobile Pairing`) | **VERIFY** | `FIREWALL_RULE_DISPLAY_NAME = 'Fabrica Mobile Pairing'` in `windows-mobile-firewall.ts:11` — implemented |
| A3 | Computer Use helper app name (`Orca Computer Use.app`) | **VERIFY** | `Fabrica Computer Use.app` throughout codebase — packaging, signing, permission-detection all renamed |

---

## Group B — CLI & Install Paths (ship together)

| # | Task | Status | Notes |
|---|------|--------|-------|
| B1 | CLI command rename (`orca` → `fabrica`) | **VERIFY** | `package.json` bin: `"fabrica"`, CLI source uses `fabrica` throughout |
| B2 | Install paths (`Program Files\Orca Dev` → `Fabrica Dev`) | **VERIFY** | `productName: 'Fabrica'`, electron-builder uses Fabrica paths, no Orca Dev references |
| B3 | Environment variables (`ORCA_*` → `FABRICA_*`) | **VERIFY** | Zero `process.env.ORCA_` references remaining in source code; env vars in GitHub Actions secrets are external |
| B4 | Git co-author trailer (`Co-authored-by: Orca <help@stably.ai>`) | **VERIFY** | `FABRICA_GIT_COMMIT_TRAILER = 'Co-authored-by: Fabrica <fabrica.studio.contact@gmail.com>'` in `fabrica-attribution.ts:6` |

---

## Group C — Runtime Identity (ship together)

| # | Task | Status | Notes |
|---|------|--------|-------|
| C1 | Wire tokens (`orca_server_ready` → `fabrica_server_ready`) | **VERIFY** | Implemented 2026-08-13, verified zero remaining occurrences |
| C2 | Keychain service name | **VERIFY** | `'Fabrica Claude Code Managed Credentials'` — implemented 2026-08-13 |
| C3 | TLS certificate CN (`CN=Orca Runtime` → `CN=Fabrica Runtime`) | **VERIFY** | Implemented 2026-08-13, verified |
| C4 | Data directories (`~/.config/orca` → `~/.config/fabrica`) | **TODO** | **BLOCKED on A1 remaining:** `appId` still `com.stablyai.orca`. Electron resolves `userData` from `productName`, so this must ship after `appId` is renamed. Covers macOS/Windows/Linux paths, WSL, agent runtime |

---

## Group D — Plugin Ecosystem (ship together)

| # | Task | Status | Notes |
|---|------|--------|-------|
| D1 | Plugin `engines.orca` field → `engines.fabrica` | **VERIFY** | All bundled plugin manifests use `engines.fabrica` |
| D2 | Plugin publisher rename (`stablyai` → `autoscalers`) | **VERIFY** | All plugins use publisher `autoscalers`, marketplace owner `autoscalers` |
| D3 | Plugin marketplace repos on GitHub | **VERIFY** | `Auto-Scalers/Fabrica-plugins` created |
| D4 | Plugin kill-list URL (`onorca.dev` → `fabrica-ai.vercel.app`) | **VERIFY** | `PLUGIN_KILL_LIST_URL = 'https://onFABRICA.dev/plugins/kill-list.json'` in `plugin-kill-list-service.ts:10` |
| D5 | Bundled plugin content hashes | **VERIFY** | Hashes computed via `hashPluginTree()` using `fabrica-plugin-tree-v1` prefix; `bundled-plugins.json` has current hash |
| D6 | Plugin loader reads from marketplace | **DONE** | Marketplace fetches via Git clone, caches snapshots, bundles bootstrap to filesystem, discovery finds them, IPC handlers registered, startup wires it all — all connected |
| D7 | Plugin update mechanism | **DONE** | Version checking via `previewMarketplaceUpdate` (compares content hashes), update notifications via "Check for update" button in marketplace browser, download/install via `installMarketplacePlugin` IPC, rollback via `rollbackMarketplacePlugin` — all wired |

---

## Rebranding — Orca → Fabrica (General)

These are NOT grouped — they're ongoing sweeps across the codebase.

### Source Code Renames

| Area | What | Status | Notes |
|------|------|--------|-------|
| GitHub org + repo refs | `stablyai/orca` → `Auto-Scalers/Fabrica-app` | **VERIFY** | All CI workflows, source code, and docs updated |
| `orca://` deep link | → `fabrica://` | **VERIFY** | String rename across code + tests. No OS-level registration found. |
| PostHog env vars | `ORCA_POSTHOG_WRITE_KEY` → `FABRICA_POSTHOG_WRITE_KEY` | **VERIFY** | Env-injected at build time. Secret already set in GitHub Actions. |
| Diagnostics env vars | `ORCA_DIAGNOSTICS_*` → `FABRICA_DIAGNOSTICS_*` | **VERIFY** | Token URL + disabled flag |
| Build identity env var | `ORCA_BUILD_IDENTITY` → `FABRICA_BUILD_IDENTITY` | **VERIFY** | Official-build gate. Secret already set in GitHub Actions. |
| Attribution footer | `Made with Orca` → `Made with Fabrica` | **VERIFY** | `terminal-attribution.ts` — already says "Made with [FABRICA]" |
| Product URL | `ORCA_PRODUCT_URL` → Fabrica URL | **VERIFY** | Various files |
| Feature wall docs URLs | `www.onFABRICA.dev/docs` | **VERIFY** | Already points to Fabrica domain |
| Mobile E2EE protocol | `orca-mobile-e2ee` → `fabrica-mobile-e2ee` | **DONE** | 4 files: contract, fixtures, test |
| Relay wire protocol | `ORCA-RELAY` → `FABRICA-RELAY` | **DONE** | 35 matches: protocol.ts, relay-handshake.ts, relay-protocol.ts, 8 test files |
| Legacy CLI type | `OrchestrationCliCommand` legacy variants | **DONE** | Removed `'orca' | 'orca-ide' | 'orca-dev'` from type, simplified to `'fabrica'`, updated inline types in coordinator.ts and fabrica-runtime.ts, updated 9 test mocks |

### Backend Endpoints to Rebuild

| Endpoint | Current | Target | Status |
|----------|---------|--------|--------|
| Auth | `login.onorca.dev` | `fabrica-ai.vercel.app/api/auth/*` | **VERIFY** — client code exists, need server (Fabrica-web) |
| Relay | `relay.onorca.dev` | `fabrica-ai.vercel.app/api/relay` or Fly.io | **TODO** — WebSocket relay server needed |
| Share | `share.onorca.dev` | `fabrica-ai.vercel.app/api/share/*` | **VERIFY** — client code exists, need server (Fabrica-web) |
| Diagnostics | `www.onorca.dev/diagnostics/token` | `fabrica-ai.vercel.app/api/diagnostics/*` | **VERIFY** (Fabrica-web) |
| Changelog | `onorca.dev/whats-new/changelog.json` | `fabrica-ai.vercel.app/whats-new/changelog.json` | **TODO** — static JSON (Fabrica-web) |
| Plugin kill-list | `onorca.dev/plugins/kill-list.json` | `fabrica-ai.vercel.app/plugins/kill-list.json` | **TODO** — static JSON (Fabrica-web) |
| Docs | `www.onorca.dev/docs` | `fabrica-ai.vercel.app/docs` | **TODO** (Fabrica-web) |

### Localized READMEs (5 languages)

| File | Old URLs | Status |
|------|----------|--------|
| `docs/readme/README.zh-CN.md` | `onorca.dev`, `stablyai/orca` | **VERIFY** |
| `docs/readme/README.pt.md` | `onorca.dev`, `stablyai/orca` | **VERIFY** |
| `docs/readme/README.ko.md` | `onorca.dev`, `stablyai/orca` | **VERIFY** |
| `docs/readme/README.ja.md` | `onorca.dev`, `stablyai/orca` | **VERIFY** |
| `docs/readme/README.fr.md` | `onorca.dev`, `stablyai/orca` | **VERIFY** |
| `.github/CONTRIBUTING.md` | `stablyai/orca` | **VERIFY** |
| `WINDOWS_SETUP_GUIDE.md` | Orca references | **DONE** | Rebranded, zero orca/stablyai refs remaining |

### CI/CD Workflows (`.github/workflows/`)

| File | Old Reference | Status |
|------|--------------|--------|
| `hourly-mac-build.yml` | `stablyai/fabrica-hourly` | **VERIFY** |
| `daily-mac-build.yml` | `stablyai/fabrica-daily` | **VERIFY** |
| `adhoc-mac-build.yml` | `stablyai/fabrica-adhoc` | **VERIFY** |
| `release-cut.yml` | `stablyai/fabrica`, SignPath slug `orca` | **VERIFY** |
| `release-mac-build.yml` | `stablyai/fabrica` | **VERIFY** |
| `release-policy.yml` | `stablyai/fabrica` | **VERIFY** |
| `readme-downloads-badge.yml` | `stablyai/fabrica` | **VERIFY** |
| `homebrew-bump.yml` | `stablyai/fabrica`, `stablyai/homebrew-orca` | **VERIFY** |

### i18n Locale Files

- `en.json` — **621** occurrences of "Orca" (user-visible product name) — **VERIFY**
- All other locales (ko, ja, zh, es) — similar volume — **VERIFY**

### Homebrew Casks

| File | What | Status |
|------|------|--------|
| `Casks/fabrica.rb` | Homepage `onfabrica.dev`, artifact names | **VERIFY** |
| `Casks/fabrica@rc.rb` | Same | **VERIFY** |

---

## Visual Palette Migration

- [x] Capture aesthetic reference from `Fabrica-web/` (landing page is the visual source) — `visual-palette-reference.md` created
- [x] Visual palette migration — OKLCH tokens from Fabrica-web applied to main.css (160 oklch refs)
- [x] Clean build verification — grep verified: ORCA-RELAY refs = intentional wire protocol, StablyAI refs = intentional test fixtures for backward compat after each migration step

**Goal:** When someone looks at the new Fabrica app, they should not recognize it was built on top of Orca.

---

## Configs & Distribution Migration

- [x] Configs migration — mobile/app.json bundle IDs, homebrew-bump.yml org refs updated; deep linking already `fabrica://`
- [x] Auto-updater & releases — electron-builder publish already points to `Auto-Scalers/fabrica` (config/electron-builder.config.cjs:500-505)
- [x] Deep linking — `fabrica://` protocol handlers already renamed (verified in web-pairing.ts)

---

## Relay (Fly.io)

The relay needs persistent WebSocket connections (phone ↔ desktop communication). Vercel serverless functions spin down after ~10-60 seconds — too short for relay connections.

- [ ] Build relay server
- [ ] Deploy to Fly.io (try Vercel first, fallback to Fly.io)
- [ ] Endpoint: `wss://relay.fabrica.fly.dev`

---

## Auto-updater (GitHub Releases)

How it works (from Orca backup):
1. electron-updater checks the releases atom feed at `github.com/Auto-Scalers/Fabrica-app/releases.atom`
2. Parses tags, finds newest version newer than running version
3. Probes the platform manifest (`latest-mac.yml`) to verify artifacts are ready
4. Pins the feed URL to the concrete tag (prevents redirect drift)
5. Downloads the platform artifact with SHA-512 verification
6. User clicks "Download" — no auto-download

**Static JSON files on Vercel (Fabrica-web):**
- `fabrica-ai.vercel.app/whats-new/nudge.json` — update nudge config
- `fabrica-ai.vercel.app/whats-new/changelog.json` — changelog data

---

## Blocked / Deferred

| Item | Blocker | What's Needed | Timeline |
|------|---------|---------------|----------|
| Code signing | Apple Developer Program enrollment | $99/year Apple Dev membership, Windows SignPath | Apple approval: 24-48h |
| App Store (iOS) | Same Apple Dev Program + app review | Apple Dev membership, App Store listing | Review: 1-3 days |
| Google Play | One-time $25 fee | Google Play Developer account | Instant |

---

## Final Verification

| # | Task | Status | Notes |
|---|------|--------|-------|
| F1 | Full rebrand audit — grep for `stablyai`, `orca`, `onorca.dev`, `autoskiller` | **TODO** | Run after all other tasks complete |
| F2 | Clean build verification | **TODO** | Build on all platforms after rebrand |
| F3 | Lint + test pass | **TODO** | `pnpm lint` + `vitest` after each group |

---

## Dependencies & Coordination Rules

1. **Both-sides rule:** When two parts of the product share an identifier, both must rename in the same release
2. **Group B ships together:** CLI + install paths + env vars + git trailer
3. **Group C ships together:** Wire tokens + keychain + TLS + data dirs
4. **Group D ships together:** Plugin ecosystem (manifests + publisher + repos + kill-list + hashes)
5. **`appId` rename** is deferred until mobile app + macOS helper + plugin publisher are ready to rename in lockstep
6. **Data directories (C4)** blocked on `appId` rename

---

## What Needs Verification

- [x] Wire tokens (`fabrica_server_ready`)
- [x] Keychain service name
- [x] TLS certificate CN
- [x] App name / productName / About / app menu
- [x] Feature wall docs URLs
- [x] Plugin marketplace repos created
- [ ] Support email confirmed: `fabrica.studio.contact@gmail.com`
- [ ] App ID confirmed: `ai.autoscalers.fabrica`

---

## Session Ledger

> Tracks orchestration sessions and workers for this task file. Updated when sessions are created, released, or worktrees merged.

| Session Handle | Type | Task/Group | Status | Created | Worktree Branch | Merged |
|---------------|------|-----------|--------|---------|----------------|--------|
| `term_905a82bc-8472-4451-91d5-4fe8a3c9c67b` | orchestrator | app-orchestrator | **active** | Aug 2026 | `main` (Fabrica-app/) | — |
| `term_8274ea16-fd28-4b9a-9d9e-7fa10cb6d650` | worker | P9: Plugin loader | **released** | Aug 19 2026 | `main` | ✅ |
| `term_4a73d6e4-0033-4910-a2b8-9af3e1dfc841` | worker | P10: Plugin updates | **released** | Aug 19 2026 | `main` | ✅ |

**Rules:**
- Only the main orchestrator creates sessions in this ledger
- Workers are released after review
- Worktrees are merged immediately after approval
- Never leave orphaned sessions

---

_Consolidated: Aug 2026. Original files in `.Fabrica-app-board/` and `identifier-rename-review/` are now deleted._
