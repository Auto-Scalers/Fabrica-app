# APP-F3 W1 Triage Report — Lint + Test Pass (Aug 23, 2026)

Dispatch `ctx_a8e364e22424` / task `task_e88d00622ee7`. Orchestration `worker_done` was rejected
(`dispatch_capability_invalid`, then `capability revoked` — dispatch superseded by later rounds), so
this file is the durable handoff. Board row APP-F3 → 👀 VERIFY; Rollup recounted; Session Ledger row
`term_389399d8-5acf-4c8b-9a73-d33c9396e5bc` closed.

## Results

| Check | Result |
|---|---|
| Lint (full chained pipeline) | ✅ GREEN — oxlint, audit:code-quality:native (--deny-warnings), audit:code-quality:type-aware (--deny-warnings), reliability-gates (74), max-lines-ratchet, bundled-skill-guides, skill-bundle-manifest, localization-catalog/extraction/coverage |
| Typecheck (node/cli/web tsconfigs) | ✅ 0 errors — delta **-7** vs the ~7 known pre-existing test-file errors (all resolved by earlier waves) |
| Desktop vitest suite (full run) | 48,777 passed / 475 failed / 649 skipped (~99% pass); residual failures triaged below |

## Brand-casualty failures FIXED (each touched file re-run green; oxfmt + oxlint clean)

1. `src/main/persistence.test.ts` (9 failures) — expectations used impossible mixed-case ids
   (`github:Auto-Scalers/Fabrica-app`) while production derives lowercased `github:owner/repo`
   (`github-repository-identity-key.ts:16`) and `createProjectHostSetup` does exact-match lookup.
   Fixed ids + fork-merge fixtures to preserve case-insensitivity test intent; upstream trim-only
   normalization expectation corrected.
2. `src/renderer/src/components/terminal-pane/pty-connection.test.ts` (17 failures) — fixtures were
   encoding-corrupted in the initial commit: CJK strings → `????`, π → `p`, Cursor-Agent `→` marker →
   `?`, braille spinner → `?`; Command Code prompt/status markers needed `[❯>]`/glyph sets. Also a
   PR-slug case mismatch (`acme/FABRICA` fixture vs lowercase slug expectation). Restored real
   characters; 567/567 green.
3. `src/renderer/src/components/sidebar/worktree-list-groups.test.ts` (3) — setup header keys were
   missing the `-app` segment vs fixture project ids. 111/111 green.
4. `src/main/repo-icon-autodetect.test.ts` (1) — mechanical rename made origin/upstream repo names
   differ, flipping production into renamed-fork avatar semantics. Fixtures re-aligned; 14/14 green.

## Windows-environment bugs FIXED

5. `src/main/git/status-branch-line-total-exec-contract.test.ts` — deterministic `EBUSY` on rmdir of
   temp repos racing the just-spawned git child; teardown retry added per the repo's established
   pattern (`host-tree-removal.ts`). 17/17 green.
6. `src/main/git/worktree-shared-directories.test.ts` + `src/main/skills/skill-git-tree-identity.test.ts`
   — `GIT_CONFIG_GLOBAL=os.devNull` (`\\.\nul`) is rejected by git on Windows ("unable to access
   '//./nul'", exit 128), cascading ~20+ failures incl every `git init`. Use `NUL` on win32. Both files green.
7. `src/shared/feature-interactions.test.ts` — whole-source-tree scan test exceeded its own 15s
   timeout on cold Windows FS/AV scans; raised to 60s. Green.

## Residual failures (~475) — triaged NON-brand, Windows-environment (present at baseline acbe762)

- POSIX-only suites spawning `/bin/sh` (ENOENT on Windows)
- macOS-only APIs: TCC prompt localization, `app.getName`, NSWorkspace/file-url tests
- Symlink-privilege-dependent discovery (e.g. `node-markdown-document-discovery`)
- Cross-version wire harness requiring repo release tags (0 tags present)
- Watcher-child infra: on Windows `subscribeViaWatcherProcess` routes through a real child,
  bypassing the `@parcel/watcher` mock → 7 deterministic failures in
  `filesystem-watcher-local-unsubscribe.test.ts` (+ literal `/tmp/repo` key assumptions)
- A few files belong to concurrent workers' in-flight edits (e.g. profile-cloud-client fetch-audit)

Recommendation: open a dedicated WIN-TEST-INFRA task rather than hacking tests.

## Constraints honored

No commits/pushes; no edits to `.backup/`, `_sources/`, `src/main/runtime/relay/*`, or
`electron.vite.config.ts`.
