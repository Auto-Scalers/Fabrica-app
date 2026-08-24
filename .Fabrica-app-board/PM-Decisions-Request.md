# PM Decisions Request — Aug 23 2026 Fleet Cycle

> Compiled by worker `term_16c744aa` / dispatch `ctx_131c1146e3a2`. Six open decisions
> surfaced during the Aug 23 Fabrica-app fleet cycle. Each has evidence, options,
> recommendation, blast radius, and Beta-blocking status. **No source or config was
> changed for any of these** — all await your call.

---

## D1 — Canonical App ID

**Evidence:** Shipping appId is `com.autoscalers.fabrica`
(`config/electron-builder.config.cjs:49`, asserted by tests at
`config/scripts/electron-builder-mac-channel-config.test.mjs:54`,
`config/scripts/mac-build-compatibility.test.mjs:17`). The whole codebase uses it
consistently: build contract (`src/shared/local-build-compatibility-contract.ts:3` +
`.json:3`), Windows AUMID (`src/main/startup/dev-instance-identity.ts:6`),
notifications (`src/main/ipc/notifications.ts:38`), TCC watch list
(`src/main/macos-tcc-prompt-watch.ts:22-27`), Homebrew casks (`Casks/fabrica.rb:43-47`),
native Swift helper IDs, mobile bundle IDs. Docs previously claimed
`ai.autoscalers.fabrica`; AGENTS.md:29 now documents ACTUAL with PENDING-PM flag.

**Options:**
1. Adopt `com.autoscalers.fabrica` as canonical (match reality).
2. Migrate code to `ai.autoscalers.fabrica` (rename everywhere).

**Recommendation:** Option 1. The codebase, packaging, casks, and native helpers are
100% aligned on `com.autoscalers.fabrica`; migrating would break upgrade paths for any
installed build (macOS treats a new bundle ID as a different app) for zero benefit.

**Blast radius if changed:** High — installer identity, update feed targeting, keychain
ACLs, TCC permissions, deep-link ownership all keyed to the current ID.

**Beta-blocking:** NO (decision needed before any official release channel rename, but
current shipping identity works).

---

## D2 — Canonical production domain

**Evidence:** Most first-party client code targets the `onfabrica.dev` family:
cloud auth API (`src/main/fabrica-profiles/profile-cloud-auth-config.ts:19` —
`login.onfabrica.dev`), artifacts share API (`src/main/artifacts/artifact-cloud-config.ts:3,21,26`
— `share.onfabrica.dev`, hostname allowlist), telemetry privacy URL
(`src/renderer/src/lib/telemetry.ts:11`), docs URLs across localized READMEs,
sidebar help menu (`SidebarSettingsHelpMenu.tsx:39,40`). Two places instead use
`fabrica-ai.vercel.app`: help-menu website link (`SidebarSettingsHelpMenu.tsx:38`) and
plugin kill list (`src/main/plugins/plugin-kill-list-service.ts:10`). The task board's
Auto-updater section (`.Fabrica-app-board/Fabrica-app-tasks.md:235-237`) says the
whats-new static JSON lives on `fabrica-ai.vercel.app`.

**URGENT sub-finding:** the updater whats-new fetches point at
`https://onFABRICA.dev/...` — a broken-casing rebrand artifact of `onorca.dev` that
resolves nowhere unless that exact host exists: `src/main/updater-nudge.ts:12`,
`src/main/updater-changelog.ts:13,45`. Same broken casing also appears in
feedback (`src/main/ipc/feedback.ts:17,332`), relay director URL
(`profile-cloud-auth-config.ts:21`), feature-wall tiles/workflows
(`src/shared/feature-wall-tiles.ts:68+`, `feature-wall-workflows.ts:33+`), and relay
pairing fixtures (`src/shared/mobile-relay-pairing-fixtures.ts:21-73`).

**Options:**
1. `onfabrica.dev` (all lowercase) as canonical; fix broken-case artifacts to it;
   mirror whats-new JSON there.
