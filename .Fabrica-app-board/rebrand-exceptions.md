# Rebrand Exception Manifest (Fabrica-app)

> Authoritative allowlist of INTENTIONAL old-brand strings (`orca`, `stablyai`, `onorca`, `stably.ai`).
> Any grep hit NOT listed here and NOT matching the false-positive patterns below is a VIOLATION.
>
> Basis sweep: 2026-08-23 (initial), **REFRESHED 2026-08-23 late cycle (task_80d8ee8c9ab4 / ctx_e0ee82c41bdd):
> 317 word-boundary hit lines = 317 ALLOWED (below) + 0 VIOLATION**. All fix waves
> (tests-tools docs, mobile findings docs, window-enum.ps1, locale-policy fixture,
> updater repoint, domain-case normalize) are reflected in the tables below.
>
> ## How to re-verify
>
> ```bash
> # Word-boundary sweep (recommended — avoids identifier false positives like
> # UpdateErrorCardContent, anchorCarry, errorCallback, resolveLegacyCoordinatorCandidate):
> rg -i --no-heading -n \
>   -g '!node_modules' -g '!.next' -g '!dist' -g '!out' -g '!.backup' -g '!_sources' \
>   -g '*.ts' -g '*.tsx' -g '*.js' -g '*.mjs' -g '*.cjs' -g '*.json' -g '*.md' \
>   -g '*.yml' -g '*.yaml' -g '*.rb' -g '*.html' \
>   -e '\borca\b' -e 'stablyai' -e 'onorca' -e 'stably\.ai'
>
> # Then subtract every file:line listed in the ALLOWED tables below.
> # Anything left must appear in the VIOLATIONS section or it is a new finding.
> ```
>
> NOTE on false positives: plain substring greps for `orca` also match identifiers such as
> `UpdateErrorCardContent`, `anchorCarry`/`anchorCache`/`anchorCandidates`,
> `errorCallback`/`WebCodecsErrorCallback`/`resolveErrorCall`, `isBlockOrCatchScoped`,
> `diffEditorCategory`, `combinedDiffScrollAnchorCache`,
> `WatcherSupervisorCapacityWait`, `resolveLegacyCoordinatorCandidate`,
> `describeErrorCause`/`keyForCandidate`. Prefer `\borca\b`.

---

## A. GNOME Orca screen-reader references (`/usr/bin/orca`) — 22 hits

The Linux binary `/usr/bin/orca` is the GNOME screen reader, not our product. These refs exist to stop agents from running it by mistake.

| File:Line | Reason |
|---|---|
| src/cli/bundled-skill-guides.ts:15 | Embedded fabrica-cli guide: bare `fabrica` on Linux resolves to the GNOME screen reader |
| skills/fabrica-cli/SKILL.md:39 | Same screen-reader warning |
| skills/computer-use/SKILL.md:35 | Same |
| skills/linear-tickets/SKILL.md:39 | Same |
| skills/orchestration/SKILL.md:41 | Same |
| skills/fabrica-emulator/SKILL.md:33 | Same |
| skills/fabrica-emulator-android/SKILL.md:33 | Same |
| skills/fabrica-per-workspace-env/SKILL.md:38 | Same |
| skills/fabrica-linear/SKILL.md:38 | Same |
| skill-stubs/fabrica-cli.md:23 | Stub mirror of the above |
| skill-stubs/computer-use.md:22 | Same |
| skill-stubs/linear-tickets.md:24 | Same |
| skill-stubs/orchestration.md:25 | Same |
| skill-stubs/fabrica-emulator.md:23 | Same |
| skill-stubs/fabrica-emulator-android.md:22 | Same |
| skill-stubs/fabrica-per-workspace-env.md:26 | Same |
| skill-stubs/fabrica-linear.md:24 | Same |
| skill-guides/fabrica-cli.md:19 | Standalone guide copy of the same warning |
| config/scripts/orchestration-skill-guidance.test.mjs:367 | Guard-test asserting the corrected wording: `expect(stub).toContain('GNOME Orca screen reader')` (GNOME-ASSERT-FIX, Aug 23) |
| config/scripts/fabrica-linear-skill-guidance.test.mjs:78 | Same guard-test |
| config/scripts/fabrica-cli-skill-guidance.test.mjs:136 | Same guard-test |
| config/scripts/computer-use-skill-guidance.test.mjs:70 | Same guard-test |

