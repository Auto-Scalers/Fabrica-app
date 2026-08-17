# 06. Git co-author trailer — `Co-authored-by: Orca <help@stably.ai>`

## What it is
When you run a command like `orca status --track` or trigger certain automations, Fabrica can auto-append a credit line to a commit: `Co-authored-by: Orca <help@stably.ai>`. It's a standard git convention for crediting the tool in commit messages.

## Where it lives
- `src/shared/orca-attribution.ts:6` — constant
- `src/main/attribution/terminal-attribution.ts:288,727` — injected into shell env as `ORCA_GIT_COMMIT_TRAILER`
- test assertions across `terminal-attribution.test.ts`

## Visible to users?
**Yes** — it lands in actual git commit history that teammates and future readers of the repo see.

## The 0-users impact
None — this is cosmetic from day one.

## Options

### Option A — Rename now to `Co-authored-by: Fabrica <...>` (Recommended)
Benefit: the credit line in real commits says "Fabrica" from the start; no historical commits carry the wrong brand.
Tradeoff: it also changes the email `help@stably.ai` → needs the Fabrica support email/URL (`infra-migration_plan.md` §6.3 covers the product-url swap). Tiny effort.

### Option B — Keep `Co-authored-by: Orca`
Benefit: zero effort.
Tradeoff: every committed line says "Orca" — visible brand leak.

### Option C — Make the trailer configurable (env var already exists)
Benefit: `ORCA_GIT_COMMIT_TRAILER` is already overridable; renaming just changes the *default*.
Tradeoff: none beyond Option A's.

## Recommendation
**Option A — rename the default trailer text and the `help@stably.ai` email at the same time.** Small, isolated change (`orca-attribution.ts` + the two shell templates + tests). Do it whenever the Fabrica support identity is confirmed (pick the email/URL once, reuse the same value as the product URL swap in §6.3).

Effort: Low. Value: visible, self-explanatory.

## ✅ DECIDED (2026-08-13)
**Option A — rename now to `Co-authored-by: Fabrica <...>`.** Default trailer text + support email/URL change together (`src/shared/orca-attribution.ts`, the `ORCA_GIT_COMMIT_TRAILER`/footer shell templates in `terminal-attribution.ts`, and tests). Ships in the coordinated Group B release with items 02 (the `ORCA_GIT_COMMIT_TRAILER` env var is renamed to `FABRICA_*` there), 10, and 11.