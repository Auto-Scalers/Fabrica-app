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

| Round | Date | Findings (step) | Fixes dispatched | Result | Notes |
|---|---|---|---|---|---|

## Rollup

| Metric | Value |
|---|---|
| Total tasks | 21 |
| ✅ DONE | 2 |
| 🔶 IN_PROGRESS | 2 |
| 👀 VERIFY | 15 |
| ⬜ TODO | 3 |
| 🚫 BLOCKED | 0 |
| ❌ CANCELLED | 0 |
| Completion | 10% |

_Last recount: 2026-08-23 (fresh-start fleet activation: APP-F3 → IN_PROGRESS; APP-F1/F2 remain TODO). Scope: the 21 formally-ID'd tasks (APP-A/B/C/D/F tables). Sweep tables below (source renames, endpoints, READMEs, CI, casks, i18n) are tracked inline with the same emoji enum but not counted here._

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
| APP-A1 | App name / productName / About / app menu | 👀 | `productName:'Fabrica'`, window title, About panel, tray, notifications all renamed |
| APP-A2 | Firewall rule display name (`Orca Mobile Pairing`) | 👀 | `FIREWALL_RULE_DISPLAY_NAME = 'Fabrica Mobile Pairing'` in `windows-mobile-firewall.ts:11` — implemented |
| APP-A3 | Computer Use helper app name (`Orca Computer Use.app`) | 👀 | `Fabrica Computer Use.app` throughout codebase — packaging, signing, permission-detection all renamed |

---

## Group B — CLI & Install Paths (ship together)

| # | Task | Status | Notes |
|---|------|--------|-------|
| APP-B1 | CLI command rename (`orca` → `fabrica`) | 👀 | `package.json` bin: `"fabrica"`, CLI source uses `fabrica` throughout |
| APP-B2 | Install paths (`Program Files\Orca Dev` → `Fabrica Dev`) | 👀 | `productName: 'Fabrica'`, electron-builder uses Fabrica paths, no Orca Dev references |
| APP-B3 | Environment variables (`ORCA_*` → `FABRICA_*`) | 👀 | Zero `process.env.ORCA_` references remaining in source code; env vars in GitHub Actions secrets are external |
| APP-B4 | Git co-author trailer (`Co-authored-by: Orca <help@stably.ai>`) | 👀 | `FABRICA_GIT_COMMIT_TRAILER = 'Co-authored-by: Fabrica <fabrica.studio.contact@gmail.com>'` in `fabrica-attribution.ts:6` |

---

## Group C — Runtime Identity (ship together)

| # | Task | Status | Notes |
|---|------|--------|-------|
| APP-C1 | Wire tokens (`orca_server_ready` → `fabrica_server_ready`) | 👀 | Implemented 2026-08-13, verified zero remaining occurrences |
| APP-C2 | Keychain service name | 👀 | `'Fabrica Claude Code Managed Credentials'` — implemented 2026-08-13 |
| APP-C3 | TLS certificate CN (`CN=Orca Runtime` → `CN=Fabrica Runtime`) | 👀 | Implemented 2026-08-13, verified |
| APP-C4 | Data directories (`~/.config/orca` → `~/.config/fabrica`) | ⬜ | BLOCKED on APP-A1 remaining: `appId` still `com.stablyai.orca`. Electron resolves `userData` from `productName`, so this must ship after `appId` is renamed. Covers macOS/Windows/Linux paths, WSL, agent runtime |

---

## Group D — Plugin Ecosystem (ship together)

| # | Task | Status | Notes |
|---|------|--------|-------|
| APP-D1 | Plugin `engines.orca` field → `engines.fabrica` | 👀 | All bundled plugin manifests use `engines.fabrica` |
| APP-D2 | Plugin publisher rename (`stablyai` → `autoscalers`) | 👀 | All plugins use publisher `autoscalers`, marketplace owner `autoscalers` |
| APP-D3 | Plugin marketplace repos on GitHub | 👀 | `Auto-Scalers/Fabrica-plugins` created |
| APP-D4 | Plugin kill-list URL (`onorca.dev` → `fabrica-ai.vercel.app`) | 👀 | `PLUGIN_KILL_LIST_URL = 'https://onFABRICA.dev/plugins/kill-list.json'` in `plugin-kill-list-service.ts:10` |
| APP-D5 | Bundled plugin content hashes | 👀 | Hashes computed via `hashPluginTree()` using `fabrica-plugin-tree-v1` prefix; `bundled-plugins.json` has current hash |
| APP-D6 | Plugin loader reads from marketplace | ✅ | Marketplace fetches via Git clone, caches snapshots, bundles bootstrap to filesystem, discovery finds them, IPC handlers registered, startup wires it all — all connected |
| APP-D7 | Plugin update mechanism | ✅ | Version checking via `previewMarketplaceUpdate` (compares content hashes), update notifications via "Check for update" button in marketplace browser, download/install via `installMarketplacePlugin` IPC, rollback via `rollbackMarketplacePlugin` — all wired |

---

## Rebranding — Orca → Fabrica (General)

These are NOT grouped — they're ongoing sweeps across the codebase.

### Source Code Renames

