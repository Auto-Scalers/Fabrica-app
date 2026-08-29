# APP-F1 Final Rebrand Audit — Execution Runbook

> Audience: the worker(s) executing APP-F1 (final rebrand audit) after all other
> tasks land. Read `AGENTS.md`, `.Fabrica-app-board/Fabrica-app-tasks.md`, and
> `.Fabrica-app-board/rebrand-exceptions.md` before starting.
>
> Authoritative exception manifest: `.Fabrica-app-board/rebrand-exceptions.md`
> (categories A–F = ALLOWED; V-sections = violations reported for fixing).
> **Step 0 below is mandatory: parts of the manifest went stale during the Aug 23
> fix waves — re-verify it before trusting it.**

---

## 0. Ordered checklist (do in this order)

1. **[ ] Prerequisite: APP-F3 lint/test/typecheck green.**
   The audit greps must run against a tree where `pnpm lint`, `pnpm test`, and
   `pnpm typecheck` all pass (exit 0). If red, stop and hand back to the
   orchestrator — audit results on a red tree are meaningless.
2. **[ ] Refresh the exception manifest.** Several Aug 23 fixes invalidated
   manifest rows. Re-verify each and update `rebrand-exceptions.md` BEFORE sweeping:
   - Category C (`windows-ssh-attach-console-repro.mjs:9` ORCA-RELAY sentinel):
     FIXED — sentinel now reads `FABRICA-RELAY v0.1.0 READY`. Remove row C.
   - V1/V2 (`tests/tools/**`, `tests/e2e/**PLAN.md`) and V3 mobile leftovers:
     check whether fix waves landed; move resolved rows to ALLOWED or keep as open
     violations with current file:line.
   - Category E count (~282 hits) may have shifted with the mobile scope rename.
   - Confirm every remaining ALLOWED row still matches at its recorded file:line
     (spot-check at least 1 row per category).
3. **[ ] Run the sweep** (section 1 commands).
4. **[ ] Classify every residual hit**: in refreshed-ALLOWED manifest → pass;
     false-positive identifier (see pattern list) → ignore; anything else → new
     VIOLATION, record file:line + suggested fix.
5. **[ ] Verify Group A–D + Final Verification evidence** (section 2 tables).
6. **[ ] Build re-verify**: `pnpm typecheck && pnpm build` must both exit 0
     (APP-F2 closure). Do NOT run lint/test here — APP-F3 already covered them in
     step 1; do not duplicate ownership.
7. **[ ] Update the roadmap**: set APP-F1 ✅ with sweep counts (total hits,
     allowed, violations=0 expected) in `.Fabrica-app-board/Fabrica-app-tasks.md`
     Final Verification table; note any PM decisions still open by referencing
     `.Fabrica-app-board/PM-Decisions-Request.md` (section 4).

---

## 1. Exact sweep commands

Run from repo root (`Fabrica-app/`). Word-boundary `\borca\b` avoids identifier
false positives (`UpdateErrorCardContent`, `anchorCarry`, `errorCallback`,
`resolveLegacyCoordinatorCandidate`, etc.).