2. `fabrica-ai.vercel.app` as canonical; repoint all `onfabrica.dev` references.
3. Keep split: product domain vs deploy-domain, documented explicitly.

**Recommendation:** Option 1 + immediate hotfix of the updater URLs to whichever host
actually serves `/whats-new/nudge.json` and `/changelog.json` today
(`fabrica-ai.vercel.app` per the board). If neither `onFABRICA.dev` nor
`onfabrica.dev/whats-new/*` is live, update nudges/changelog silently fail right now.

**Blast radius:** Updater URLs — user-facing update nudge + changelog panes; auth/relay/
artifacts domains — sign-in, relay pairing, sharing. All are string constants; low code
risk, high coordination risk with DNS/backend owners.

**Beta-blocking:** YES for the updater whats-new URLs (functional failure today);
NO for the broader canonical-domain choice (cosmetic until DNS is settled).

**URL-LIVENESS UPDATE (Aug 23 late cycle, worker `term_b4a37ec4` / `ctx_1741f2ad03f2`):**
Live probes settle D2's open question —
- `https://onfabrica.dev/whats-new/nudge.json` → **DNS does not resolve at all**
  (`The remote name could not be resolved: 'onfabrica.dev'`). Same for
  `www.onfabrica.dev`. The domain is not registered/served, so every updater
  whats-new fetch (`updater-nudge.ts:12`, `updater-changelog.ts:13,45`) fails today.
- `https://fabrica-ai.vercel.app/whats-new/changelog.json` → **HTTP 200, valid**
  (1 entry, version `1.4.178-rc.2`, schema matches the app parser).
- `https://fabrica-ai.vercel.app/plugins/kill-list.json` → **HTTP 200, valid**
  (`{version:1, generatedAt, plugins:[]}` matches `pluginKillListSchema`).
- Conclusion: `fabrica-ai.vercel.app` is the only live first-party host today;
  the D2 hotfix (repoint updater URLs) is confirmed urgent and unblocked.

---

## D3 — electron-builder publish repo vs runtime feed repo mismatch

**Evidence:** Publish block targets `owner: 'Auto-Scalers', repo: devChannelRepo ?? 'fabrica'`
(`config/electron-builder.config.cjs:500-505`; dev channels `fabrica-hourly/daily/adhoc`
at :42-48). Runtime updater resolves releases from
`github.com/Auto-Scalers/Fabrica-app/releases.atom`
(`src/main/updater-prerelease-feed.ts:5,6,14`; pinned feeds `src/main/updater.ts:1388-1392,1440,2205`).
Board line `.Fabrica-app-board/Fabrica-app-tasks.md:210` documents publish =
`Auto-Scalers/fabrica`.

**Options:**
1. Confirm two-repo split is intentional: CI publishes installers to
   `Auto-Scalers/fabrica` (or channel repos), desktop updates read
   `Auto-Scalers/Fabrica-app` releases — then document it.
2. Reconcile to one repo (likely `Fabrica-app`) and fix the publish block.

**Recommendation:** Decide based on where release artifacts actually land today
(check the last CI run). If they land on `Fabrica-app`, fix config:503; if on
`fabrica`, fix the atom-feed repo constant — either way exactly one must match reality.

**Blast radius:** Release pipeline + every production auto-update check. A wrong repo
means zero updates discovered (silent).

**Beta-blocking:** YES for Beta distribution — updates must resolve end-to-end before
shipping Beta to external testers.

**URL-LIVENESS UPDATE (Aug 23 late cycle):** Probes show
`github.com/Auto-Scalers/Fabrica-app/releases/latest/download/fabrica.apk` →
**404** (no release assets exist under that repo/name yet — resolves when real
releases are cut). The `Auto-Scalers/fabrica` repo responds (301 redirect chain),
so the two-repo split is real, not a typo. D3's "check where artifacts actually
land" remains open until the first CI release run.

---

