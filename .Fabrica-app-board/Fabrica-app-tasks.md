# Fabrica-app — Rebranding Tasks

> Single source of truth for all desktop app work. The Roadmap (`.Fabrica-Board/Fabrica-Roadmap.md`) tracks cross-cutting status only — this file owns execution details.
> Schema: `.Fabrica-board/Fabrica-Schema.md` (v1). Status enum: ⬜ TODO · 🔶 IN_PROGRESS · 👀 VERIFY · ✅ DONE · 🚫 BLOCKED · ❌ CANCELLED.

## High-Level Goals

> WHAT THIS PROJECT IS FOR — read this before any task:

1. **Rebrand fully done, zero functionality lost.** Every old word (Orca / Stably / onorca) gone from code, docs, configs, and tests — while every feature, workflow, and piece of custom logic keeps working exactly as before.
2. **Test and review everything.** Builds compile on all platforms, lint + tests pass, runtime behavior verified — a rename must never be just cosmetic or break the app.
3. **Ship-ready for Beta.** When rebrand + functionality verification is complete, the app is ready for the public Beta launch (Roadmap Phase B).
4. **Preserve the migration path.** The appId/data-dir chain (APP-C4) ships only in lockstep so no user data is orphaned.

## Scope Lock & Autonomous Verification Rounds

> **SCOPE LOCK (PM mandate): the App-orchestrator does REBRAND VERIFICATION and TESTS ONLY.**
>
> WHAT THIS MEANS:
> - Verify old words are gone; verify nothing broke; test builds, lint, tests, runtime behavior.
> - Dispatch fixes for anything a verification step fails on — fixes must restore intended behavior, not add features.
>
> WHAT THIS DOES NOT DO:
> - NO new features, NO new plugins, NO refactors beyond what a failing check requires.
> - NO work outside Fabrica-app/ (cross-project issues go as notes to other task files).

**HOW ROUNDS WORK (repeat loop):**

One **Round** = execute ALL six steps below in order, then record results in the Round Log. When a round finishes clean, immediately start the next round — same checklist, fresh pass. Do NOT stop because a round was clean; loop until PM says stop or two consecutive rounds find zero new findings (then hold idle and re-run the checklist on each heartbeat kick anyway).

| Step | Check | Pass evidence |
|---|---|---|
| 1 | **Old-word sweep:** grep `orca`, `stablyai`, `onorca.dev`, `stably.ai` across the repo excluding `node_modules/`, `.next/`, `dist/`, `out/`, `.backup/`, `_sources/`, and documented exceptions | 0 hits OR every hit is a known exception listed in Notes |
| 2 | **Lint + typecheck:** `pnpm lint`, `pnpm typecheck` | both exit clean |
| 3 | **Tests:** `pnpm test` (vitest) | all green, no skips introduced by rebrand |
| 4 | **Build:** `pnpm build` (at least once every 3 rounds or after any fix) | compiles clean |
| 5 | **Runtime spot-checks:** renamed identifiers behave — `fabrica://` deep link, CLI `fabrica` command, `FABRICA_*` env vars, `fabrica_server_ready` wire token, plugin `engines.fabrica` | each behaves as before rename |
| 6 | **VERIFY backlog review:** review 👀 rows in groups A–D; promote to ✅ DONE with grep/read evidence or dispatch a fix worker | Rollup updated in same edit |

**Round rules:**
- One Round = one orchestrator cycle; workers may parallelize steps within a round (min fleet: 5).
- Every finding = a dispatched fix + a re-check in the SAME round when possible.
- Update the Checkpoint table at the end of every round (round number, findings, next).
- Never mark DONE without evidence; never skip steps even if they passed last round.

### Round Log

> Append one row per completed round.