## B. Historical GitHub issue URLs / historical paths — 3 hits

Immutable links to issues filed under the old org and factual records of paths on the original investigation machine; rewriting them would break history.

| File:Line | Reason |
|---|---|
| docs/reference/linux-glibc-compatibility.md:23 | Historical bug ref: stablyai/orca#9902 (glibc 2.31 launch break on Ubuntu 20.04) |
| mobile/issue-5049-unresponsive-session-findings.md:4 | Historical findings doc citing stablyai/orca#5049 |
| mobile/terminal-output-streaming-findings.md:16 | Historical worktree path `/Users/jinwoohong/orca/workspaces/orca/pr-1172-review` — where the physical-phone test worktree actually lived during the original investigation (added by STRAGGLERS 2026-08-23) |

## C. Legacy wire-protocol sentinels — 0 active hits (1 instance RESOLVED)

| File:Line | Reason |
|---|---|
| ~~config/scripts/windows-ssh-attach-console-repro.mjs:9~~ | **RESOLVED 2026-08-23:** sentinel was fixed to `FABRICA-RELAY v0.1.0 READY`; no ORCA-RELAY string remains in this file. Category retained for future legacy-sentinel exceptions. |

## D. Backward-compat test fixtures — 6 hits

Fixtures that deliberately exercise case-insensitive equality against the legacy owner name.

| File:Line | Reason |
|---|---|
| src/main/github/client.test.ts:3822 | `StablyAI/FABRICA` ownerRepo mock — verifies case-insensitive owner matching |
| src/main/github/client.test.ts:3825 | Same fixture branch |
| src/main/github/client.test.ts:3826 | Same fixture branch |
| src/main/github/client.test.ts:3837 | `github.com/StablyAI/FABRICA` gh CLI arg assertion |
| src/renderer/src/store/slices/github.test.ts:8182 | Comment describing the case-insensitive design-doc contract |
| src/renderer/src/store/slices/github.test.ts:8186 | `StablyAI/Fabrica` fixture object |

**REMOVED 2026-08-23 refresh:** the two `locale-translation-policy.test.mjs` rows
(:54, :58) — the fixture was updated to `fabrica://pair?code=...` in
POLICY-FIXTURE-FIX (ctx_f8164ebc1181); no legacy string remains in that file.

## E. External npm scope `@stablyai/playwright-test` — 282 hits

Published third-party package under the old scope; renaming requires an upstream package move, not a repo edit.

