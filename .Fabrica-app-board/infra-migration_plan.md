# Fabrica Configs & Distribution Migration Plan

> Companion to `STRATEGY/VisualPalette-migration_plan.md`. This document covers **everything that is NOT visual/palette**: metadata, packaging/distribution config, auto-updater & release channels, the deep-link scheme, backend/telemetry endpoints, CLI command names & data directories, CI/CD, Homebrew, and user-visible product-name strings.
>
> All file:line references are against the current `orca/` tree (pre-rebrand). Don't touch `mission-control/`, `old-fabrica/`, `_BACKUP - orca/`.

---

## 1. Rebrand scope (from strategy)

From `STRATEGY/Fabrica-ADE Strategy.md`, the non-visual rebrand goals are:

- **Metadata & Distribution Config** — `package.json`, `electron-builder`, `Fabrica.exe`, build channels.
- **Telemetry Sanitization** — replace `stablyai` analytics with Fabrica-owned servers.
- **Auto-Updater & Releases** — point at `Auto-Scalers/Fabrica` (and dev-channel repos).
- **Deep Linking Scheme** — `orca://` → `fabrica://`.

---

## 2. Metadata & Distribution Configs

### 2.1 `orca/package.json`

| Field | Current | Target |
| --- | --- | --- |
| `name` | `orca` | `fabrica` |
| `description` | "Next-gen IDE for parallel agentic development" | align to Fabrica positioning |
| `homepage` | `https://github.com/stablyai/orca` | `https://github.com/Auto-Scalers/Fabrica` |
| `author` | `stablyai` | `Auto-Scalers` (or Fabrica entity) |
| `bin.orca` / `bin.orca-dev` | `orca` / `orca-dev` | `fabrica` / `fabrica-dev` |
| `repository` (if present) | `stablyai/orca` | `Auto-Scalers/Fabrica` |

### 2.2 `orca/config/electron-builder.config.cjs`

| What | Line | Current | Target |
| --- | --- | --- | --- |
| `appId` | `49` | `com.stablyai.orca` | `com.fabrica.app` (or `com.autoskiller.fabrica`) |
| `productName` | `94` | `'Orca'` | `'Fabrica'` |
| `win.executableName` | `287` | `'Orca'` | `'Fabrica'` |
| `win.nsis.artifactName` | `317` | `orca-windows-setup.${ext}` | `fabrica-windows-setup.${ext}` |
| `win.nsis.shortcutName` / `uninstallDisplayName` | `318-319` | `${productName}` | (auto via productName) |
| `win.extraResources` | `298-303` | `resources/win32/bin/orca.cmd → bin/orca.cmd`, `native/.../.build/orca.exe → bin/orca.exe` | `fabrica.cmd` / `fabrica.exe` (rename source + target) |
| `mac.icon` / `entitlements` | `327-329` | `resources/build/icon.icns` | Fabrica `.icns` (visual task, but path stays) |
| `mac.extendInfo` permission strings | `330-344` | `'Orca allows …'` | `'Fabrica allows …'` |
| `mac.extraResources` | `369-370`, `383-384` | `resources/darwin/bin/orca → bin/orca`, `Orca Computer Use.app` | `fabrica` / `Fabrica Computer Use.app` |
| `mac.extraFiles` | `393` | `orca-notification-status` | `fabrica-notification-status` |
| `dmg.artifactName` | `412` | `orca-macos-${arch}.${ext}` | `fabrica-macos-${arch}.${ext}` |
| `linux.executableName` | `417` | `orca-ide` | `fabrica` (GNOME `orca` conflict no longer applies; verify) |
| `linux.desktop.entry.StartupWMClass` | `425` | `orca` | `fabrica` |
| `linux.extraResources` | `433-434` | `resources/linux/bin/orca-ide → bin/orca-ide` | `fabrica` |
| `linux.maintainer` | `447` | `stablyai` | `Auto-Scalers` |
| `linux.category` | `448` | `Utility` | (keep) |
| `appImage.artifactName` | `451` | `orca-linux(-arm64).${ext}` | `fabrica-linux(-arm64).${ext}` |
| `deb.packageName` / `artifactName` | `454-455` | `orca-ide` | `fabrica` |
| `rpm.packageName` / `artifactName` | `476-477` | `orca-ide` | `fabrica` |
| `publish` | `500-504` | `owner:'stablyai'`, `repo: devChannelRepo ?? 'orca'` | `owner:'Auto-Scalers'`, `repo:'Fabrica'` (+ dev channels) |
| `devChannelRepo` | `42-48` | `orca-hourly` / `orca-daily` / `orca-adhoc` | `fabrica-hourly` / `fabrica-daily` / `fabrica-adhoc` |
| `chmodUnixCliLaunchers` list | `512` | `['orca','orca-ide']` | `['fabrica']` |
| `afterPack` / signing helpers | `208,279,281,393,543,552,570` | `Orca Computer Use.app`, `orca-notification-status`, `ORCA_COMPUTER_MACOS_SIGN_IDENTITY` | `Fabrica Computer Use.app`, `fabrica-notification-status`, `FABRICA_…_SIGN_IDENTITY` |

