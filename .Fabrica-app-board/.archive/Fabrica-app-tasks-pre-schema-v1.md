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
| C4 | Data directories (`~/.config/orca` → `~/.config/fabrica`) | **DONE** | Audit complete: data-dir rename already done in prior rebrand. Fixed stale `.gitattributes` ref (`orca-dev.mjs` → `fabrica-dev.mjs`). `orca://` deep-link and `orca-browser` mobile link left for runtime-identity owner (out of C4 scope). |

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
| Relay | `relay.onorca.dev` | Cloudflare Workers + Durable Objects (Fabrica-relay, `relay.onfabrica.dev`) | **DONE** — BOM fixed in 3 entry files, esbuild added as devDep, build succeeds for all 6 targets + WSL. Server itself is greenfield in `Fabrica-relay/` |
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

## Relay (Cloudflare Workers + Durable Objects)

The relay needs persistent WebSocket connections (phone ↔ desktop communication). Vercel serverless functions spin down after ~10-60 seconds — too short for relay connections. **Decision (2026-08-19): Cloudflare Workers + Durable Objects (WebSocket Hibernation) + Hono + Supabase auth, $0/mo. See `Fabrica-relay/.Fabrica-relay-board/Fabrica-relay-tasks.md` for full spec.**

- [x] Build relay server — BOM stripped from 3 entry files, esbuild added, build succeeds (linux-x64, linux-arm64, darwin-x64, darwin-arm64, win32-x64, win32-arm64, WSL)
- [x] Deploy relay server (Cloudflare) — **DONE** (2026-08-21): live at `https://fabrica-relay.fabrica-relay.workers.dev`. Server implemented in `Fabrica-relay/` (R1–R30 complete). Auth via Supabase JWT (`FABRICA_RELAY_JWT_SECRET` = Supabase legacy JWT secret, verified working).
- [x] Endpoint: `wss://fabrica-relay.fabrica-relay.workers.dev` (deployed; single hub DO today — multi-host scaling tracked as R31 in `Fabrica-relay/`)
- [x] **Relay auth → Supabase (additive wiring, 2026-08-21):** App now prefers a Supabase session access token as `Authorization: Bearer <token>` to `POST /v1/assign` (and the control-channel `openInitial`). New module `src/main/runtime/relay/supabase-session.ts` (`getRelayAuthToken()` prefers Supabase, falls back to the existing FABRICA Cloud `relayToken` so legacy behavior is preserved). `@supabase/supabase-js@^2.112.3` added; reuses the **same Supabase project as the web landing page** (`xoynlmscwkimaopkavkj.supabase.co`) via `SUPABASE_URL`/`SUPABASE_ANON_KEY` env (with `NEXT_PUBLIC_*` fallbacks). FABRICA Cloud auth code left fully intact. Typecheck: 0 new errors (7 pre-existing, unrelated rebrand literal mismatches in test files). **NOT yet functional end-to-end** because no Supabase *session* exists yet — see follow-ups.
  - [ ] **Follow-up A — Supabase login UI:** add a real Supabase sign-in so a session (and thus access token) actually exists. Today `getSupabaseAccessToken()` returns null, so the app behaves exactly as before (FABRICA Cloud fallback).
  - [ ] **Follow-up B — Packaged-app env wiring:** `process.env` is not populated in a packaged build; inject `SUPABASE_URL`/`SUPABASE_ANON_KEY` at launch (electron-vite `define`/`env`) before this works outside dev.
  - [ ] **Follow-up C (optional):** short-circuit `relay-auth-coordinator.refreshAccessToken` to skip the FABRICA Cloud exchange when a Supabase session exists.

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
| F2 | Clean build verification | **DONE** | `pnpm install` + `build:electron-vite` + `build:cli` + `build:relay` all succeed (2026-08-19). Fixed 56 files committed as CP1252 instead of UTF-8; fixed rebrand corruption `ErrorCard`→`ErrFABRICArd` in 4 files. |
| F3 | Lint + test pass | **IN PROGRESS** | Native audit ✅, type-aware audit ✅, full lint running. Terminal: `term_3a509e7c` |

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
| `term_3a509e7c-9707-4e2f-a5d9-ea63bef461dd` | worker | F3: Lint + test | **dead (hung, untracked)** | Aug 19 2026 | `main` | — |
| `term_c9c2b8b0-5b83-4354-9617-0b5f4684cb7f` | worker | F3: Lint + test (resume) — run `run_effeaea830f9`, task `task_e88d00622ee7`, dispatch `ctx_059aabe19076` | **active** | Aug 21 2026 | `main` | — |
| `term_902347ed-b35a-48f2-9a7d-de6fca23cd98` | worker | I18N locale rebrand — dispatch `ctx_71dc55bb3835` | **dead (exited, abandoned)** | Aug 21 2026 | `main` | — |
| `term_28fbdf34-7786-47e7-9fcd-0ed0d396c810` | worker | I18N locale rebrand (retry) — run `run_effeaea830f9`, task `task_b2bb44b3ee48`, dispatch `ctx_b1bde2138cd6` | **done** (verified: 0 Orca in en.json) | Aug 21 2026 | `main` | — |
| `term_9c6383f5-35bf-4f6a-b188-0668b25441a2` | worker | CI workflows + casks (restore) — dispatch `ctx_0e48e17b76ab` | **active** | Aug 22 2026 | `main` | — |
| `term_20b4ac81-4ebe-4094-a4dc-6b64fff6fb1a` | worker | Relay auth Supabase (restore) — dispatch `ctx_2b974273b120` | **active** | Aug 22 2026 | `main` | — |
| `term_f6fc6cac-6485-47e2-9fd2-2da3426772e9` | worker | F3 lint+test (restore) — dispatch `ctx_d7f4b48caad8` | **active** | Aug 22 2026 | `main` | — |

> Note (2026-08-22): user closed worker terminals; all 3 in-flight tasks restored with fresh terminals and briefs re-sent. Earlier sessions for these tasks exited when terminals closed; partial work preserved on disk and briefed as resume.
| `term_125bd373-7e8d-4e06-90f7-4e80f2d26cdf` | worker | Relay auth: Supabase login UI + env wiring — run `run_effeaea830f9`, task `task_d52a1cf64012`, dispatch `ctx_dd2d7a1004e7` | **active** | Aug 21 2026 | `main` | — |
| `term_338ce564-5fed-4561-a953-f9fc1b05458f` | worker | Localized READMEs + CONTRIBUTING — run `run_effeaea830f9`, task `task_9cb7bbdbcf1c`, dispatch `ctx_83405cc2fca2` | **active** | Aug 21 2026 | `main` | — |
| `term_d9ce6167-c30a-400e-bfee-2c3b2e3d71fd` | worker | CI workflows + Homebrew casks — run `run_effeaea830f9`, task `task_c0a8338fc306`, dispatch `ctx_0dc299947cac` | **active** | Aug 21 2026 | `main` | — |

> Note (2026-08-21): `dispatch --inject` prompts are not reaching OpenCode TUIs in this environment; task briefs were delivered via `terminal send` instead. Dispatch IDs remain valid for lifecycle routing.
| `term_40b146e5-76d6-42b8-87b2-fec024cdccd8` | worker | F2: Build verification | **done** | Aug 19 2026 | `main` | — |

**Rules:**
- Only the main orchestrator creates sessions in this ledger
- Workers are released after review
- Worktrees are merged immediately after approval
- Never leave orphaned sessions

---

_Consolidated: Aug 2026. Original files in `.Fabrica-app-board/` and `identifier-rename-review/` are now deleted._