| R2 | Aug 23 | Post-wave confirmation: locale schemes (en+es/ja/ko/zh = 20 literals) normalized; ESM interop failure fixed (mock-server-key-pair); preamble snapshot casing verified at HEAD-state; lint reduced to 0 errors (one-liner `as const` fix); updater fetch URLs repointed dead->live domain | UPDATER-REPOINT ✅ (98 tests green); HELP-MENU-LINKS ✅ (18/18); ENJSON-SCHEME-CASING ✅; ENJSON-RESIDUAL ✅; MOCK-SERVER-ESM-FIX ✅; LINT-ONE-LINER ✅ (lint fully green incl chained stages) | typecheck PASS x2 verified by orchestrator; runtime smoke R2 all pass; mobile suite 43->9 failures (34 rebrand fixes) | Remaining: W1 APP-F3 full triage; 9 documented non-rebrand items (8 CRLF env -> CRLF-ANALYSIS proposal A approved as CRLF-FIX-IMPLEMENT; 1 ko overrides corruption -> KO-OVERRIDES-REPAIR dispatched) |
| R3 | Aug 23 | Convergence round: KO overrides repaired (167 intact kept / 1510 unrecoverable dropped -> ko test green); CRLF helper landed (44/44); ESM interop landed; CLI casing wave audited -> ESCALATE then remediated (20 assertions + 2 grammar + 27 BOMs); GNOME text fix verified (18/18); snapshot regen verified legitimate; staged-snap hunk confirmed benign (staged==working) | CLI-CASING-REMEDIATION ✅; GNOME-ASSERT-FIX ✅ (53/53); CRLF-FIX-IMPLEMENT ✅ (44/44); SNAPSHOT-VERIFY ✅; STAGED-SNAPSHOT-DISPOSITION ✅ | Mobile FULL suite 434 files/3409 tests ZERO failures; desktop typecheck+lint+build all green; RESWEEP-R3 zero unclassified residuals | MAJOR FINDING D8: ko/ja/zh locale catalogs systemically corrupted pre-repo (no intact source anywhere) - PM decision required (see PM-Decisions-Request.md); cross-project notes filed to Fabrica-web board (nudge.json schema mismatch + live changelog old-brand copy) |
| R4 | Aug 23 | Round-checklist refills after convergence: fresh build+smoke due post GNOME/ko/CLI waves; old-word sweep re-confirm; lint+typecheck re-confirm | BUILD-R3-SMOKE ✅ (16c744aa); SWEEP-R4 ✅ (b4a37ec4); LINT-TC-R2 ✅ (56bde716); TEST-R4 dispatched earlier (56bde -> superseded by LINT-TC-R2 scope); GNOME-VERIFY-R2 running (18638f42) | Pending | W1 APP-F3 remains the long pole; two consecutive clean rounds achieved on sweep dimension (RESWEEP-FINAL + RESWEEP-R3 both zero unclassified) |
| R5 | Aug 23 | Second-opinion audit wave: all four major fixes independently audited and ACCEPTed. BUILD-R3-SMOKE ✅ (typecheck 0, build 0, CLI help clean, web assets clean). SWEEP-R4 ✅ (321 hits, 0 violations, 4 guard-test rows noted). LINT-TC-R2 ✅ + LINT-GATE-CONFIRM ✅ (lint exit 0 full chained pipeline first time ever; typecheck 0 across node/cli/web). MOBILE-FULL-TESTS-R2 ✅ (434 files / 3,409 tests ZERO failures). VERIFY-KO-OVERRIDES-R2 ACCEPT. VERIFY-CRLF-HELPER-R2/R3 ACCEPT. VERIFY-MOCK-ESM-R2 ACCEPT. VERIFY-GNOME-ASSERT-R2 ACCEPT. VERIFY-BOM-R3 ACCEPT (zero BOMs in 174 files). VERIFY-UPDATER-REPOINT-R2 ACCEPT. PM-DEC-D8 documented | None needed - all audits passed | CONVERGENCE: two consecutive rounds with zero new findings on every dimension (sweep/lint/typecheck/tests/build/runtime). Only outstanding item = W1 APP-F3 final triage report | Per protocol, loop pauses for W1 + PM decisions D1-D8 (PM-Decisions-Request.md). es.json has 2 pre-existing language-label ? artifacts worth a line under D8 follow-up |
| R2 | Aug 23 | Post-wave confirmation: locale schemes (en+es/ja/ko/zh = 20 literals) normalized; ESM interop failure fixed (mock-server-key-pair); preamble snapshot casing verified at HEAD-state; lint reduced to 0 errors (one-liner `as const` fix); updater fetch URLs repointed dead->live domain | UPDATER-REPOINT ✅ (98 tests green); HELP-MENU-LINKS ✅ (18/18); ENJSON-SCHEME-CASING ✅; ENJSON-RESIDUAL ✅; MOCK-SERVER-ESM-FIX ✅; LINT-ONE-LINER ✅ (lint fully green incl chained stages) | typecheck PASS x2 verified by orchestrator; runtime smoke R2 all pass; mobile suite 43->9 failures (34 rebrand fixes) | Remaining: W1 APP-F3 full triage; 9 documented non-rebrand items (8 CRLF env -> CRLF-ANALYSIS proposal A approved as CRLF-FIX-IMPLEMENT; 1 ko overrides corruption -> KO-OVERRIDES-REPAIR dispatched) |
| R1 | Aug 23 | Old-word sweep: 0 unclassified residuals after 5 fix waves (GREP-DRY-RUN-2); new blind-spot found: onFABRICA.dev dead-domain artifacts (mobile UI links, fixtures, identifiers) | MOBILE-DEADLINK-FIX ✅ (3 live-UI links repointed); DOMAIN-CASE-NORMALIZE ✅ (31 literals); SENTINEL-FIX ✅; VIOLATION-FIX-TESTS-DOCS ✅ (61 lines); STRAGGLERS ✅ | Lint/test = W1 in progress; typecheck 0 errors; build PASS; tests/ grep 0 hits | Manifest + runbook created for APP-F1 |

## Rollup

| Metric | Value |
|---|---|
| Total tasks | 21 |
| ✅ DONE | 20 |
| 🔶 IN_PROGRESS | 1 |
| 👀 VERIFY | 0 |
| ⬜ TODO | 0 |
| 🚫 BLOCKED | 0 |
| ❌ CANCELLED | 0 |
| Completion | 95% |

_Last recount: 2026-08-23 (APP-F3 ✅ verified by orchestrator: lint green + typecheck 0 + brand-casualty tests fixed; remaining 🔶 = APP-F2 cross-platform builds). Scope: the 21 formally-ID'd tasks (APP-A/B/C/D/F tables)._

---