| Location | Hits | Reason |
|---|---|---|
| package.json:163 | 1 | Dependency declaration `"@stablyai/playwright-test": "^2.1.14"` |
| pnpm-lock.yaml | 10 | Lockfile entries (generated from package.json) |
| tests/playwright.config.ts:1 | 1 | Runner config import |
| config/scripts/run-idle-cpu-benchmark.mjs:2 | 1 | `_electron` driver import |
| config/scripts/run-codex-real-account-validation.mjs:2 | 1 | `_electron` driver import |
| tests/tools/win-update-e2e/app-driver.mjs | 1 | Driver import |
| tests/tools/benchmarks/workspace-switch-paint-latency.mjs | 1 | Driver import |
| tests/tools/terminal-garble-production-repro.mjs | 1 | Driver import |
| tests/e2e/**/*.spec.ts / helpers/*.ts (~200 files) | ~265 | Per-file `import ... from '@stablyai/playwright-test'` type/expect imports |

## F. AGENTS.md orchestrator-owned notes & tooling — 6 hits

Worker-instructions file owned by the orchestrator; historical context plus live CLI tooling commands whose binary is still named `orca`.

| File:Line | Reason |
|---|---|
| AGENTS.md:5 | Historical note: app "forked from Orca" |
| AGENTS.md:28 | Historical note: "This is a rebrand from Orca to Fabrica" |
| AGENTS.md:32 | Historical note: GitHub org "(was `stablyai`)" |
| AGENTS.md:48 | The exception policy itself (mentions orca/stablyai/onorca as grep terms) |
| AGENTS.md:112 | `orca orchestration send ... worker_done` — current tooling command |
| AGENTS.md:117 | `orca orchestration send ... escalation` — current tooling command |

---

## PENDING-PM rows (confirmed accurate 2026-08-23 refresh)

These are brand artifacts awaiting a PM decision (see `.Fabrica-app-board/PM-Decisions-Request.md` D4/D5/D6/D7).
Items 1–2 appear in the sweep above; items 3–5 are casing artifacts OUTSIDE this
manifest's grep patterns but tracked here for completeness:

1. **`@orca/expo-two-way-audio`** — external npm scope in vendored-module README
   (`mobile/packages/expo-two-way-audio/README.md:16,24`). Module package name is
   already `@fabrica/...`; only the README install/import examples show the old scope.
   Renaming requires an upstream publish or dropping the examples.
2. **`@stablyai/playwright-test`** — external published package, class E above
   (~282 lines). Options tracked in PM-Decisions D4.
3. **`'FABRICA-browser'` enum value** — `mobile/src/storage/preferences.ts:195,198,203`
   (broken-case rebrand artifact of `orca-browser`; natural form is
   `fabrica-browser`) plus stale initial value at
   `mobile/app/h/[hostId]/session/[worktreeId].tsx:927`. PM-Decisions D5.
4. **E2EE v2 key-schedule labels** — `'FABRICA-mobile-e2ee/v2/salt\0'` /
   `'FABRICA-mobile-e2ee/v2/session\0'`, byte-identical on both peers
   (`mobile/src/transport/mobile-e2ee-v2-key-schedule.ts:4-5`,
   `src/main/runtime/rpc/mobile-e2ee-v2-key-schedule.ts:3-4`). Never change one
   side alone. PM-Decisions D6.
5. **Vendored module homepage slug** —
   `mobile/packages/expo-two-way-audio/package.json:12` points at
   `github.com/Auto-Scalers/FABRICA` (broken-case repo slug). PM-Decisions D4.

NOTE on the coordinator-suggested "fixture-passthrough URLs in
updater-changelog.test.ts left on legacy domain intentionally": no row added —
those fixtures were normalized to lowercase `onfabrica.dev` in DOMAIN-CASE-NORMALIZE
(ctx_9101664fc88c) and contain zero old-brand strings; nothing qualifies under
this manifest's word list.

---

## 2026-08-23 REFRESH (task_80d8ee8c9ab4 / ctx_e0ee82c41bdd)

Re-ran the manifest's own word-boundary sweep. Result: **317 hit lines, all
classified, 0 violations.**

| Class | Hits | Change |
|---|---|---|
| A. GNOME screen-reader refs | 18 | unchanged |
| B. Historical URLs/paths | 3 | unchanged |
| C. Legacy wire sentinels | 0 | still resolved (`windows-ssh-attach-console-repro.mjs` absent from sweep) |
| D. Backward-compat fixtures | 6 | −2 (locale-policy fixture fixed → `fabrica://`, POLICY-FIXTURE-FIX) |
| E. `@stablyai/playwright-test` family | ~282 | unchanged (external package) |
| PENDING-PM `@orca/expo-two-way-audio` README | 2 | moved from retired V3 section into PENDING-PM |

Fix waves now reflected in this refresh: tests-tools doc rebrand (former V1),
e2e plan/AGENTS rebrand (former V2), mobile findings-doc commands, window-enum.ps1
`FabricaWinEnum` rename, locale-policy fixture update, updater whats-new URL
repoint + domain-case normalization, README/help-menu link fixes. The former
VIOLATIONS section is retired — zero open violations remain.

---
_Created by EXCEPTION-MANIFEST worker (task_76c0bf680b18 / ctx_8aa00f9b39b0), 2026-08-23. Refreshed by GROUP/VERIFY worker W5 (term_b4a37ec4). Only this board file was written._