## D4 — npm scopes `@orca/expo-two-way-audio` and `@stablyai/playwright-test`

**Evidence:**
- The vendored audio module is ALREADY renamed locally: package name
  `@fabrica/expo-two-way-audio` (`mobile/packages/expo-two-way-audio/package.json:2`,
  consumed at `mobile/package.json:21` via `file:` link). Only its README still shows
  the old `@orca/expo-two-way-audio` install/import examples
  (`mobile/packages/expo-two-way-audio/README.md:16,24`). Its homepage field still
  points at `github.com/Auto-Scalers/FABRICA` — broken-case repo slug
  (package.json:12).
- `@stablyai/playwright-test` is an EXTERNAL published npm package
  (`package.json:163`, lock entries `pnpm-lock.yaml:125,2538`, sole consumer
  `config/scripts/run-idle-cpu-benchmark.mjs:2`). Renaming requires publishing a fork
  under a new scope or switching to upstream `@playwright/test`.

**Options (audio module):** (a) done-as-is, just fix README examples → `@fabrica/...`;
(b) keep vendored path-only naming.
**Options (playwright):** (a) keep `@stablyai/playwright-test` (external dep, brand
visible only in dev tooling); (b) switch benchmark script to stock `@playwright/test`;
(c) fork+publish under `@auto-scalers/`.

**Recommendation:** Audio: fix the two README lines (trivial). Playwright: option (b)
if API-compatible, else keep — old brand exposure is dev-tooling only.

**Blast radius:** Audio README — none (docs). Playwright swap — one benchmark script;
must verify `_electron` export parity.

**Beta-blocking:** NO.

---

## D5 — `'orca-browser'` MobileTerminalLinkOpenMode enum value

**Evidence:** The union type is NOW `'FABRICA-browser' | 'phone-browser'`
(`mobile/src/storage/preferences.ts:195`, default :198, validation :203, tests
`preferences.test.ts:468-483`) — but `mobile/app/h/[hostId]/session/[worktreeId].tsx:927`
still passes `'orca-browser'` as the initial state value, which no longer exists in the
union (type error / dead value). Note also `'FABRICA-browser'` itself is a broken-case
rebrand artifact of `orca-browser`; the natural value is `'fabrica-browser'`.

**Options:**
1. Fix :927 to the current union value AND normalize the whole enum to
   lowercase `fabrica-browser` (persisted-preference migration for stored values).
2. Minimal: just align :927 to `'FABRICA-browser'`, keep odd casing.

**Recommendation:** Option 1 in one commit: rename enum value to `fabrica-browser`,
migrate persisted prefs (one-line mapping on load), fix :927. Do it before more code
references the odd casing.

**Blast radius:** Mobile session screen + stored user preference; needs the load-time
migration so users' saved choice doesn't reset.

**Beta-blocking:** YES-ish — :927 currently passes a value outside the union (compile
error under strict tsc; at minimum a dead initial state), and this is user-facing
link-opening behavior. Should be fixed before the next mobile TestFlight build.

---

## D6 — E2EE v2 key-schedule SALT/INFO label casing (`FABRICA-mobile-e2ee/v2`)

**Evidence:** Labels are byte-identical on both peers:
`mobile/src/transport/mobile-e2ee-v2-key-schedule.ts:4-5` and
`src/main/runtime/rpc/mobile-e2ee-v2-key-schedule.ts:3-4` —
SALT `'FABRICA-mobile-e2ee/v2/salt\0'`, INFO `'FABRICA-mobile-e2ee/v2/session\0'`.
The uppercase `FABRICA` is a rebrand artifact of `orca-mobile-e2ee`; protocol-wise it
is just an opaque domain-separation string. Related wire identifier
`protocol: MOBILE_E2EE_V2_PROTOCOL` is being centralized (in-flight edit to
`mobile/src/transport/mobile-e2ee-v2-client-session.ts` by another worker).

