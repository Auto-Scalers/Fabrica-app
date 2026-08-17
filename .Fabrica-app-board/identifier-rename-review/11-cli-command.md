# 11. `orca` CLI command — the terminal command

## What it is
Users (and scripts) run the app from a terminal via a command like `orca`, `orca-dev`, `orca-ide`. These are the words a developer **actually types** — the most visible "non-UI" surface we have.

## Where it lives
- Command definitions: `src/main/cli/cli-installer.ts:31-33,91`, `wsl-cli-installer.ts`, shim/dispatcher files
- Packaged binaries: `orca.cmd` / `orca.exe` (Windows), `orca` (mac), `orca-ide` (Linux)
- `package.json` `bin` mapping, plus `src/cli/**` help text & bundled skill guides

## Visible to users?
**Yes — constantly.** Terminal autocomplete, CI scripts, docs, skill guides.

## Options

### Option A — Add `fabrica` as a new alias; keep `orca` working (Recommended)
Benefit: users can type `fabrica` (brand-correct) while every existing script, muscle-memory command, and skill guide that says `orca` keeps working. Zero breakage; docs can standardize on `fabrica` and mention `orca` is the legacy alias.
Tradeoff: two command names exist side-by-side; slightly more installer/packaging surface (`fabrica.cmd` + `orca.cmd`), and you must keep the alias alive for a long time.

### Option B — Rename fully to `fabrica`; drop `orca`
Benefit: single clean command name; most thorough brand.
Tradeoff: **everything referencing `orca` breaks** — bundled skill guides (which literally instruct agents to run `orca ...`), CI, user scripts, and muscle memory. This is the "massive refactor that can corrupt something working" risk you've been avoiding. Not recommended at this stage.

### Option C — Rename fully now, keep a thin `orca` → `fabrica` shim
Benefit: looks renamed, still compatible.
Tradeoff: roughly same work as B but with a compat wrapper; still must update all `src/cli/**` help/skill-guide prose and tests.

## Recommendation
**Option A — ship `fabrica` as the primary command and keep `orca` as an alias**, initially for at least a few releases. This is the "presentation" approach: the product is Fabrica, but we never break the command surface that automation and docs depend on. Update `src/cli/**` help text to present `fabrica` as primary (kept as CLI-infra, matching this review's scope), and keep `orca` documented as legacy.

Effort: Medium (installer + packaging + a compatibility alias). Value: high brand impact, zero breakage.

## ✅ DECIDED (2026-08-13)
**Option C — full rename to `fabrica` with a thin `orca` → `fabrica` shim, shipped under the both-sides rule.** "No loss of functionality" is guaranteed only if **every writer AND every reader is renamed in one coordinated release** (same rule as item 02): help text (`help.ts`), command suggestions (`command-suggestion.ts`), error prose (`format.ts`), all 8 bundled skill guides, installer/PATH/uninstaller names, `package.json` bin, and every test that pins `orca`. The `orca` shim stays as insurance against any missed reference; it is not a permanent peer command. This ships together with items 10 (install path), 02 (env vars), and 06 (git trailer).