```bash
# 1a. Primary sweep — everything, standard exclusions, word-boundary orca
rg -i --no-heading -n \
  -g '!node_modules' -g '!.next' -g '!dist' -g '!out' \
  -g '!.backup' -g '!_sources' -g '!.git' -g '!android/.gradle' \
  -g '*.ts' -g '*.tsx' -g '*.js' -g '*.mjs' -g '*.cjs' -g '*.json' \
  -g '*.md' -g '*.yml' -g '*.yaml' -g '*.rb' -g '*.html' -g '*.swift' -g '*.kt' \
  -e '\borca\b' -e 'stablyai' -e 'onorca' -e 'stably\.ai' \
  > audit-sweep-raw.txt

# 1b. Case variants the boundary regex misses (Orca.exe, ORCA-RELAY, OnOrca):
rg -i --no-heading -n \
  -g '!node_modules' -g '!.next' -g '!dist' -g '!out' \
  -g '!.backup' -g '!_sources' -g '!.git' -g '!android/.gradle' \
  -e 'orca' -e 'stablyai' -e 'onorca' -e 'stably\.ai' \
  config/scripts src/main/providers docs/reference tests/tools tests/e2e mobile \
  >> audit-sweep-raw.txt

# 1c. Subtract the ALLOWED manifest: for each category, exclude its files/patterns.
#     A-category (GNOME screen-reader refs): only legitimate inside skill guides/
#     stubs mentioning /usr/bin/orca — exclude those paths:
rg -i '\borca\b' skills skill-stubs skill-guides src/cli/bundled-skill-guides.ts \
  | rg '/usr/bin/orca|screen reader|GNOME' || echo "A-category OK"

#     B-category (historical issue URLs):
rg -i 'stablyai/orca#\d+' docs/reference mobile || echo "B-category OK"

#     C-category: should now be EMPTY after the SENTINEL-FIX:
rg -i 'ORCA-RELAY' . -g '!node_modules' -g '!.backup' -g '!_sources' \
  || echo "C-category OK"

#     D-category (backward-compat fixtures StablyAI/FABRICA, orca:// deep-link
#     locale-policy locks):
rg -i 'StablyAI|orca://' src/main/github/client.test.ts \
  src/renderer/src/store/slices/github.test.ts \
  config/scripts/locale-translation-policy.test.mjs || echo "D-category OK"

#     E-category (@autoscalers/playwright-test external dep): exclude the import
#     lines wholesale; only NEW uses of stablyai outside this dep are findings:
rg -i 'stablyai' . -g '!node_modules' -g '!pnpm-lock.yaml' -g '!.backup' -g '!_sources' \
  | rg -v "@stablyai/playwright" || echo "E-category OK"

#     F-category (AGENTS.md orchestrator notes + tooling commands): verify by eye,
#     they are allowed to mention old brand historically.
```

Pass rule: after manifest subtraction and false-positive filtering, **zero hits**
remain. Any residual hit is a finding → dispatch a fix worker → re-run 1a–1c.

Delete `audit-sweep-raw.txt` when done (never commit it).

---

## 2. Pass criteria per group (expected evidence)

Verify each row's evidence still exists at the cited file:line (or its recorded
successor). Mark ⬜→✅ only with fresh evidence.

### Group A — Display & visible identity
| Row | Expected evidence |
|---|---|
| APP-A1 app name/productName/About/menu | `productName: 'Fabrica'` at `config/electron-builder.config.cjs:94`; executableName :287 |
| APP-A2 firewall rule name | `'Fabrica Mobile Pairing'` in `src/main/windows-mobile-firewall.ts:11` (verify line) |
| APP-A3 Computer Use helper | `Fabrica Computer Use.app` in `config/electron-builder.config.cjs:383-384`; helper signing :279 |

### Group B — CLI & distribution
| Row | Evidence focus: CLI command `fabrica`, install paths, env vars, git trailer |
|---|---|
| APP-B4 trailer | `Co-authored-by: Fabrica <fabrica.studio.contact@gmail.com>` at `src/shared/fabrica-attribution.ts:6`; defaults `src/main/attribution/terminal-attribution.ts:288,727` |

### Group C — Wire tokens / keychain / TLS / data dirs
| Row | Evidence focus |
|---|---|
| APP-C4 data dirs | userData from productName (electron-builder.config.cjs:94); zero `.orca` path constants in non-test src (verified DONE Aug 23) |

### Group D — Plugin ecosystem
Rows D1–D7: manifests, publisher, marketplace repos, kill-list, hashes — spot-check
the recorded evidence file:line from the task table.

### Final Verification table
| Row | Pass criteria |
|---|---|
| APP-F1 (this audit) | Sweep residual = 0; this runbook executed fully; roadmap updated |
| APP-F2 clean build | `pnpm build` exit 0 (last verified in FINAL-BUILD-REVERIFY; re-run in step 6) |
| APP-F3 lint+test | `pnpm lint` exit 0 AND `pnpm test` all green — owned by W1; confirm their latest green run timestamp before auditing |

### Known-good residuals (must STILL be present after sweep — absence means over-fixing)
- GNOME screen-reader warnings (category A, 18 rows)
- `MOBILE_E2EE_V2_PROTOCOL = 'fabrica-mobile-e2ee'` consistency: SALT/INFO labels
  `FABRICA-mobile-e2ee/v2/*` identical on both peers
  (`mobile/src/transport/mobile-e2ee-v2-key-schedule.ts:4-5`,
  `src/main/runtime/rpc/mobile-e2ee-v2-key-schedule.ts:3-4`) — PENDING-PM lockstep
  item, do not "fix"