**Options:**
1. Leave as-is (works; both sides agree).
2. Normalize to `fabrica-mobile-e2ee/v2` in a single lockstep change on both sides,
   gated by protocol-version bump so mixed versions don't pair.

**Recommendation:** Leave as-is through Beta (option 1); schedule option 2 with the
next intentional wire-protocol version bump if brand-cleanliness matters. Never change
one side alone — sessions will fail HKDF agreement and refuse to pair.

**Blast radius:** Total E2EE pairing compatibility desktop↔mobile; any unilateral
change bricks pairing between mismatched builds.

**Beta-blocking:** NO (functionally correct today).

---

## D7 — nudge.json schema mismatch (app parser vs Fabrica-web payload)

**Evidence:** The app's nudge parser requires `{ id: string non-empty,
minVersion?: string, maxVersion?: string }` with semver validation and
min≤max checks (`src/main/updater-nudge.ts:4-8, 24-51`). Fabrica-web instead
serves a richer document with completely different field names:
`{ enabled, channel, minimumVersion, latestVersion, severity, message,
detailsUrl, downloadUrl, enforcedAtVersion, enforceMessage, updatedAt }`
(verified live at `https://fabrica-ai.vercel.app/whats-new/nudge.json`,
512 bytes, Aug 23). Because `id` is `undefined`, `fetchNudge()` hits the guard
at `updater-nudge.ts:25-27` and returns `null` — **the What's New nudge
silently never fires** (graceful null path; no crash).

**Options:**
1. Fabrica-web renames its payload to the app schema (`id` + `minVersion`/
   `maxVersion`), dropping the extras.
2. App adapts `updater-nudge.ts` to consume the richer schema — note
   `minimumVersion`/`latestVersion` are not the same semantics as the app's
   min/max range, so this needs a mapping decision (e.g. min=minimumVersion,
   max omitted) plus updated tests.

**Recommendation:** Decide which side owns the contract before Beta. Option 1 is
the smallest change; option 2 preserves the extra metadata (severity/message)
that the desktop UI may want anyway.

**Blast radius:** Update-nudge feature only (silent no-op today). Cross-project:
note already filed to the Fabrica-web board by the orchestrator.

**Beta-blocking:** YES-ish for the What's New surface — it is dead code until one
side moves.

---

## D8 — CJK locale catalog corruption (ko/ja/zh) — systemic codepage mangling

