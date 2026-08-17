# Naming Update Plan: Auto-Scalers → AutoScalers + Fabrica-app

## Context
- **GitHub org**: `Auto-Scalers` (UNCHANGED — user confirmed)
- **Old repo name**: `Fabrica` (under `Auto-Scalers`)
- **New repo name**: `Fabrica-app` (under `Auto-Scalers`)
- **New repo URL**: `https://github.com/Auto-Scalers/Fabrica-app`
- **Landing page**: `https://fabrica-ai.vercel.app/` (add where "Fabrica website" is needed)
- **npm publisher**: `autoscalers` (all lowercase, no separator)
- **Plugin directories**: `auto_scalers.fabrica-*` → `autoscalers.fabrica-*`
- **Folder rename**: `orca/` → `Fabrica-app/`
- **Product name**: `Fabrica` (unchanged)

## Naming Variants by Context

| Context | Old | New |
|---------|-----|-----|
| GitHub org in URLs | `Auto-Scalers` | `AutoScalers` |
| GitHub org in `--repo` flags | `Auto-Scalers/Fabrica` | `AutoScalers/Fabrica-app` |
| GitHub org in API paths | `repos/Auto-Scalers/Fabrica` | `repos/AutoScalers/Fabrica-app` |
| GitHub org avatar URL | `Auto-Scalers.png` | `AutoScalers.png` |
| npm publisher (plugin IDs) | `auto_scalers` | `autoscalers` |
| Plugin directory names | `auto_scalers.fabrica-*` | `autoscalers.fabrica-*` |
| Plugin folder prefix in JSON | `auto_scalers` | `autoscalers` |
| `OFFICIAL_MARKETPLACE_OWNER` | `auto-scalers` | `autoscalers` |
| `OFFICIAL_PLUGIN_PUBLISHER` | `auto_scalers` | `autoscalers` |
| Product display name | `Fabrica` | `Fabrica` (unchanged) |
| Repo name in URLs | `Fabrica` | `Fabrica-app` |

## Scope (170+ files affected)

### Critical Production Files (non-test)
1. `src/main/github/client.ts` — `FABRICA_REPO = 'Auto-Scalers/Fabrica'`
2. `src/main/updater.ts` — release download URLs
3. `src/main/updater-prerelease-feed.ts` — atom feed URL
4. `src/main/attribution/terminal-attribution.ts` — footer strings
5. `src/shared/agent-feature-install-commands.ts` — skills repo URL
6. `src/shared/plugins/plugin-marketplace.ts` — plugin source URL, OFFICIAL_MARKETPLACE_OWNER
7. `src/shared/github-project-types.ts` — repo type
8. `src/shared/release-channel.ts` — release repos
9. `src/shared/tui-agent-config.ts` — comment reference
10. `src/renderer/src/components/Landing.tsx` — FABRICA_GITHUB_URL
11. `src/renderer/src/components/StarNagCard.tsx` — FABRICA_REPO_URL
12. `src/renderer/src/components/star-nag/StarNagToastHost.tsx` — FABRICA_REPO_URL
13. `src/renderer/src/components/github-project/ProjectViewWrapper.tsx` — feature request URL
14. `src/renderer/src/components/terminal-pane/TerminalErrorToast.tsx` — issues link
15. `src/renderer/src/components/sidebar/SidebarSettingsHelpMenu.tsx` — GITHUB_URL
16. `src/renderer/src/components/sidebar/SidebarFeedbackDialog.tsx` — GITHUB_ISSUES_URL
17. `src/renderer/src/components/settings/GeneralSupportSection.tsx` — FABRICA_GITHUB_URL
18. `src/renderer/src/components/settings/MobileSettingsPane.tsx` — APK download URL
19. `src/renderer/src/components/mobile/mobile-platform-copy.ts` — APK download URL
20. `src/renderer/src/components/link-routing-preference-dialog.tsx` — demo URL
21. `src/renderer/src/components/stats/ShareUsageButton.tsx` — repo identifier
22. `src/renderer/src/components/stats/share-card-utils.tsx` — repo identifier
23. `src/renderer/src/i18n/locales/en.json` (+ zh/ko/ja/es) — locale strings
24. `src/main/ipc/pty.ts` — code comment
25. `package.json` — homepage field
26. `resources/plugins/launch/fabrica-marketplace.json` — plugin git URLs
27. `resources/plugins/launch/auto_scalers.fabrica-*/fabrica-plugin.json` — plugin repos
28. `config/reliability-gates.jsonc` — issue/PR links (175 occurrences!)
29. `config/electron-builder.config.cjs` — build config
30. `config/dev-app-update.yml` — update config
31. `config/scripts/setup-hourly-release-token.sh` — release repos
32. `config/scripts/create-draft-release.mjs` — default repo
33. `config/scripts/latest-stable-release.mjs` — default repo
34. `config/scripts/publish-complete-draft-releases.mjs` — default repo
35. `config/scripts/verify-release-required-assets.mjs` — default repo
36. `config/scripts/macos-launch-diagnostics.sh` — diagnostic repo
37. `Casks/fabrica.rb` + `Casks/fabrica@rc.rb` — Homebrew casks
38. `src/main/plugins/plugin-install-trust.ts` — error message
39. `src/main/startup/hydrate-shell-path.ts` — path
40. `src/main/startup/configure-process.ts` — path
41. `src/cli/specs/core.ts` — CLI examples
42. `src/cli/specs/project.ts` — CLI examples
43. `mobile/app/settings.tsx` — mobile settings
44. `mobile/app/about.tsx` — mobile about
45. `mobile/src/components/ProtocolBlockScreen.tsx` — mobile protocol
46. `mobile/packages/expo-two-way-audio/package.json` — podspec source
47. `mobile/packages/expo-two-way-audio/ios/ExpoTwoWayAudio.podspec` — podspec source

