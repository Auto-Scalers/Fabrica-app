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
| A2 | Firewall rule display name (`Orca Mobile Pairing`) | **TODO** | Rename in lockstep with mobile app + Computer Use helper |
| A3 | Computer Use helper app name (`Orca Computer Use.app`) | **PARTIAL** | Name change planned; packaging config, signing, permission-detection not started. Bundle ID deferred to Group D |

---

## Group B — CLI & Install Paths (ship together)

| # | Task | Status | Notes |
|---|------|--------|-------|
| B1 | CLI command rename (`orca` → `fabrica`) | **TODO** | Full rename + thin `orca` shim for backward compat. Covers help text, error prose, 8 skill guides, installer/PATH, `package.json` bin, all tests |
| B2 | Install paths (`Program Files\Orca Dev` → `Fabrica Dev`) | **TODO** | Windows installer paths, packaged launchers, artifact filenames (`orca-windows-setup.exe` → `fabrica-windows-setup.exe`), uninstaller |
| B3 | Environment variables (`ORCA_*` → `FABRICA_*`) | **PARTIAL** | ~400+ vars, ~2700 occurrences. Planning done, implementation in progress. Ships with B1, B2, B4 |
| B4 | Git co-author trailer (`Co-authored-by: Orca <help@stably.ai>`) | **TODO** | Use `fabrica.studio.contact@gmail.com` as support email. Ships with B1, B2, B3 |

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
| D1 | Plugin `engines.orca` field → `engines.fabrica` | **TODO** | All plugin manifests must update compatibility field |
| D2 | Plugin publisher rename (`stablyai` → `autoscalers`) | **TODO** | Marketplace trust constants, plugin IDs, bundled plugin directories |
| D3 | Plugin marketplace repos on GitHub | **VERIFY** | `Auto-Scalers/Fabrica-plugins` created |
| D4 | Plugin kill-list URL (`onorca.dev` → `fabrica-ai.vercel.app`) | **TODO** | Update endpoint in code |
| D5 | Bundled plugin content hashes | **TODO** | Recompute after manifest changes |

---

## Rebranding — Orca → Fabrica (General)

These are NOT grouped — they're ongoing sweeps across the codebase.

### Source Code Renames

| Area | What | Status | Notes |
|------|------|--------|-------|
| GitHub org + repo refs | `stablyai/orca` → `Auto-Scalers/Fabrica-app` | **PARTIAL** | Many refs updated; ~100+ CI workflow refs still say `stablyai/fabrica-*` |
| `orca://` deep link | → `fabrica://` | **TODO** | String rename across code + tests. No OS-level registration found. |
| PostHog env vars | `ORCA_POSTHOG_WRITE_KEY` → `FABRICA_POSTHOG_WRITE_KEY` | **TODO** | Env-injected at build time. Secret already set in GitHub Actions. |
| Diagnostics env vars | `ORCA_DIAGNOSTICS_*` → `FABRICA_DIAGNOSTICS_*` | **TODO** | Token URL + disabled flag |
| Build identity env var | `ORCA_BUILD_IDENTITY` → `FABRICA_BUILD_IDENTITY` | **TODO** | Official-build gate. Secret already set in GitHub Actions. |
| Attribution footer | `Made with Orca` → `Made with Fabrica` | **TODO** | `terminal-attribution.ts` |
| Product URL | `ORCA_PRODUCT_URL` → Fabrica URL | **TODO** | Various files |
| Feature wall docs URLs | `www.onFABRICA.dev/docs` | **VERIFY** | Already points to Fabrica domain |

### Backend Endpoints to Rebuild