### 2.3 Homebrew Casks — `orca/Casks/orca.rb`, `orca@rc.rb`

| Field | Current | Target |
| --- | --- | --- |
| `name` | `"Orca"` / `"Orca RC"` | `"Fabrica"` / `"Fabrica RC"` |
| `app` | `"Orca.app"` | `"Fabrica.app"` |
| `binary` | `#{appdir}/Orca.app/.../bin/orca` | `.../bin/fabrica` |
| data dir | `~/Library/Application Support/Orca` | `~/Library/Application Support/Fabrica` |
| tap | `stablyai/homebrew-orca` | `Auto-Scalers/homebrew-fabrica` |

### 2.4 CLI launchers / packaged resources

| File | Current | Target |
| --- | --- | --- |
| `resources/linux/bin/orca-ide` | `orca-ide` | `fabrica` |
| `resources/darwin/bin/orca` | `orca` | `fabrica` |
| `resources/win32/bin/orca.cmd` | `orca.cmd` | `fabrica.cmd` |
| `native/windows-cli-launcher/.build/orca.exe` | `orca.exe` | `fabrica.exe` |
| `resources/linux/packaging/after-install.sh`, `after-remove.sh` | reference `orca-ide` | `fabrica` |

### 2.5 Bundled plugin publisher — `resources/plugins/launch/`

- `stablyai.orca-portuguese/orca-plugin.json`: `publisher:"stablyai"` → `fabrica`; `repository` → Fabrica repo.
- `stablyai.orca-navigation-shortcuts`, `stablyai.orca-multipass-recipes`: rename plugin dirs + `publisher` fields.
- `bundled-plugins.json` / `orca-marketplace.json`: update any `stablyai.*` references.

---

## 3. Runtime CLI command names & data directories (migration-sensitive)

These ship to user machines and carry **user data** — renaming needs a migration path (keep legacy-symlink/relocation logic).

| Concern | File:line | Current | Target |
| --- | --- | --- | --- |
| Dev CLI command | `src/main/cli/cli-installer.ts:31` | `orca-dev` | `fabrica-dev` |
| Linux CLI command | `:32` | `orca-ide` | `fabrica` |
| Legacy linux command | `:33` | `orca` | (drop / migrate) |
| Default command (mac/win) | `:91` | `orca` | `fabrica` |
| Install paths | `:340,343,354` | `~/.local/bin/orca-dev`, `Programs/Orca Dev/bin/orca-dev.cmd`, `~/.local/bin/orca-ide` | `~/.local/bin/fabrica-dev`, `Programs/Fabrica Dev/bin/fabrica-dev.cmd`, `~/.local/bin/fabrica` |
| WSL command | `src/main/cli/wsl-cli-installer.ts:24,25` | `orca-ide` / `orca` | `fabrica` |
| WSL bridge script | `src/main/cli/wsl-cli-scripts.ts:77` | `~/.local/share/orca/orca-wsl-bridge.ps1` | `~/.local/share/fabrica/...` |
| Linux shim | `src/main/cli/linux-terminal-orca-cli-shim.ts:48` | `~/.local/bin/orca` (execs `orca-ide`) | `~/.local/bin/fabrica` (execs `fabrica`) |
| Linux dispatcher | `src/main/cli/linux-bare-orca-dispatcher.ts:43` | `~/.local/bin/orca` (execs `orca-ide`) | `~/.local/bin/fabrica` |
| App config/data dir (mac) | `src/main/codex/codex-home-paths.ts:61` | `~/Library/Application Support/orca` | `.../Fabrica` |
| App config/data dir (win) | `:64` | `%APPDATA%/orca` | `%APPDATA%/Fabrica` |
| App config/data dir (linux) | `:66` | `~/.config/orca` | `~/.config/fabrica` |
| Agent runtime home | many (`~/.local/share/orca/...`) | `orca` | `fabrica` |

