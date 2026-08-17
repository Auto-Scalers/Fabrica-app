# Identifier Rename Review — "Orca" leftovers

> Companion to `STRATEGY/infra-migration_plan.md` and `STRATEGY/VisualPalette-migration_plan.md`.
> Decides what to do with the **non-visible "Orca" identifiers** that the display-string sweep deliberately left alone.
> One file per item. Written for a Product Manager, not an engineer.

## The big fact that shapes all of this

**We have 0 users right now.** That means every warning about "users lose data / get logged out / lose their session" is **moot** —
those only happen when a *current* user upgrades an already-installed app. With zero installs there is:

- no saved logins to lose,
- no data folders to migrate,
- no installed firewall rules / TLS certs / helper apps to orphan.

So almost every item below is **safe to rename now**. The only remaining reasons to keep "Orca" are:
1. It's **invisible to users** (so a rename gives zero brand value, only engineering cost/risk).
2. Two parts of **our own product** must be renamed *together* or they stop talking to each other.

## Quick-decision table

**Status key:** ✅ done · 🟡 in progress · ⬜ not started

| # | Item | Group | Visible? | Decision | Planning | Impl. | File |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 7 | App name / About / menu / productName | 🔵 A | **Yes** | Option A — display name now; `appId` deferred | ✅ | ✅ | [07-app-name-and-menu.md](07-app-name-and-menu.md) |
| 8 | Windows firewall rule | 🔵 A | Yes | Option C — rename with A's release | ⬜ | ⬜ | [08-firewall-rule.md](08-firewall-rule.md) |
| 12 | `Orca Computer Use.app` helper | 🔵 A | Mostly no | Option A — helper name now; bundle id deferred | 🟡 | ⬜ | [12-computer-use-app.md](12-computer-use-app.md) |
| 11 | `orca` CLI command | 🟢 B | Yes | Option C — full rename + `orca` shim (both-sides rule) | ✅ | ⬜ | [11-cli-command.md](11-cli-command.md) |
| 10 | Windows install path (+ download artifacts) | 🟢 B | Yes | Option C — rename with item 11 | ✅ | ⬜ | [10-install-path.md](10-install-path.md) |
| 2 | Environment variables (`ORCA_*`) | 🟢 B | No | Full rename to `FABRICA_*` + CI/telemetry | ✅ | 🟡 | [02-environment-variables.md](02-environment-variables.md) |
| 6 | `Co-authored-by` git trailer | 🟢 B | Yes | Option A — rename now (via item 02) | ✅ | ⬜ | [06-git-coauthor-trailer.md](06-git-coauthor-trailer.md) |
| 4 | Keychain service | 🟠 C | No | Option A — rename now | ✅ | ✅ | [04-keychain-service.md](04-keychain-service.md) |
| 9 | TLS certificate | 🟠 C | Yes | Option C — rename whole identity (touches 04) | ✅ | ✅ | [09-tls-certificate.md](09-tls-certificate.md) |
| 5 | Data folders / `.orca` paths | 🟠 C | No | Option A — rename now — ⛔ blocked on app name (item 07) | ⬜ | ⬜ | [05-data-directories.md](05-data-directories.md) |
| 1 | Wire tokens | ⚪ D | No | Rename to `fabrica_*` | ✅ | ✅ | [01-wire-tokens.md](01-wire-tokens.md) |
| 3 | Plugin `engines.orca` field | ⚪ D | No | Full takeover | ⬜ | ⬜ | [03-plugin-engines-field.md](03-plugin-engines-field.md) |

**Groups (ship together):** 🔵 **A** Identity lockstep — one bundle-id release (appId + mobile + helper, infra §11.4) · 🟢 **B** CLI command surface — CLI + install + env + trailer · 🟠 **C** Storage identity — one sweep (keychain + TLS + data dirs) · ⚪ **D** Standalone — own release, no coupling

> **How to update this table:** an item becomes 🟡 in Planning once its decision is locked in its file (recommendation → decided); ✅ when the plan text is finalized. Impl. becomes ✅ only when the code change + tests land. The 🔒 decision that depends on another item is recorded in the item's file; items in the same Group must ship in one coordinated release.

## ⏳ Known remaining `ORCA_` (come back later)

Item 02's bulk rename (`ORCA_` → `FABRICA_*`, 958 files) is applied, **but one `ORCA_` is deliberately still in the repo**:

- **GitHub Actions Secret store key** — `secrets.ORCA_POSTHOG_WRITE_KEY` in:
  - `orca/.github/workflows/release-cut.yml:1148`
  - `orca/.github/workflows/release-mac-build.yml:121`

The **env var name** is already `FABRICA_POSTHOG_WRITE_KEY`; only the GitHub Secret **store key** is still `ORCA_*`. It is external infrastructure, not code — renaming it is an admin action in **Settings → Secrets and variables → Actions** on the repo hosting CI (now `Auto-Scalers/Fabrica`), done together with a build so the workflow doesn't fail with "Secret not found". The PostHog value itself is unchanged. This is safe to leave until the first release to the new repo.

## The one real risk (internal wiring, not users)

Even with 0 users, some identifiers are used by **two halves of our own product at once**:

- Desktop app ↔ mobile app pairing (bundle ids, firewall rule, relay pairing),
- Desktop app ↔ macOS "Computer Use" helper (helper app name + permission prompts),
- Desktop app ↔ remote/headless server (wire tokens).

If we rename one half and not the other, pairing / permissions / handshake break. So the rule is simple:

> **Rename everything user-visible now; keep invisible wire/plugin tokens as "orca"; and for anything two products share, rename both sides in the same release.**

Nothing in this folder requires a data migration because we have 0 users.