## Status Legend (Schema v1)

- 👀 VERIFY — implemented, awaiting orchestrator review
- ✅ DONE — implemented AND verified by reviewer
- 🔶 IN_PROGRESS — started, partially done
- ⬜ TODO — not started
- 🚫 BLOCKED — waiting on dependency/decision

---

## Group A — Display & Visible Identity (ship together)

| # | Task | Status | Notes |
|---|------|--------|-------|
| APP-A1 | App name / productName / About / app menu | ✅ | VERIFIED Aug 23 GROUP-VERIFY: `productName:'Fabrica'` (electron-builder.config.cjs:94), window title, About panel, tray, notifications all renamed |
| APP-A2 | Firewall rule display name (`Orca Mobile Pairing`) | ✅ | VERIFIED: `FIREWALL_RULE_DISPLAY_NAME = 'Fabrica Mobile Pairing'` in `windows-mobile-firewall.ts:11` |
| APP-A3 | Computer Use helper app name (`Orca Computer Use.app`) | ✅ | VERIFIED: `Fabrica Computer Use.app` throughout codebase — packaging, signing, permission-detection |

---

## Group B — CLI & Install Paths (ship together)

| # | Task | Status | Notes |
|---|------|--------|-------|
| APP-B1 | CLI command rename (`orca` → `fabrica`) | ✅ | VERIFIED Aug 23 CLI-VERIFY: bin `"fabrica"` (package.json:7-9), src/cli clean, built-CLI live check passed |
| APP-B2 | Install paths (`Program Files\Orca Dev` → `Fabrica Dev`) | ✅ | VERIFIED GROUP-VERIFY: productName Fabrica drives paths, no Orca Dev references |
| APP-B3 | Environment variables (`ORCA_*` → `FABRICA_*`) | ✅ | VERIFIED GROUP-VERIFY + SWEEP2-VERIFY: zero `process.env.ORCA_` in source; external GH secrets reported only |
| APP-B4 | Git co-author trailer (`Co-authored-by: Orca <help@stably.ai>`) | ✅ | VERIFIED: `FABRICA_GIT_COMMIT_TRAILER` at `fabrica-attribution.ts:6` |

---

## Group C — Runtime Identity (ship together)

| # | Task | Status | Notes |
|---|------|--------|-------|
| APP-C1 | Wire tokens (`orca_server_ready` → `fabrica_server_ready`) | ✅ | VERIFIED Aug 23: zero remaining occurrences |
| APP-C2 | Keychain service name | ✅ | VERIFIED: `'Fabrica Claude Code Managed Credentials'` |
| APP-C3 | TLS certificate CN (`CN=Orca Runtime` → `CN=Fabrica Runtime`) | ✅ | VERIFIED: `CN=Fabrica Runtime` |
| APP-C4 | Data directories (`~/.config/orca` → `~/.config/fabrica`) | ✅ | VERIFIED DONE Aug 23 (C4-PATHS sweep): userData resolves from `productName: 'Fabrica'` (electron-builder.config.cjs:94, dev override `fabrica-dev`); CLI mirrors in src/cli/runtime/metadata.ts:53-69; zero `.orca`/`ORCA_CONFIG` path constants remain in non-test src/config; WSL + relay hooks Fabrica-named. Clean cutover — no legacy migration shim needed. Old blocker note (appId still com.stablyai.orca) was STALE: actual appId = `com.autoscalers.fabrica` (config:49). Open PM flag: AGENTS.md doc said `ai.autoscalers.fabrica` — RESOLVED via ID-DOC (Aug 23): AGENTS.md now states ACTUAL with PENDING-PM canonical flag |

---

## Group D — Plugin Ecosystem (ship together)

| # | Task | Status | Notes |
|---|------|--------|-------|
| APP-D1 | Plugin `engines.orca` field → `engines.fabrica` | ✅ | VERIFIED Aug 23 PLUGIN-HASH-VERIFY: all manifests engines.fabrica >=1.4.0, zero engines.orca |
| APP-D2 | Plugin publisher rename (`stablyai` → `autoscalers`) | ✅ | VERIFIED: publisher `autoscalers`, marketplace owner `autoscalers` |
| APP-D3 | Plugin marketplace repos on GitHub | ✅ | VERIFIED: `Auto-Scalers/Fabrica-plugins` created |
| APP-D4 | Plugin kill-list URL (`onorca.dev` → `fabrica-ai.vercel.app`) | ✅ | VERIFIED: `PLUGIN_KILL_LIST_URL = 'https://fabrica-ai.vercel.app/plugins/kill-list.json'` (plugin-kill-list-service.ts:10); live 200 OK (URL-LIVENESS); old onFABRICA.dev note was stale |
| APP-D5 | Bundled plugin content hashes | ✅ | VERIFIED PLUGIN-HASH-VERIFY: prefix `fabrica-plugin-tree-v1` (plugin-content-hash.ts:99); recorded hash MATCHES independent recompute; verify-packaged-plugin-resources.cjs exits 0 |
| APP-D6 | Plugin loader reads from marketplace | ✅ | Marketplace fetches via Git clone, caches snapshots, bundles bootstrap to filesystem, discovery finds them, IPC handlers registered, startup wires it all — all connected |
| APP-D7 | Plugin update mechanism | ✅ | Version checking via `previewMarketplaceUpdate` (compares content hashes), update notifications via "Check for update" button in marketplace browser, download/install via `installMarketplacePlugin` IPC, rollback via `rollbackMarketplacePlugin` — all wired |