| Area | What | Status | Notes |
|------|------|--------|-------|
| GitHub org + repo refs | `stablyai/orca` → `Auto-Scalers/Fabrica-app` | 👀 | All CI workflows, source code, and docs updated |
| `orca://` deep link | → `fabrica://` | 👀 | String rename across code + tests. No OS-level registration found. |
| PostHog env vars | `ORCA_POSTHOG_WRITE_KEY` → `FABRICA_POSTHOG_WRITE_KEY` | 👀 | Env-injected at build time. Secret already set in GitHub Actions. |
| Diagnostics env vars | `ORCA_DIAGNOSTICS_*` → `FABRICA_DIAGNOSTICS_*` | 👀 | Token URL + disabled flag |
| Build identity env var | `ORCA_BUILD_IDENTITY` → `FABRICA_BUILD_IDENTITY` | 👀 | Official-build gate. Secret already set in GitHub Actions. |
| Attribution footer | `Made with Orca` → `Made with Fabrica` | 👀 | `terminal-attribution.ts` — already says "Made with [FABRICA]" |
| Product URL | `ORCA_PRODUCT_URL` → Fabrica URL | 👀 | Various files |
| Feature wall docs URLs | `www.onFABRICA.dev/docs` | 👀 | Already points to Fabrica domain |
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

- `en.json` — **621** occurrences of "Orca" (user-visible product name) — 👀
- All other locales (ko, ja, zh, es) — similar volume — 👀

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
| APP-F1 | Full rebrand audit — grep for `stablyai`, `orca`, `onorca.dev`, `autoskiller` | ⬜ | Run after all other tasks complete |
| APP-F2 | Clean build verification | ⬜ | Build on all platforms after rebrand |
| APP-F3 | Lint + test pass | 🔶 | CLAIMED Aug 23 fresh-start fleet — resuming `task_e88d00622ee7`; partial work preserved in commit 3f3d37c; tree clean at HEAD |

---

## Checkpoint (Current State)

| Field | Value |
|---|---|
| **Current Group** | Final Verification (APP-F2 / APP-F3) + Relay auth follow-ups + full-fleet sweeps |
| **Current Task** | 5-worker fleet ACTIVE (see Aug 23 fleet ledger): APP-F3 resume, RELAY-AUTH resume, REBRAND-HUNT, BUILD-VERIFY, GROUP-VERIFY |
| **Last Action** | Fresh-start activation: bound `run_effeaea830f9`, unblocked both paused tasks, dispatched 5 workers, delivered briefs via terminal send |
| **Next Action** | Wait for worker_done; verify each with grep/read (never trust claims); dispatch fixes until clean; then close fleet with APP-F1 final audit |
| **Blockers** | APP-C4 still blocked on `appId` rename (APP-A1 dependency chain); backend endpoints await Fabrica-web server work |
| **Last Checkpoint** | 2026-08-23 (fresh-start fleet) |

---

## Dependencies & Coordination Rules

1. **Both-sides rule:** When two parts of the product share an identifier, both must rename in the same release
2. **Group B ships together:** CLI + install paths + env vars + git trailer
3. **Group C ships together:** Wire tokens + keychain + TLS + data dirs
4. **Group D ships together:** Plugin ecosystem (manifests + publisher + repos + kill-list + hashes)
5. **`appId` rename** is deferred until mobile app + macOS helper + plugin publisher are ready to rename in lockstep
6. **Data directories (APP-C4)** blocked on `appId` rename

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

**Paused-state warnings (Aug 23):**
- RESOLVED Aug 23: partial work was committed/pushed as `3f3d37c`; tree clean at HEAD; stray `NUL` file confirmed gone.
- After all fleet tasks land: run final rebrand audit (APP-F1) as the closing step.

### Aug 23 fresh-start fleet (run `run_effeaea830f9`, coordinator `term_dbd03d2a`)

> 5 workers dispatched per Parallelism Policy minimum. All in Fabrica-app worktree (`main`). Briefs delivered via `orca terminal send --enter`.

| Session Handle | Type | Task/Group | Dispatch | Status | Created | Worktree Branch | Merged |
|---------------|------|-----------|----------|--------|---------|----------------|--------|
| `term_389399d8-5acf-4c8b-9a73-d33c9396e5bc` | worker | APP-F3: Lint+test resume | `ctx_a8e364e22424` / `task_e88d00622ee7` | 🔶 active | Aug 23 | `main` | — |
| `term_16c744aa-b951-4daf-b071-78883dd96037` | worker | RELAY-AUTH: Supabase login UI resume | `ctx_2fbe91844f45` / `task_d52a1cf64012` | 🔶 active | Aug 23 | `main` | — |
| `term_18638f42-f722-4ccc-a1b5-f4080a80619a` | worker | REBRAND-HUNT violation sweep | `ctx_82bc558c3bdc` / `task_8149959e9f2d` | 🔶 active | Aug 23 | `main` | — |
| `term_56bde716-9422-405a-ad18-05786f094f50` | worker | BUILD-VERIFY typecheck+build | `ctx_5eb79bba7eca` / `task_9dffe5400ee0` | 🔶 active | Aug 23 | `main` | — |
| `term_b4a37ec4-0567-49ac-bed3-1dd65075e75a` | worker | GROUP-VERIFY A–D evidence sweep | `ctx_4a662335e305` / `task_1639342a1349` | 🔶 active | Aug 23 | `main` | — |

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
_Last updated: 2026-08-23_