- `'FABRICA-browser'` enum value (`mobile/src/storage/preferences.ts:195`) —
  PENDING-PM case alignment (D5), do not rename unilaterally

---

## 3. Escalation rules mid-audit

- New violation in a file another worker owns → report via escalation, do not edit.
- Manifest row whose file:line no longer matches → update manifest + note in report.
- Any failure in `pnpm typecheck`/`pnpm build` during step 6 → escalate to
  orchestrator; do NOT hotfix (post-audit tree should be frozen).

## 4. Known open PM decisions (reference, do not resolve)

See `.Fabrica-app-board/PM-Decisions-Request.md` — as of this runbook:
D1 canonical App ID (`com.autoscalers.fabrica` actual), D2 production domain
(`onfabrica.dev` family is dead DNS; `fabrica-ai.vercel.app` serves whats-new +
kill-list 200 OK — updater/auth/relay/share URLs affected), D3 publish-repo casing
(case-folds to Fabrica-app, hygiene only), D4 npm scopes (`@autoscalers/playwright-test`
external; audio module already renamed), D5 `'FABRICA-browser'` enum casing,
D6 E2EE label case (lockstep-only). The final audit must NOT pre-empt these
decisions — flag, don't fix.

---

## APP-F1 pre-execution results (2026-08-23)

> Executed by worker `term_16c744aa` / dispatch `ctx_1753711bb6e7` per this runbook.
> **Formal APP-F1 closure still awaits W1 (APP-F3 lint/test) completion** — results
> below are pre-execution evidence on the current tree, not closure.

### Sweep (runbook section 1)

Primary word-boundary sweep: 319 raw hits → after subtracting manifest classes:
- 282 × `@autoscalers/playwright-test` imports — ALLOWED (cat E)
- 18 × GNOME screen-reader refs (`/usr/bin/orca`) — ALLOWED (cat A)
- AGENTS.md:5,28,32,48,112,117 — ALLOWED (cat F, exact 6 rows)
- docs/reference/linux-glibc-compatibility.md:23; mobile/issue-5049-...md:4 — ALLOWED (cat B)
- mobile/terminal-output-streaming-findings.md:16 — historical session log (ALLOWED)
- mobile/packages/expo-two-way-audio/README.md:16,24 — `@orca/` scope, PENDING-PM D4
- src/main/github/client.test.ts:3822,3825,3826,3837 + github.test.ts:8182,8186 — ALLOWED (cat D fixtures)

**Unclassified residuals: 0.**

Case-variant sweep (`onFABRICA|onOrca`): only remaining source hits are the 4 known
literals in `src/shared/mobile-relay-pairing-fixtures.ts:21,22,68,73` (FIXTURE-LITERALS
normalized them to lowercase onfabrica.dev on a later dispatch — re-verify at formal audit).

### Group A–D pass-criteria walk

| Row | Verdict | Evidence |
|---|---|---|
| APP-A1 app name/productName | PASS | `config/electron-builder.config.cjs:94` productName 'Fabrica' |
| APP-A2 firewall rule name | PASS | `src/main/runtime/windows-mobile-firewall.ts:11` 'Fabrica Mobile Pairing' (runbook path note: file lives under runtime/, line :11 correct) |
| APP-A3 Computer Use helper | PASS | `config/electron-builder.config.cjs:279` signing helper; :383-384 copy 'Fabrica Computer Use.app' |
| APP-B4 git trailer | PASS | `src/shared/fabrica-attribution.ts:6`; defaults `src/main/attribution/terminal-attribution.ts:288,727` |
| APP-C4 data dirs | PASS | userData from productName (config :94); repo-wide grep zero `.orca`/`ORCA_CONFIG` constants in non-test src (exit-clean Aug 23) |
| Wire sentinel (C-group adjacent) | PASS | `FABRICA-RELAY v${RELAY_VERSION} READY` at `src/relay/protocol.ts:28` + `src/main/ssh/relay-protocol.ts:29`; repro script sentinel fixed |
| Group D plugin ecosystem | PASS (per board records + spot-checks) | kill-list URL live domain `src/main/plugins/plugin-kill-list-service.ts:10`; publisherName SignPath config :291 |

### Blockers to formal closure

1. W1 / APP-F3 lint+test green run (prerequisite step 1 of this runbook).
2. Manifest refresh rows noted in runbook section 0.2 (category C stale; V3 partial).
3. PENDING-PM items D4/D5/D6 remain intentionally untouched — flag-only.