> **Migration note:** existing users have worktrees/agent state under `~/.config/orca`, `~/.local/share/orca`, `~/Library/Application Support/orca`. The first Fabrica release should relocate (or symlink) these dirs, or users lose local worktree/agent history.

---

## 4. Auto-Updater & Release Channels

The feed URLs are derived from repo constants — **this is the core of the Auto-Updater & Releases goal**.

**Mechanism (verified):**
- `src/main/updater.ts` loads `electron-updater` lazily (`electron-updater-loader.ts`) and calls `autoUpdater.setFeedURL({ provider: 'generic', url })` where `url` is a GitHub releases *download* URL built from the release-channel repo constants.
- `src/main/updater-release-builds.ts:19-21` (`getReleaseDownloadUrlForRepo`) → `https://github.com/${repo}/releases/download/${tag}`; `:15-17` (`getReleasesApiUrl`) → `https://api.github.com/repos/${repo}/releases`.
- `src/shared/release-channel.ts` holds the repo constants and `getReleaseRepoForChannel(channel)`.
- `src/main/updater.ts:1440,2205` hard-codes a fallback `https://github.com/stablyai/orca/releases/latest/download`.
- `config/electron-builder.config.cjs:500-504` `publish:` (github, `owner:'stablyai'`, `repo:'orca'`) is what CI uses to *publish*; the runtime feeds above are what the *client* consumes (must match).
- Signing/verification: Windows via SignPath (`project-slug: orca`), macOS via Developer ID + notarization; `updater.ts:2199` explicitly keeps electron-updater's built-in Authenticode check (do **not** re-add `verifyUpdateCodeSignature` override). `latest.yml` + `.blockmap` are generated at release time (`release-cut.yml` runs `generate-windows-blockmap.mjs`).

| What | File:line | Current | Target |
| --- | --- | --- | --- |
| Main release repo | `src/shared/release-channel.ts:27` (`MAIN_RELEASE_REPO`) | `stablyai/orca` | `Auto-Scalers/Fabrica` |
| Hourly repo | `:24` | `stablyai/orca-hourly` | `Auto-Scalers/Fabrica-hourly` |
| Daily repo | `:25` | `stablyai/orca-daily` | `Auto-Scalers/Fabrica-daily` |
| Adhoc repo | `:26` | `stablyai/orca-adhoc` | `Auto-Scalers/Fabrica-adhoc` |
| Channel→repo resolver | `:73` (`getReleaseRepoForChannel`) | reads above | (auto via constants) |
| Feed URL builder | `src/main/updater-release-builds.ts:19-21` | `https://github.com/${repo}/releases/download/...` | (auto via repo constants) |
| Releases API URL | `:15-17` | `https://api.github.com/repos/${repo}/releases` | (auto via repo constants) |
| Updater fallback feed | `src/main/updater.ts:1440,2205` | `https://github.com/stablyai/orca/releases/latest/download` | `.../Auto-Scalers/Fabrica/...` |
| electron-builder publish | `config/electron-builder.config.cjs:500-504` | `owner:'stablyai'`, `repo:'orca'` | `owner:'Auto-Scalers'`, `repo:'Fabrica'` |

> The GitHub release **tags** (e.g. `v1.4.178-rc.2`) stay semver; only *owner/repo* changes. Dev-channel builds still need matching `fabrica-hourly`/`fabrica-daily`/`fabrica-adhoc` repos on GitHub, and `devChannelRepo` in `electron-builder.config.cjs:42-48` must be renamed in lockstep.

---

## 5. Deep-link scheme `orca://` → `fabrica://`

Pairing / handoff URLs are generated and parsed as `orca://pair?…` / `orca://pair#…` / `orca://worktree/serve`. **Every literal must change.**

**Important finding (verified):** there is **no OS-level scheme registration anywhere in `src/` or `config/`** — `setAsDefaultProtocolClient`, `registerSchemesAsPrivileged`, `registerStandardSchemes`, and the `app.on('open-url')` / `second-instance` URL handlers were all searched and found absent. The scheme is a **logical token** passed between surfaces (pairing codes, web paste, mobile↔desktop handoff, and the desktop `second-instance` argv for `orca://worktree/serve`). So the rebrand is a **string rename across code + tests**, not an OS-association move — unless you also want true OS-level `fabrica://` opens (see note below).