| Endpoint | Current | Target | Status |
|----------|---------|--------|--------|
| Auth | `login.onorca.dev` | `fabrica-ai.vercel.app/api/auth/*` | **TODO** — client code exists, need server (Fabrica-web) |
| Relay | `relay.onorca.dev` | `fabrica-ai.vercel.app/api/relay` or Fly.io | **TODO** — WebSocket relay server needed |
| Share | `share.onorca.dev` | `fabrica-ai.vercel.app/api/share/*` | **TODO** — client code exists, need server (Fabrica-web) |
| Diagnostics | `www.onorca.dev/diagnostics/token` | `fabrica-ai.vercel.app/api/diagnostics/*` | **TODO** (Fabrica-web) |
| Changelog | `onorca.dev/whats-new/changelog.json` | `fabrica-ai.vercel.app/whats-new/changelog.json` | **TODO** — static JSON (Fabrica-web) |
| Plugin kill-list | `onorca.dev/plugins/kill-list.json` | `fabrica-ai.vercel.app/plugins/kill-list.json` | **TODO** — static JSON (Fabrica-web) |
| Docs | `www.onorca.dev/docs` | `fabrica-ai.vercel.app/docs` | **TODO** (Fabrica-web) |

### Localized READMEs (5 languages)

| File | Old URLs | Status |
|------|----------|--------|
| `docs/readme/README.zh-CN.md` | `onorca.dev`, `stablyai/orca` | **TODO** |
| `docs/readme/README.pt.md` | `onorca.dev`, `stablyai/orca` | **TODO** |
| `docs/readme/README.ko.md` | `onorca.dev`, `stablyai/orca` | **TODO** |
| `docs/readme/README.ja.md` | `onorca.dev`, `stablyai/orca` | **TODO** |
| `docs/readme/README.fr.md` | `onorca.dev`, `stablyai/orca` | **TODO** |
| `.github/CONTRIBUTING.md` | `stablyai/orca` | **TODO** |
| `WINDOWS_SETUP_GUIDE.md` | Orca references | **TODO** |

### CI/CD Workflows (`.github/workflows/`)

| File | Old Reference | Status |
|------|--------------|--------|
| `hourly-mac-build.yml` | `stablyai/fabrica-hourly` | **TODO** |
| `daily-mac-build.yml` | `stablyai/fabrica-daily` | **TODO** |
| `adhoc-mac-build.yml` | `stablyai/fabrica-adhoc` | **TODO** |
| `release-cut.yml` | `stablyai/fabrica`, SignPath slug `orca` | **TODO** |
| `release-mac-build.yml` | `stablyai/fabrica` | **TODO** |
| `release-policy.yml` | `stablyai/fabrica` | **TODO** |
| `readme-downloads-badge.yml` | `stablyai/fabrica` | **TODO** |
| `homebrew-bump.yml` | `stablyai/fabrica`, `stablyai/homebrew-orca` | **TODO** |

### i18n Locale Files

- `en.json` — **621** occurrences of "Orca" (user-visible product name)
- All other locales (ko, ja, zh, es) — similar volume
- **Status:** **TODO** — rename "Orca" → "Fabrica" in visible copy, preserve i18n keys and `orca://` identifiers

### Homebrew Casks

| File | What | Status |
|------|------|--------|
| `Casks/fabrica.rb` | Homepage `onfabrica.dev`, artifact names | **TODO** |
| `Casks/fabrica@rc.rb` | Same | **TODO** |

---

## Visual Palette Migration

- [ ] Capture aesthetic reference from `Fabrica-web/` (landing page is the visual source)
- [ ] Visual palette migration — extract from `Fabrica-web/`, audit Orca app, apply consistently
- [ ] Clean build verification after each migration step

**Goal:** When someone looks at the new Fabrica app, they should not recognize it was built on top of Orca.

---

## Configs & Distribution Migration

- [ ] Configs migration — metadata, distribution configs, app identifiers
- [ ] Auto-updater & releases — point to `Auto-Scalers/Fabrica-app` repo
- [ ] Deep linking — rename `orca://` protocol handlers to `fabrica://`

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

- [~] Wire tokens (`fabrica_server_ready`)
- [~] Keychain service name
- [~] TLS certificate CN
- [~] App name / productName / About / app menu
- [~] Feature wall docs URLs
- [~] Plugin marketplace repos created
- [ ] Support email confirmed: `fabrica.studio.contact@gmail.com`
- [ ] App ID confirmed: `ai.autoscalers.fabrica`

---

_Consolidated: Aug 2026. Original files in `.Fabrica-app-board/` and `identifier-rename-review/` are now deleted._