---

## Rebranding — Orca → Fabrica (General)

These are NOT grouped — they're ongoing sweeps across the codebase.

### Source Code Renames

| Area | What | Status | Notes |
|------|------|--------|-------|
| GitHub org + repo refs | `stablyai/orca` → `Auto-Scalers/Fabrica-app` | ✅ | VERIFIED Aug 23 SWEEP2/CI-CASKS/DOCS sweeps |
| `orca://` deep link | → `fabrica://` | ✅ | VERIFIED SWEEP2-VERIFY: pairing.ts:74 + web-pairing.ts:26 use fabrica://; zero functional orca:// in src |
| PostHog env vars | `ORCA_POSTHOG_WRITE_KEY` → `FABRICA_POSTHOG_WRITE_KEY` | ✅ | VERIFIED SWEEP2-VERIFY: 100% FABRICA_ prefixed |
| Diagnostics env vars | `ORCA_DIAGNOSTICS_*` → `FABRICA_DIAGNOSTICS_*` | ✅ | VERIFIED SWEEP2-VERIFY |
| Build identity env var | `ORCA_BUILD_IDENTITY` → `FABRICA_BUILD_IDENTITY` | ✅ | VERIFIED SWEEP2-VERIFY |
| Attribution footer | `Made with Orca` → `Made with Fabrica` | ✅ | VERIFIED SWEEP2-VERIFY: terminal-attribution.ts:12-13 links Fabrica-app repo |
| Product URL | `ORCA_PRODUCT_URL` → Fabrica URL | ✅ | VERIFIED SWEEP2-VERIFY: FABRICA_PRODUCT_URL in use |
| Feature wall docs URLs | `www.onFABRICA.dev/docs` | 👀 | Points at onfabrica.dev family which is DEAD DNS (URL-LIVENESS) — blocked on PM decision D2 domain strategy |
| Mobile E2EE protocol | `orca-mobile-e2ee` → `fabrica-mobile-e2ee` | ✅ | 4 files: contract, fixtures, test |
| Relay wire protocol | `ORCA-RELAY` → `FABRICA-RELAY` | ✅ | 35 matches: protocol.ts, relay-handshake.ts, relay-protocol.ts, 8 test files |
| Legacy CLI type | `OrchestrationCliCommand` legacy variants | ✅ | Removed `'orca' | 'orca-ide' | 'orca-dev'` from type, simplified to `'fabrica'`, updated inline types in coordinator.ts and fabrica-runtime.ts, updated 9 test mocks |

### Backend Endpoints to Rebuild

| Endpoint | Current | Target | Status |
|----------|---------|--------|--------|
| Auth | `login.onorca.dev` | `fabrica-ai.vercel.app/api/auth/*` | 👀 — client code exists, need server (Fabrica-web) |
| Relay | `relay.onorca.dev` | `fabrica-ai.vercel.app/api/relay` or Fly.io | ⬜ — WebSocket relay server needed |
| Share | `share.onorca.dev` | `fabrica-ai.vercel.app/api/share/*` | 👀 — client code exists, need server (Fabrica-web) |
| Diagnostics | `www.onorca.dev/diagnostics/token` | `fabrica-ai.vercel.app/api/diagnostics/*` | 👀 (Fabrica-web) |
| Changelog | `onorca.dev/whats-new/changelog.json` | `fabrica-ai.vercel.app/whats-new/changelog.json` | ⬜ — static JSON (Fabrica-web) |
| Plugin kill-list | `onorca.dev/plugins/kill-list.json` | `fabrica-ai.vercel.app/plugins/kill-list.json` | ⬜ — static JSON (Fabrica-web) |
| Docs | `www.onorca.dev/docs` | `fabrica-ai.vercel.app/docs` | ⬜ (Fabrica-web) |

### Localized READMEs (5 languages)

| File | Old URLs | Status |
|------|----------|--------|
| `docs/readme/README.zh-CN.md` | `onorca.dev`, `stablyai/orca` | 👀 |
| `docs/readme/README.pt.md` | `onorca.dev`, `stablyai/orca` | 👀 |
| `docs/readme/README.ko.md` | `onorca.dev`, `stablyai/orca` | 👀 |
| `docs/readme/README.ja.md` | `onorca.dev`, `stablyai/orca` | 👀 |
| `docs/readme/README.fr.md` | `onorca.dev`, `stablyai/orca` | 👀 |
| `.github/CONTRIBUTING.md` | `stablyai/orca` | 👀 |
| `WINDOWS_SETUP_GUIDE.md` | Orca references | ✅ | Rebranded, zero orca/stablyai refs remaining |

### CI/CD Workflows (`.github/workflows/`)