| Role | File |
| --- | --- |
| Pairing code builder / parser | `src/shared/pairing.ts:26,35,47,62,74` |
| Web pairing input parser | `src/renderer/src/web/web-pairing.ts:26,49,128` |
| Redaction of pairing URLs | `src/shared/ephemeral-vm-recipe-diagnostics.ts:42,62,69` |
| Fixture builder | `src/shared/mobile-relay-pairing-fixtures.ts:139` |
| CLI client error / help | `src/cli/runtime/client.ts:292`, `src/cli/help.ts:284`, `src/cli/specs/environment.ts:10` |
| Mobile IPC | `src/main/ipc/mobile.ts` (pairingUrl) |
| Serve readiness | `src/main/server/serve-readiness.ts` (asserts `orca://pair?…`) |
| Desktop receive via second-instance argv | `src/main/startup/serve-mode-argv.ts` (test fixture `['…\Orca.exe','orca://worktree/serve']`); `src/main/startup/single-instance-lock.ts:47` routes `second-instance` argv |
| CLI launch handler | `src/cli/runtime/launch.ts` / `client.ts` (orca://pair inputs) |

- **Tests assert the literal** `orca://…` in `web-pairing.test.ts`, `pairing.test.ts`, `serve-readiness.test.ts`, `serve-mode-argv.test.ts`, `mobile.test.ts`, `cli/index.test.ts`, `cli/runtime/launch.test.ts`, `ephemeral-vm-*.test.ts` — update fixtures to `fabrica://`.
- **If true OS-level deep links are wanted later:** add `app.setAsDefaultProtocolClient('fabrica')` in `src/main/index.ts` bootstrap (macOS/Linux/Windows) and an electron-builder `protocols:` entry; then handle the incoming URL in `second-instance` / `open-url`. This is optional and out of scope for the string rename.

---

## 6. Telemetry Sanitization (StablyAI → Fabrica)

Orca's analytics is **first-party via PostHog**, plus a first-party diagnostics/crash-upload endpoint. No third-party Sentry key was found.

### 6.1 PostHog analytics — `src/main/telemetry/`
- `client.ts`: single `posthog-node` client; one `track()` funnel. Transmit only when `IS_OFFICIAL_BUILD` (requires **both** `ORCA_BUILD_IDENTITY` ∈ {stable,rc} **and** `ORCA_POSTHOG_WRITE_KEY` injected at build via electron-vite `define`). Dev/contributor builds send nothing.
- `commonProps` includes **`orca_channel`** (`:62`) and `install_id` — rename prop to `fabrica_channel`.
- `consent.ts` (opt-in), `install-id.ts` (per-install id), `cohort-classifier.ts`, `validator.ts`, `burst-cap.ts` — keep behavior; only rename the `ORCA_*` globals + channel prop.
- `config/scripts/verify-telemetry-constants.mjs` greps `const TELEMETRY_ENABLED = true|false` and the `ORCA_*` globals — update its regex when renaming.
- The PostHog **write key is env-injected** (`ORCA_POSTHOG_WRITE_KEY`); there is **no hardcoded `phc_…` key in source** (the `phc_3hhj…` value seen earlier is supplied by CI, not committed). Swap to Fabrica's PostHog project + rename the env var to `FABRICA_POSTHOG_WRITE_KEY`.

| Current | Target |
| --- | --- |
| `ORCA_POSTHOG_WRITE_KEY` (electron-vite `define`) | `FABRICA_POSTHOG_WRITE_KEY` |
| `ORCA_BUILD_IDENTITY` | `FABRICA_BUILD_IDENTITY` |
| `orca_channel` common prop | `fabrica_channel` |

### 6.2 Diagnostics / crash upload — `src/main/observability/`
- `diagnostic-upload-endpoint.ts`: `ORCA_DIAGNOSTICS_TOKEN_URL` (env-injected, default `null`) → upload token endpoint.
- `observability/index.ts`: `uploadDiagnosticBundle()`; honors `ORCA_DIAGNOSTICS_DISABLED`.
- `ipc/diagnostics.ts` calls `uploadDiagnosticBundle`; crash reporting is first-party (`crash-reporting/*`, `CrashReportStore`, breadcrumbs) — **no Sentry**.
- CI sets `ORCA_DIAGNOSTICS_TOKEN_URL=https://www.onorca.dev/diagnostics/token` (mac builds, `release-cut.yml`).

| Current | Target |
| --- | --- |
| `ORCA_DIAGNOSTICS_TOKEN_URL` → `https://www.onorca.dev/diagnostics/token` | `FABRICA_DIAGNOSTICS_TOKEN_URL` → Fabrica diagnostics endpoint |
| `ORCA_DIAGNOSTICS_DISABLED` | `FABRICA_DIAGNOSTICS_DISABLED` |

### 6.3 Other StablyAI backend endpoints (repoint or env-config)

| Endpoint | File |
| --- | --- |
| `https://share.onorca.dev` | `src/main/artifacts/artifact-cloud-config.ts:3` (+ host allow-list `:21`) |
| `https://login.onorca.dev`, `https://relay.onorca.dev` | `src/main/orca-profiles/profile-cloud-auth-config.ts:19,21` |
| `https://www.onorca.dev/v1/feedback` | `src/main/ipc/feedback.ts:17` |
| `https://onorca.dev/changelog`, `/whats-new/*` | `src/main/updater-changelog.ts:13,45`, `updater-nudge.ts:12`, `updater-events.ts:196` |
| `https://relay.onorca.dev` (fixtures) | `src/shared/mobile-relay-pairing-fixtures.ts` |
| `https://onorca.dev/plugins/kill-list.json` | `src/main/plugins/plugin-kill-list-service.ts:10` |
| `https://www.onorca.dev/docs/…` | `src/shared/feature-wall-workflows.ts`, `feature-wall-tiles.ts` |
| Product URL + attribution footer | `src/main/attribution/terminal-attribution.ts:12` (`ORCA_PRODUCT_URL`), `:572,606,1002,1033` ("Made with Orca 🐋" → "Made with Fabrica") |
| `github.com/stablyai/orca` | `terminal-attribution.ts`, `README.md`, `docs/readme/README.*.md`, `ORCA_WINDOWS_SETUP_GUIDE.md`, `CONTRIBUTING.md`, `Casks/*.rb` |

### 6.4 `ORCA_*` env-var rename table (infra-wide)

| Current | Target | Used for |
| --- | --- | --- |
| `ORCA_POSTHOG_WRITE_KEY` | `FABRICA_POSTHOG_WRITE_KEY` | PostHog analytics write key |
| `ORCA_BUILD_IDENTITY` | `FABRICA_BUILD_IDENTITY` | official-build gate (stable/rc) |
| `ORCA_DIAGNOSTICS_TOKEN_URL` | `FABRICA_DIAGNOSTICS_TOKEN_URL` | crash/diagnostics upload token |
| `ORCA_DIAGNOSTICS_DISABLED` | `FABRICA_DIAGNOSTICS_DISABLED` | disable diagnostics |
| `ORCA_TELEMETRY_DISABLED` | `FABRICA_TELEMETRY_DISABLED` | disable telemetry (index.ts honors) |
| `ORCA_MAIN_THREAD_DIAGNOSTICS` | `FABRICA_MAIN_THREAD_DIAGNOSTICS` | main-thread churn probe |
| `ORCA_STARTUP_DIAGNOSTICS` | `FABRICA_STARTUP_DIAGNOSTICS` | startup stall probe |
| `ORCA_BUILD_COMMIT` | `FABRICA_BUILD_COMMIT` | mac build-compat commit stamp (electron-builder afterPack) |
| `ORCA_COMPUTER_MACOS_SIGN_IDENTITY` | `FABRICA_COMPUTER_MACOS_SIGN_IDENTITY` | macOS computer-use helper signing identity |
| `ORCA_GH_PR_FOOTER` / `ORCA_GH_ISSUE_FOOTER` | `FABRICA_GH_PR_FOOTER` / `FABRICA_GH_ISSUE_FOOTER` | attribution footers (`terminal-attribution.ts`) |

> Recommended: move all endpoints behind env vars / a config module so infra can change without a code release.

---

## 7. CI/CD — `.github/workflows`

| Concern | File | Current | Target |
| --- | --- | --- | --- |
| Repo guard | `release-cut.yml:68`, `hourly/daily/adhoc-mac-build.yml`, `readme-downloads-badge.yml:23`, `homebrew-bump.yml` | `github.repository == 'stablyai/orca'` | `'Auto-Scalers/Fabrica'` |
| Dev release repos | `hourly:58`, `daily:66`, `adhoc:77` (`*_REPO`) | `stablyai/orca-hourly|daily|adhoc` | `Auto-Scalers/Fabrica-hourly|daily|adhoc` |
| Homebrew tap | `homebrew-bump.yml:10,137,147,152` | `stablyai/homebrew-orca` | `Auto-Scalers/homebrew-fabrica` |
| Cask bump | `homebrew-bump.yml:73-77,104-108` | `orca`/`orca@rc` tokens, `orca-macos-*.dmg` | `fabrica`/`fabrica@rc`, `fabrica-macos-*.dmg` |
| SignPath project-slug | `release-cut.yml:1278,1489` | `orca` | `fabrica` |
| Diagnostics token URL | `release-cut.yml`, mac builds | `https://www.onorca.dev/diagnostics/token` | Fabrica diagnostics endpoint |
| Windows signing | `release-cut.yml` | signs `Orca.exe`, `orca-windows-setup.exe`, `orca-windows-inner-*` | `Fabrica.exe`, `fabrica-windows-setup.exe` |
| macOS helper signing | mac builds | `Orca Computer Use.app` | `Fabrica Computer Use.app` |
| Release repo scripts | `config/scripts/setup-hourly-release-repo.sh`, `setup-daily-release-repo.sh`, `setup-adhoc-release-repo.sh` | reference `orca-*` repos | `fabrica-*` repos |
| Mobile builds | `mobile-android-release.yml:76,109`, `mobile-ios-release.yml:106,109,140` | `orca-mobile-apk`, `orca-signing.keychain-db`, `orca-dist-cert.p12`, title "Orca Mobile Android" | `fabrica-mobile-*` etc. |

---

## 8. User-visible product-name strings (i18n)

These are the strings a user reads — rename the **English default** to `Fabrica` (keep i18n keys unchanged):

- `src/renderer/src/App.tsx:2094,2097` `translate('auto.App.5096cbbc86','Orca')` (titlebar/sidebar wordmark)
- `src/renderer/src/web/web-preload-api.ts:551` `name:'Orca'`
- `src/renderer/src/components/crash-report/CrashReportDialogSurface.tsx`, `onboarding/OnboardingFlow.tsx:213`, `mobile/slides/HomeSlide.tsx:12`, `status-bar/ResourceUsageStatusSegment.tsx:267`, `lib/remote-pairing-copy.ts:62,88` (`endpoint:'Orca'`), `automations/*` panes, `components/plugin-catalog/plugin-display-name.ts:8` (special-cases `'orca'` casing).
- **Test fixtures**: hundreds of `displayName:'Orca'` / `repo:'orca'` / `'StablyAI'` strings in `*.test.ts(x)` are test data — leave unless they assert user-facing copy.
- **i18n locale catalogs (high volume):** the user-visible product name lives mostly in translation JSON, not just code. `src/renderer/src/i18n/locales/en.json` alone has **621** "Orca" occurrences; every locale file (ko/ja/zh/…) carries localized product-name strings. The rename must sweep **all `locales/*.json`** (replace "Orca"→"Fabrica" in visible copy; keep i18n keys + identifiers like `orca://` intact). See §11.3.
- **Missed docs/privacy URL constants:** `src/renderer/src/lib/telemetry.ts:11` (`PRIVACY_URL=https://www.onorca.dev/docs/telemetry`), `src/renderer/src/components/sidebar/SidebarSettingsHelpMenu.tsx:38-39` (`DOCS_URL=https://www.onorca.dev/docs`, `CHANGELOG_URL=https://onorca.dev/changelog`).

---

## 9. Scope / risk notes

- This is a **large** surface (100s of references). Keep edits surgical; do not rewrite working logic.
- Respect Orca's cross-platform + remote-wire-compat + Git-provider constraints (`orca/AGENTS.md`): renaming `appId`, deep-link scheme, and data dirs can break previously-paired clients, saved shortcuts, and local worktree/agent state — coordinate with a **major version bump** and ship data-dir migration.
- Many references are in tests; prefer global rename with care, then run `pnpm lint` / `vitest` in `orca/`.
- The deep-link OS-registration call was **not** found via the standard Electron APIs in `src/` — confirm its location before renaming the scheme, or the app won't receive `fabrica://` opens.

---

## 10. Ordered checklist (configs)

1. **Repo/package metadata:** `package.json` (name/author/homepage/bin/description) + `src/shared/release-channel.ts` repo constants (`Auto-Scalers/Fabrica` + dev repos).
2. **electron-builder:** `appId`, `productName`, `executableName`, `artifactName` (`fabrica-*`), permission strings, helper app names, `publish` owner/repo, `devChannelRepo` names, `chmodUnixCliLaunchers` list.
3. **CLI + data dirs:** `cli-installer.ts`, `wsl-cli-installer.ts`, shim/dispatcher, `codex-home-paths.ts`; rename resources bins (`fabrica`/`fabrica.cmd`/`fabrica.exe`); add data-dir migration.
4. **Deep link:** register `fabrica://`; rename all `orca://` literals + tests.
5. **Auto-updater feed:** `updater-release-builds.ts`, `updater.ts` fallback URLs (auto via repo constants).
6. **Backend/telemetry:** repoint or disable `onorca.dev` + PostHog to Fabrica infra (env-configurable); update `terminal-attribution.ts` product URL/footer; update docs/README links.
7. **CI/CD:** `.github/workflows` repo guards, dev repos, Homebrew tap/cask, SignPath slug, signing artifact names, `config/scripts/*-release-repo.sh`, mobile build names.
8. **Homebrew + plugins:** `Casks/orca.rb`/`orca@rc.rb`, plugin `publisher` fields.
9. **Display strings:** replace user-visible `'Orca'` defaults with `'Fabrica'`.
10. **Verify:** `pnpm lint` + `vitest` in `orca/`; cut a smoke release to `Auto-Scalers/Fabrica` and confirm updater feed + deep link resolve.

---

## 11. Additional gaps found in audit (2026-08-12)

### 11.1 Plugin marketplace trust (critical — was missed)
- `src/shared/plugins/plugin-marketplace.ts:9-11` — `OFFICIAL_PLUGIN_PUBLISHER='stablyai'`, `OFFICIAL_MARKETPLACE_OWNER='stablyai'`, marketplace git URL `github.com/stablyai/orca-plugins.git`. These gate which plugins are treated as trusted/official. Renaming requires re-signing/migrating the `stablyai.orca-*` plugins under the new publisher, or updating these constants + the plugin trust allowlist.
- `resources/plugins/launch/orca-marketplace.json` — `owner:"stablyai"`, plugin ids `stablyai.orca-*`, git URLs `stablyai/orca-*`.
- `resources/plugins/launch/bundled-plugins.json` — plugin key/path `stablyai.orca-navigation-shortcuts`.
- Review together with `src/main/plugins/plugin-install-trust.ts` and `plugin-marketplace-provenance.ts` (stablyai provenance refs).

### 11.2 Auto-updater dev config + release scripts (missed)
- `config/dev-app-update.yml` — `owner: stablyai`, `repo: orca`, `updaterCacheDirName: orca-updater`. Dev-only electron-updater source used to test the update flow on a dev build. Repoint to Fabrica org/repo + rename cache dir.
- `src/main/updater-prerelease-feed.ts:5-13` — hard-coded `github.com/stablyai/orca/releases.atom`, releases download base, and tag regex. Runtime prerelease feed — must repoint.
- Release scripts: `config/scripts/create-draft-release.mjs:183`, `publish-complete-draft-releases.mjs:160`, `verify-release-required-assets.mjs:153`, `latest-stable-release.mjs` — default `GITHUB_REPOSITORY || 'stablyai/orca'`.
- `config/scripts/setup-*-release-repo.sh`, `macos-launch-diagnostics.sh` — orca repo references; `build-computer-macos.mjs`, `build-notification-status-macos.mjs` — build "Orca Computer Use" / notification-status helper apps (names/app ids).
- `config/reliability-gates.jsonc` — ~30 `stablyai/orca` issue/PR links (incl. one `stablyai/orca-cloud`); provenance refs in CI gate defs. Mostly historical motivating links — review and replace the relevant ones (or annotate as upstream references).
- `config/i18n-translation-source.md` — references `stablyai/orca` PR.

### 11.3 i18n locale catalogs (high volume — missed)
- The user-visible product name lives mostly in translation JSON, not just code: `src/renderer/src/i18n/locales/en.json` alone contains **621** occurrences of "Orca". Every locale file (ko, ja, zh, …) carries localized "Orca" strings.
- A rename must sweep **all `locales/*.json`** (replace "Orca"→"Fabrica" while preserving sentence structure; do NOT change i18n keys or identifiers like `orca://`).
- Missed code constants that also feed visible/docs links:
  - `src/renderer/src/lib/telemetry.ts:11` — `PRIVACY_URL = https://www.onorca.dev/docs/telemetry`
  - `src/renderer/src/components/sidebar/SidebarSettingsHelpMenu.tsx:38-39` — `DOCS_URL=https://www.onorca.dev/docs`, `CHANGELOG_URL=https://onorca.dev/changelog`

### 11.4 Mobile & native companion apps (out of desktop-first scope — track separately)
The desktop Fabrica can ship without renaming these, but "fully our own" eventually needs:
- **Mobile app (`mobile/`):** bundle id `com.stablyai.orca`; display name "Orca" (`mobile/app/about.tsx:54`); `onorca.dev/privacy` (`settings.tsx:215`); `github.com/stablyai/orca` (`about.tsx`, `settings.tsx:223`); relay endpoint `relay.onorca.dev`; `ProtocolBlockScreen.tsx` copy "Update Orca Mobile"; iOS podspec source `stablyai/orca`.
- **Native macOS helper (`native/computer-use-macos/`):** Swift modules `OrcaComputerUseMacOS` / `OrcaComputerUseMacOSCore`; `main.swift:4044-4045` matches bundle id `com.stablyai.orca` + `com.stablyai.orca.dev.*` for TCC/permissions. Built by `config/scripts/build-computer-macos.mjs`.
- **Hard dependency:** `src/main/computer/macos-computer-use-permissions.ts` and `src/main/ipc/mobile.ts` match these `com.stablyai.orca*` identifiers to detect the paired mobile app / computer-use helper. **Do NOT rename `com.stablyai.orca` on desktop alone** — it breaks desktop↔mobile pairing and the macOS computer-use permission flow unless the mobile app + native helper are renamed in lockstep.

### 11.5 Catch-all: `com.stablyai` / `stablyai` constants across `src`
At implementation, run `grep -rn "stablyai\|com.stablyai" src config resources`. Additional known spots (some are genuinely orca-specific identifiers, not product name):
`src/main/ipc/notifications.ts`, `pty.ts`, `macos-tcc-prompt-watch.ts`, `computer/macos-computer-use-permissions.ts`, `plugins/plugin-install-trust.ts`, `plugin-marketplace-provenance.ts`, `github/client.ts`, `src/shared/github-project-types.ts`, `local-build-compatibility-contract.json/.ts`, `agent-feature-install-commands.ts`, `tui-agent-config.ts`, `startup/configure-process.ts`, `dev-instance-identity.ts`, `hydrate-shell-path.ts`, `src/cli/specs/core.ts`, `project.ts`, plus tests `check-reliability-gates.test.mjs`, `electron-builder-mac-channel-config.test.mjs`, `mac-build-compatibility.test.mjs`, `locale-ko-key-overrides.json`.
Rule: only rename where the value is the **Fabrica product identity**; leave cross-device/helper identifiers until §11.4 is sequenced.

### 11.6 Prerequisites / blockers outside code
To truly "make it our own", these must exist before/with the code rebrand:
- **Domains:** own `fabrica.dev` (and `api.` / `relay.` / `update.` / `share.` / `login.` subdomains). Currently `onorca.dev`. **Status (Aug 2026): domain/website NOT yet acquired — open task.** Until owned, the Fabrica-branded telemetry/diagnostics/docs/changelog endpoints (§6, §9.1) cannot point at real Fabrica URLs; they must either stay pointing at `onorca.dev`, or be temporarily routed to GitHub Pages / a placeholder until the domain lands. This is a blocker for full telemetry/diagnostics cutover, not for the desktop rename itself.
- **Code signing:** new Apple Developer ID + notarization cert (macOS) under Fabrica entity; Windows SignPath org slug changed `orca`→`fabrica` (§7).
- **App Store / distribution:** new iOS App Store app record (current `apps.apple.com/us/app/orca-ide/id6766130217` + TestFlight `YjeGMQBA` belong to stablyai); new Android release channel (current APKs published to `stablyai/orca` releases).
- **GitHub orgs/repos:** `Auto-Scalers/Fabrica` (+ `-hourly/-daily/-adhoc`), `fabrica-plugins` (was `orca-plugins`), plugin repos (`stablyai.orca-*` → renamed), `fabrica-cloud` (was `orca-cloud`). Update every default-repo fallback.
- **Plugin publisher migration:** re-sign `stablyai.orca-*` plugins under the new publisher (§11.1).
- **Mobile backend:** if `mobile/` uses a stablyai Firebase/push project, migrate ownership.

### 11.7 Revised sequencing
**Safe in the desktop-first pass:** window chrome/icons, About, Sidebar/Settings links, docs URLs, auto-updater feed + `dev-app-update.yml` + release scripts (once repos/signing ready), installer/artifact naming, `productName`, and all **user-visible English + i18n "Orca"→"Fabrica" strings**.
**Do NOT rename** `com.stablyai.orca` / `stablyai.orca-*` / `ORCA_COMPUTER_MACOS_SIGN_IDENTITY` bundle/identifier constants until **mobile app + native computer-use helper + plugin publisher** are migrated together (§11.1, §11.4), or desktop↔mobile pairing, plugin trust, and macOS computer-use permissions will break.