**Evidence (orchestrator-verified):** literal `?`-run corruption in the CJK locale
catalogs — `ko.json` has **7,013 lines** containing literal question-mark runs,
`ja.json` **9,869**, `zh.json` **8,183** — versus **2** in `es.json`. This is
classic codepage-loss corruption (CJK text destroyed by a non-UTF-8 round trip).
Critically, the damage **predates the git repository**: the initial commit
(`acbe762`, "Initial commit: Fabrica rebrand of the Orca agentic development
environment") already contains the mangled bytes, and no intact pre-rebrand copy
exists anywhere in history or in `.backup/`/`_sources/`.

**Options:**
1. **Restore-from-frozen — NOT VIABLE.** No intact source exists; nothing to restore from.
2. **External translation (lockstep).** Commission Korean/Japanese/Chinese
   translation of the ~6–7k corrupted user-facing strings per locale as one
   coordinated effort. The only path to genuine CJK coverage.
3. **Immediate en-value fallback for all corrupted keys.** Deterministic script
   replaces every corrupted value with its English counterpart: zero-risk,
   restores a readable UI immediately, but ships untranslated ko/ja/zh locales
   and permanently discards the mangled strings.

**Recommendation:** per KO-CATALOG-ASSESS — ship option 3 now **if** Beta must
include the ko/ja/zh locales; otherwise drop ko/ja/zh from Beta scope and pursue
option 2 post-launch.

**Blast radius:** What's New/UI readability for Korean, Japanese, and Chinese
users only; en/es and all other surfaces unaffected either way.

**PM decision required. Beta-blocking:** ONLY IF CJK locales are included in Beta scope.

---

## I18N-CASING-SWEEP addendum (Aug 23 late cycle)

Read-only sweep of all 5 locale JSONs for residual casing artifacts:
**0 artifacts found.** Zero hits for `FABRICA-dev`, `FABRICA orchestration`,
`FABRICA computer`, `ORCA_`, `StablyAI`, `onFABRICA`. All all-caps `FABRICA`
tokens in prose classify as legitimate: documented CLI-placeholder convention,
real env-var names (`FABRICA_GITEA_*`, `FABRICA_CLOUD_API_URL`,
`FABRICA_TELEMETRY_DISABLED`, `FABRICA_DIAGNOSTICS_DISABLED` — confirmed in src),
the literal filename `FABRICA.yaml` that the runtime reads
(`src/main/hooks.ts:57,89`), FABRICA-prefixed translation lookup keys referenced
from source components, and example-string placeholders. No fixes required.

---

## Infra awareness items (no code decision needed)

| Item | Evidence | Status |
|---|---|---|
| README APK / releases artifact links 404 | `github.com/Auto-Scalers/Fabrica-app/releases/latest/download/fabrica.apk` → 404 (probed Aug 23); no release assets exist yet | Resolves when real releases are cut |
| `www.fabrica-ai.vercel.app` TLS trust fails | TLS handshake fails on the www subdomain while bare domain returns 200 (probed Aug 23); ~18 README links use the www form | Needs Vercel custom-domain config to cover `www` |
| Desktop `fabrica://` deep link has NO OS-level registration | Zero `setAsDefaultProtocolClient`/`registerSchemesAsPrivileged`/`open-url` in src/main; no `protocols:` block or `CFBundleURLTypes` in electron-builder config (DEEPLINK-REG-VERIFY, Aug 23). Mobile registers Expo scheme `fabrica` (`mobile/app.json:9`) | UX gap, not blocker — QR/paste pairing works |
| AUR package names carry the old `stably` brand | `README.md:224-225` instructs `yay -S stably-fabrica-bin` / `stably-fabrica-git`; these are EXTERNAL Arch User Repository package names — renaming requires the external AUR maintainer/action, not a code change. Until renamed, the README install commands 404/fail for Arch users | Non-Beta-blocking (Arch users only) |

## Resolved since compilation

- ✅ Feature-wall annotate-diff asset reference — fixed.
- ✅ `ORCA-RELAY` repro sentinel in `config/scripts/windows-ssh-attach-console-repro.mjs` — fixed.
- ✅ Mixed-case `onFABRICA.dev` literals normalized to lowercase across 10 source
  files + paired tests (DOMAIN-CASE-NORMALIZE, dispatch `ctx_9101664fc88c`).
- ⚠️ Remaining known lint error: `coordinator.test.ts` prefer-as-const — sole
  lint error, owned by APP-F3 worker.

---

## Summary table

| # | Decision | Recommendation | Beta-blocking |
|---|---|---|---|
| D1 | Canonical App ID | Adopt actual `com.autoscalers.fabrica` | No |
| D2 | Production domain | Canonicalize `onfabrica.dev`; HOTFIX updater whats-new URLs now | Yes (updater URLs) |
| D3 | Publish vs feed repo | Reconcile to wherever artifacts actually land; verify in CI | Yes |
| D4 | npm scopes | Fix audio README refs; consider stock playwright dep | No |
| D5 | Link-open enum | Rename to `fabrica-browser` + migrate pref + fix worktreeId.tsx:927 | Yes (mobile build) |
| D6 | E2EE labels | Leave through Beta; lockstep rename later with version bump | No |
| D7 | nudge.json schema | Pick contract owner: web renames fields or app adapts parser | Yes-ish (What's New dead) |
| D8 | CJK catalog corruption | En-value fallback now if Beta ships ko/ja/zh; else drop from Beta, translate post-launch | Only if CJK in Beta scope |