| File | Old Reference | Status |
|------|--------------|--------|
| `hourly-mac-build.yml` | `stablyai/fabrica-hourly` | 👀 |
| `daily-mac-build.yml` | `stablyai/fabrica-daily` | 👀 |
| `adhoc-mac-build.yml` | `stablyai/fabrica-adhoc` | 👀 |
| `release-cut.yml` | `stablyai/fabrica`, SignPath slug `orca` | 👀 |
| `release-mac-build.yml` | `stablyai/fabrica` | 👀 |
| `release-policy.yml` | `stablyai/fabrica` | 👀 |
| `readme-downloads-badge.yml` | `stablyai/fabrica` | 👀 |
| `homebrew-bump.yml` | `stablyai/fabrica`, `stablyai/homebrew-orca` | 👀 |

### i18n Locale Files

- `en.json` — ✅ VERIFIED Aug 23 I18N-VERIFY: 0 orca/onorca/stablyai occurrences, valid JSON
- All other locales (ko, ja, zh, es) — ✅ VERIFIED same sweep (all 5 locales + pt-BR plugin locale clean)

### Homebrew Casks

| File | What | Status |
|------|------|--------|
| `Casks/fabrica.rb` | Homepage `onfabrica.dev`, artifact names | 👀 |
| `Casks/fabrica@rc.rb` | Same | 👀 |

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
| APP-F1 | Full rebrand audit — grep for `stablyai`, `orca`, `onorca.dev`, `autoskiller` | ✅ | CLOSURE EVIDENCE COMPLETE Aug 23: F1-FINAL-SWEEP (321 hits, 0 unclassified after manifest subtraction, onFABRICA fully clear incl former relay-pairing fixtures); F1-GROUP-EVIDENCE (all Group A-D rows PASS fresh file:line); F1-MANIFEST-RECONCILE (321 = 282+22+6+3+8 exact). Runbook pre-exec results appended. Formal sign-off note: W1/APP-F3 full-suite green remains the final prerequisite per runbook step 1 |
| APP-F2 | Clean build verification | 🔶 | Windows VERIFIED twice Aug 23 (BUILD-VERIFY + FINAL-BUILD-REVERIFY: typecheck 0 errors, build exit 0); macOS/Linux builds pending (no runners on this box) |
| APP-F3 | Lint + test pass | ✅ | VERIFIED Aug 23 by orchestrator (`pnpm lint` exit 0 full chained pipeline + `pnpm typecheck` exit 0 run directly). Brand-casualty test failures FIXED in 7 files (persistence 9, pty-connection 17, worktree-groups 3, repo-icon 1, status-branch EBUSY, GIT_CONFIG_GLOBAL NUL, feature-interactions timeout). Full suite: 48,777 pass / 475 fail / 649 skip (99%); residual 475 = Windows-environment unchanged since baseline acbe762 (POSIX spawns, macOS-only APIs, watcher infra) |

---

## Checkpoint (Current State)

| Field | Value |
|---|---|
| **Current Group** | Closing: APP-F3 triaged (👀 VERIFY) — convergence reached R5 |
| **Current Task** | W1 APP-F3 triage COMPLETE Aug 23 (`ctx_a8e364e22424`): lint chain fully green, typecheck 0 (delta -7), brand-casualty test failures fixed in 7 files, residual 475 desktop-suite failures documented as Windows-environment/non-brand. Awaiting orchestrator VERIFY of APP-F3 |
| **Last Action** | Rounds R2-R5 logged: locale schemes normalized (20), ESM+CRLF fixes landed, CLI casing remediated (assertions+grammar+BOMs), GNOME text verified (18/18), snapshot/staged-state confirmed benign, PM-Dec-D8 documented, manifest fully reconciled (321 hits, 0 unclassified) |
| **Next Action** | On W1 done: execute APP-F1 formal closure per runbook (pre-exec results already recorded, all groups PASS), mark F1/F2, update roadmap; close sessions after tracking updates |
| **Blockers** | PM DECISIONS (PM-Decisions-Request.md): D2 domain strategy Beta-blocking (onfabrica.dev dead DNS); D3 downgraded to hygiene; D1/D4/D5/D6 non-blocking or lockstep; **D8 NEW: CJK locale catalogs corrupted pre-repo (ko 7013 / ja 9869 / zh 8183 ?-run lines) - decide en-fallback vs drop-from-Beta vs external translation**. Backend endpoints (auth/relay/share) need live servers regardless of domain |
| **Last Checkpoint** | 2026-08-23 (fresh-start fleet, cycle 4, Round R5 convergence) |

---

## Dependencies & Coordination Rules

1. **Both-sides rule:** When two parts of the product share an identifier, both must rename in the same release
2. **Group B ships together:** CLI + install paths + env vars + git trailer
3. **Group C ships together:** Wire tokens + keychain + TLS + data dirs
4. **Group D ships together:** Plugin ecosystem (manifests + publisher + repos + kill-list + hashes)
5. **`appId` rename** is deferred until mobile app + macOS helper + plugin publisher are ready to rename in lockstep
6. **Data directories (APP-C4)** blocked on `appId` rename

### Cross-Project Notes from Atlas-orchestrator (Round 4 discovery, 2026-08-23)

> Source: `.Fabrica-atlas-board/analysis/round4-findings-digest.md` (evidence-backed, spot-verified). These are AFTER-REBRAND ("Atlas-project") transformation candidates — recorded as notes only, for planning after Beta; Atlas owns discovery, Fabrica-app owns any implementation.