### Test Files (~127 files)
All test files with `Auto-Scalers/Fabrica` references need updating.

### Folder Rename
- `orca/` → `Fabrica-app/`

## Replacement Patterns

### Pattern 1: GitHub org + repo (most common)
- `Auto-Scalers/Fabrica` → `AutoScalers/Fabrica-app`
- `Auto-Scalers/Fabrica.git` → `AutoScalers/Fabrica-app.git`
- `Auto-Scalers/Fabrica-hourly` → `AutoScalers/Fabrica-hourly` (keep repo name)
- `Auto-Scalers/Fabrica-daily` → `AutoScalers/Fabrica-daily` (keep repo name)
- `Auto-Scalers/Fabrica-adhoc` → `AutoScalers/Fabrica-adhoc` (keep repo name)
- `Auto-Scalers/Fabrica-plugins` → `AutoScalers/Fabrica-plugins` (keep repo name)
- `Auto-Scalers/Fabrica-skills` → `AutoScalers/Fabrica-skills` (keep repo name)
- `Auto-Scalers/Fabrica-marketing-website` → `AutoScalers/Fabrica-marketing-website` (keep repo name)
- `Auto-Scalers/fabrica-plugins` → `AutoScalers/fabrica-plugins` (keep repo name)
- `Auto-Scalers/fabrica-cloud` → `AutoScalers/fabrica-cloud` (keep repo name)
- `Auto-Scalers/fabrica-notes` → `AutoScalers/fabrica-notes` (keep repo name)
- `Auto-Scalers/fabrica-portuguese` → `AutoScalers/fabrica-portuguese` (keep repo name)
- `Auto-Scalers/fabrica-multipass-recipes` → `AutoScalers/fabrica-multipass-recipes` (keep repo name)
- `Auto-Scalers/fabrica-navigation-shortcuts` → `AutoScalers/fabrica-navigation-shortcuts` (keep repo name)
- `Auto-Scalers/Fabrica-internal` → `AutoScalers/Fabrica-internal` (keep repo name)

### Pattern 2: npm publisher
- `auto_scalers` → `autoscalers` (in plugin IDs, publisher names)
- `auto-scalers` → `autoscalers` (in marketplace owner constant)

### Pattern 3: Org avatar
- `Auto-Scalers.png` → `AutoScalers.png`

### Pattern 4: Display text in UI
- `Auto-Scalers` → `AutoScalers` (in user-facing strings)

## Execution Plan

### Phase 1: Bulk rename `Auto-Scalers` → `AutoScalers` (org name only)
This covers patterns 1, 3, and 4. Run across all files except `_BACKUP - orca/`, `node_modules/`, `out/`.

### Phase 2: Update repo name `Fabrica` → `Fabrica-app` in URLs
Only in GitHub URL contexts (not in product name contexts). This is the trickiest part because `Fabrica` is also the product name. Need to be careful with:
- `Auto-Scalers/Fabrica` → `AutoScalers/Fabrica-app` (GitHub repo refs)
- `Fabrica` as product name → stays `Fabrica`
- `FABRICA_REPO` constant → `'AutoScalers/Fabrica-app'`
- `repos/AutoScalers/Fabrica` → `repos/AutoScalers/Fabrica-app` (API paths)

### Phase 3: Update npm publisher
- `auto_scalers` → `autoscalers` in plugin directories and JSON files
- `auto-scalers` → `autoscalers` in marketplace owner constant
- Rename plugin directories: `auto_scalers.fabrica-*` → `autoscalers.fabrica-*`

### Phase 4: Add landing page URL
- Add `fabrica-ai.vercel.app` references where needed (currently 0 matches)

### Phase 5: Folder rename
- `orca/` → `Fabrica-app/`

### Phase 6: Verify
- Run tests
- Run lint
- Check for broken references

## Risks & Questions for User

1. **Plugin directories**: Should `auto_scalers.fabrica-*` → `autoscalers.fabrica-*`? This changes plugin IDs.
2. **`OFFICIAL_MARKETPLACE_OWNER`**: Currently `auto-scalers` (dash). Should be `autoscalers` (no separator)?
3. **`OFFICIAL_PLUGIN_PUBLISHER`**: Currently `auto_scalers` (underscore). Should be `autoscalers`?
4. **`Fabrica-app` vs `Fabrica`**: In GitHub URLs, we use `Fabrica-app` (the repo name). In product name/display, we keep `Fabrica`. Correct?
5. **Landing page**: Where should `fabrica-ai.vercel.app` be referenced? Just in the UI links? Or also in code?
6. **Sub-repos**: `Fabrica-hourly`, `Fabrica-daily`, `Fabrica-plugins`, etc. — do they also move to `AutoScalers` org? The repo names stay the same?