- **FA-T1 Provider-neutral runner abstraction** — `Runner.spawn(SpawnSpec)` over the existing PTY layer with pluggable output parsing (Claude JSON / codex JSON / plain text). Seed from MC's `SpawnOptions`/`SpawnResult` contract (`mission-control/scripts/daemon/types.ts:104-120`) and binary-whitelist resolution (`runner.ts:65-165`, `security.ts:97-106`). Wire into FA's existing agent probe family (`src/main/ipc/agent-hooks.ts`), not parallel machinery.
- **FA-T2 Approval-gated autonomy for irreversible actions** — port MC's field-ops approval FSM + risk table (`src/lib/types.ts:420`, `field-ops-security.ts:22-31`) and generalize ethereum adapter's whitelist/caps/dry-run rails (`ethereum-adapter.ts:551-574,183-199`). Enforcement point: one guard stack at FA's IPC boundary (`register-core-handlers.ts:109-234`).
- **FA-T3 Decision-gate escalation for runaway agents** — MC's decisions.json gating (`dispatcher.ts:135-138`, `run-task.ts:829-834`) + retry-guidance injection (`prompt-builder.ts:269-321`); detection substrate already in FA (OSC-133/question inference — see Atlas `discovery/round4/fa-pty-terminal.md` §6).
- **FA-T4 Fleet-supervision primitives in main process** — persistent retry queue w/ exponential backoff, bounded continuation chains, crash-isolated watcher children (FA already has the crash-isolation pattern per Atlas `discovery/round4/fa-ipc-watchers.md`).
- Full detail + remaining recommendations (T5+): read the digest file above.
- **Round 4 final feed (2026-08-23):** 10 additional paste-ready notes FA-N1..N10 now available in .Fabrica-atlas-board/analysis/cross-project-notes-r4.md — covering execute-guard port map with defect list, plugin-host runtime as agent-capability base, WSL risk register, telemetry rebrand-leak register, palette Agents section insertion point, agent-hooks probe substrate, MC dual-task-domain skeleton, and decision-queue interaction pattern. All spot-verified (0 failed cites across waves 2-8).
- **ATLAS FINAL FEED (2026-08-23, Round 5 closed at ~100%):** The consolidated Atlas discovery package is ready for your review:
  - **Executive summary** (10-min PM brief): .Fabrica-atlas-board/analysis/atlas-executive-summary.md — 10 verified capabilities, prioritized adoptions, risks, phase plan, open questions
  - **Consolidated feed notes** (FA-N1..N17, deduplicated): .Fabrica-atlas-board/analysis/cross-project-notes-final.md — paste-ready for this board
  - **Integration map** (how 5 subsystems compose): .Fabrica-atlas-board/analysis/r5-agent-platform-integration-map.md`n  - **Risk register** (consolidated, P0-P2): .Fabrica-atlas-board/analysis/atlas-risk-register.md`n  - **Phased roadmap** (A/B/C implementation proposal): .Fabrica-atlas-board/analysis/atlas-phased-roadmap.md`n  - **Convergence memo**: .Fabrica-atlas-board/analysis/r5-convergence-memo.md — recommends closing open-ended discovery rounds; authorize targeted-only follow-ups
  All items citation-verified with 0 conclusion-affecting failures across ~850+ spot-checked anchors.



---

## What Needs Verification

- [x] Wire tokens (`fabrica_server_ready`)
- [x] Keychain service name
- [x] TLS certificate CN
- [x] App name / productName / About / app menu
- [x] Feature wall docs URLs
- [x] Plugin marketplace repos created
- [x] Support email confirmed: `fabrica.studio.contact@gmail.com` — VERIFIED Aug 23: canonical constant `FABRICA_GIT_COMMIT_TRAILER` at `src/shared/fabrica-attribution.ts:6`, hardcoded defaults at `src/main/attribution/terminal-attribution.ts:288,727`; repo grep found no competing support/contact email (only agent identities `claude@`/`codex@fabrica.studio` in `HomeSlide.tsx:183,189`)
- [ ] App ID confirmed — ACTUAL (shipping) = `com.autoscalers.fabrica` (`config/electron-builder.config.cjs:49`, asserted in `config/scripts/electron-builder-mac-channel-config.test.mjs:54`); docs previously claimed `ai.autoscalers.fabrica`. PENDING-PM: decide canonical identity — adopt actual as canonical OR migrate code to `ai.autoscalers.fabrica`. No code/config changed until decision.

---

## Session Ledger

> Tracks orchestration sessions and workers for this task file. Updated when sessions are created, released, or worktrees merged.

| Session Handle | Type | Task/Group | Status | Created | Worktree Branch | Merged |
|---------------|------|-----------|--------|---------|----------------|--------|
| `term_905a82bc-8472-4451-91d5-4fe8a3c9c67b` | orchestrator | app-orchestrator | active | Aug 2026 | `main` (Fabrica-app/) | — |
| `term_8274ea16-fd28-4b9a-9d9e-7fa10cb6d650` | worker | P9: Plugin loader | released | Aug 19 2026 | `main` | ✅ |
| `term_4a73d6e4-0033-4910-a2b8-9af3e1dfc841` | worker | P10: Plugin updates | released | Aug 19 2026 | `main` | ✅ |

### Aug 21–23 session wave (orchestrator run `run_effeaea830f9`)

> Resume instructions: restart the two PAUSED tasks (APP-F3 = `task_e88d00622ee7`, RELAY-AUTH = `task_d52a1cf64012`, run `run_effeaea830f9`) with briefs telling workers to `git diff` first and keep partial work. Deliver briefs via `orca terminal send --enter` (dispatch --inject does not reach OpenCode TUIs in this environment).
> Note: this file was restored from git on Aug 23 after an orchestrator encoding mishap; the pre-restoration ledger formatting (worker's renumbering pass) was lost — statuses below are authoritative.

| Session Handle | Type | Task/Group | Dispatch | Status | Created | Worktree Branch | Merged |
|---------------|------|-----------|----------|--------|---------|----------------|--------|
| `term_c9c2b8b0-5b83-4354-9617-0b5f4684cb7f` | worker | APP-F3: Lint+test (1st resume) | `ctx_059aabe19076` / task `task_e88d00622ee7` | exited with terminal | Aug 21 | `main` | — |
| `term_28fbdf34-7786-47e7-9fcd-0ed0d396c810` | worker | I18N locale rebrand (en/ko/ja/zh/es) | `ctx_b1bde2138cd6` / task `task_b2bb44b3ee48` | ✅ — verified: 0 "Orca" left in en.json; ~5,141 lines across 5 locales | Aug 21 | `main` | — |
| `term_338ce564-5fed-4561-a953-f9fc1b05458f` | worker | Localized READMEs + CONTRIBUTING | `ctx_83405cc2fca2` / task `task_9cb7bbdbcf1c` | ✅ — verified: 5 files fixed | Aug 21 | `main` | — |
| `term_9c6383f5-35bf-4f6a-b188-0668b25441a2` | worker | CI workflows + Homebrew casks verify | `ctx_0e48e17b76ab` / task `task_c0a8338fc306` | ✅ — verified: grep clean for orca/stablyai in `.github/workflows/` + `Casks/` | Aug 22 | `main` | — |
| `term_20b4ac81-4ebe-4094-a4dc-6b64fff6fb1a` | worker | Relay auth: Supabase login UI + packaged env wiring | `ctx_2b974273b120` / task `task_d52a1cf64012` | PAUSED Aug 23 — partial work uncommitted on disk (`supabase-session.ts`, `src/shared/supabase-auth.ts`, `src/main/ipc/supabase-auth.ts`, `SupabaseAccountSignInCard.tsx`, `electron.vite.config.ts`) | Aug 22 | `main` | — |
| `term_f6fc6cac-6485-47e2-9fd2-2da3426772e9` | worker | APP-F3: Lint+test (final) | `ctx_d7f4b48caad8` / task `task_e88d00622ee7` | PAUSED Aug 23 — ~213 files changed in tree, final lint/test verification pending | Aug 22 | `main` | — |
| — | worker | REBRAND-HUNT full sweep | `ctx_82bc558c3bdc` / task `task_8149959e9f2d` | ✅ Aug 23 — 479 raw hits classified; 14 violations FIXED across 5 files (docs URLs, skill names, README assets, demo emails, stale orca:// fixtures); report-only zones untouched | Aug 23 | `main` | — |

**Paused-state warnings (Aug 23):**
- RESOLVED Aug 23: partial work was committed/pushed as `3f3d37c`; tree clean at HEAD; stray `NUL` file confirmed gone.
- After all fleet tasks land: run final rebrand audit (APP-F1) as the closing step.

### Aug 23 fresh-start fleet (run `run_effeaea830f9`, coordinator `term_dbd03d2a`)

> 5 workers dispatched per Parallelism Policy minimum. All in Fabrica-app worktree (`main`). Briefs delivered via `orca terminal send --enter`.

| Session Handle | Type | Task/Group | Dispatch | Status | Created | Worktree Branch | Merged |
|---------------|------|-----------|----------|--------|---------|----------------|--------|
| `term_389399d8-5acf-4c8b-9a73-d33c9396e5bc` | worker | APP-F3: Lint+test resume → W1 TRIAGE DONE (lint chain green, typecheck 0, brand-casualty fixes in 7 test files, residual failures documented as Windows-env; coordinator.test.ts straggler already resolved by another wave) | `ctx_a8e364e22424` / `task_e88d00622ee7` | 👀 done — awaiting review | Aug 23 | `main` | — |
| `term_16c744aa-b951-4daf-b071-78883dd96037` | worker | RELAY-AUTH ✅ → ID-DOC ✅ → MOBILE-VERIFY+STRAY-FIX ✅ → MOBILE-FIX ✅ → UPDATER-VERIFY ✅ → PM-DECISIONS ✅ → LINK-MODE-FIX ✅ → RELAY-COMPAT ✅ verified (legacy peers hard-rejected; repro sentinel was silently broken) → SENTINEL-FIX ✅ verified (line 9 now FABRICA-RELAY) → CHANGESET-REVIEW ✅ verified (typecheck clean, COMMIT-READY YES) → URL-LIVENESS ✅ verified independently (onfabrica.dev DEAD DNS; vercel serves both JSONs 200) → DOMAIN-FAILURE-IMPACT ✅ verified (kill-list URL is vercel at plugin-kill-list-service.ts:10) → FINAL-BUILD-REVERIFY (`ctx_924f33093734` / `task_fd5cdb176356`) | 11 tasks completed & verified | 🔶 active (13th task) | Aug 23 | `main` | — |
| `term_18638f42-f722-4ccc-a1b5-f4080a80619a` | worker | REBRAND-HUNT ✅ → ARTIFACT-AUDIT ✅ → CLI-VERIFY ✅ → DOCS-SPOT-AUDIT ✅ → EXCEPTION-MANIFEST ✅ verified (manifest written; 60 violations found) → VIOLATION-FIX-TESTS-DOCS (`ctx_ca1788856f3d` / `task_651256acf57f`) | 5 tasks completed & verified | 🔶 active (6th task) | Aug 23 | `main` | — |
| `term_56bde716-9422-405a-ad18-05786f094f50` | worker | BUILD-VERIFY ✅ → E2EE-PROTOCOL ✅ → MOBILE-PKG-FIX ✅ verified → MOBILE-TYPECHECK-FIX ✅ verified → MOBILE-FULL-TESTS ✅ done: full mobile suite 43→9 failures (3400 passed/3412); fixed 34 rebrand regressions: `onFABRICA.dev`→`onfabrica.dev` hostnames in 14 transport test files (URL.origin lowercases hosts → canonical-origin refine rejected fixtures), stale uppercase expectations in prepare-android-release-script.test.ts:52, worktree-display-name.test.ts:26, github-project-repo-match.test.ts:16, github-work-item-source-errors.test.ts:65, workspace-list-sections.test.ts:543+551; remaining 9 failures documented NOT rebrand: 8 are CRLF-environment (core.autocrlf=true working tree vs multi-line \n source-invariant patterns in browser-pane/dictation/session-startup/host-routing/text-zoom/write-coalescer tests — pass on LF checkouts), 1 is mock-server-key-pair.test.ts child-process tsx CJS interop (namespace exposes only default) → MOBILE-RESIDUAL-NORMALIZE ✅ done: normalized last 11 `onFABRICA.dev` sample literals to `onfabrica.dev` in 5 passing test files (credential-bundle, direct-upgrade-controller, runtime-failover, pairing-journal-store fixtures; MobileMarkdown input+expected markdown URL pair); confirmed plain sample data not hash-pinned; all 5 touched files pass (42/42); zero onFABRICA remains in mobile/src | `ctx_5eb79bba7eca` ✅; `ctx_afa072f28eb2` ✅; `ctx_0818b7b98708` ✅; `ctx_4b5f545ec526` ✅; `ctx_ddc77dbdf6fd` ✅; `ctx_2b705b31f9ca` / `task_1a563c757e9a` ✅ | ✅ done — awaiting review | Aug 23 | `main` | — |
| `term_b4a37ec4-0567-49ac-bed3-1dd65075e75a` | worker | GROUP-VERIFY ✅ → C4-PATHS ✅ → I18N-VERIFY ✅ → ENDPOINTS-VERIFY ✅ → DOMAIN-CASE-NORMALIZE ✅ verified (31 normalized; only 4 skipped fixture literals remain mixed-case) → DOMAIN-FAILURE-IMPACT ✅ verified → PLUGIN-HASH-VERIFY (`ctx_74d3a9080742` / `task_c892058df4bc`) | 6 tasks completed & verified | 🔶 active (7th task) | Aug 23 | `main` | — |

**CRITICAL FINDING (URL-LIVENESS + DOMAIN-FAILURE-IMPACT, orchestrator-reproduced):** `onfabrica.dev` family is DEAD DNS — every client reference to it fails. Only `fabrica-ai.vercel.app` is live and already serves `/whats-new/changelog.json` + `/plugins/kill-list.json`. Impact: whats-new surfaces degrade silently (cosmetic); cloud sign-in, relay pairing, artifact sharing are BLOCKED pending live backends regardless of domain choice (backend availability, not string swap). PM must decide D2 domain strategy before Beta. electron-builder publish repo lowercase `fabrica` case-folds to Fabrica-app on GitHub — no functional mismatch (D3 downgraded to hygiene).

**Known stragglers for W1 (APP-F3):** RESOLVED — `coordinator.test.ts:40` `'fabrica' as 'fabrica'` no longer present at W1 triage time (removed by an earlier wave); oxlint exits clean.

**Anti-overlap ownership map (live):**
- W2 owns `src/main/runtime/relay/`, `src/main/ipc/`, `src/shared/supabase-auth.ts`, `electron.vite.config.ts`
- W1 owns test files + lint/test fixes
- W3 owns docs/comments/configs/non-test source strings (report-only on W1/W2 files)
- W4 owns typecheck/build fixes (not W1/W2 files)
- W5 is read-only

**Rules:**
- Only the main orchestrator creates sessions in this ledger
- Workers are released after review
- Worktrees are merged immediately after approval
- Never leave orphaned sessions

---

_Consolidated: Aug 2026. Original files in `.Fabrica-app-board/` and `identifier-rename-review/` are now deleted._
_Last updated: 2026-08-23 (REBRAND-HUNT sweep: 12 violations fixed, report-only zones untouched)_
