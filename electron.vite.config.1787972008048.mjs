// electron.vite.config.ts
import { isBuiltin } from "node:module";
import { resolve } from "node:path";
import { defineConfig } from "electron-vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// src/main/startup/bootstrap-fatal-exit-guard.ts
var BOOTSTRAP_FATAL_EXIT_GUARD_KEY = "__FABRICA_BOOTSTRAP_FATAL_EXIT_GUARD__";

// config/build-plugins/bootstrap-fatal-exit-banner.ts
var BOOTSTRAP_FATAL_LOG_ENV_VAR = "FABRICA_BOOTSTRAP_FATAL_LOG";
var BOOTSTRAP_FATAL_LOG_FILE_NAME = "bootstrap-fatal.log";
var BOOTSTRAP_FATAL_LOG_MAX_BYTES = 262144;
function createBootstrapFatalExitBanner() {
  return `
;(() => {
  const guardKey = ${JSON.stringify(BOOTSTRAP_FATAL_EXIT_GUARD_KEY)}
  if (typeof globalThis[guardKey] === 'function') {
    return
  }
  const describeBootstrapError = (error) => {
    try {
      const detail = error && typeof error === 'object' && error.stack ? error.stack : error
      return String(detail).split('\\n').slice(0, 12).join(' | ').slice(0, 4000)
    } catch {
      return '<unprintable error>'
    }
  }
  const readBootstrapFatalLogOverride = () => {
    const override = typeof process.env === 'object' && process.env ? process.env.${BOOTSTRAP_FATAL_LOG_ENV_VAR} : undefined
    return typeof override === 'string' && override.length > 0 ? override : undefined
  }
  const resolveDefaultBootstrapFatalLogPath = () => {
    let directory
    try {
      directory = require('electron').app.getPath('userData')
    } catch {
      // Why: a bootstrap fault can predate a usable app object; temp still outlives the process.
      directory = require('node:os').tmpdir()
    }
    return require('node:path').join(directory, ${JSON.stringify(BOOTSTRAP_FATAL_LOG_FILE_NAME)})
  }
  const appendBootstrapFatalLine = (fs, logPath, entry) => {
    try {
      // Why: an override can name a directory nothing has created yet, and a missing
      // parent would drop the only account of the failure.
      fs.mkdirSync(require('node:path').dirname(logPath), { recursive: true })
      // Why: a broken install repeats this on every relaunch; keep the trail bounded.
      let flags = 'a'
      try {
        flags = fs.statSync(logPath).size > ${BOOTSTRAP_FATAL_LOG_MAX_BYTES} ? 'w' : 'a'
      } catch {
        flags = 'a'
      }
      const descriptor = fs.openSync(logPath, flags, 0o600)
      try {
        fs.writeSync(descriptor, entry)
      } finally {
        fs.closeSync(descriptor)
      }
      return true
    } catch {
      return false
    }
  }
  const recordBootstrapFailure = (error) => {
    const line = '[bootstrap] fatal-exit pid=' + process.pid + ' error=' + describeBootstrapError(error) + '\\n'
    let fs
    try {
      fs = require('node:fs')
    } catch {
      fs = undefined
    }
    try {
      fs.writeSync(2, line)
    } catch {
      try {
        process.stderr.write(line)
      } catch {
        // Diagnostics must never replace the exit below.
      }
    }
    try {
      const entry = new Date().toISOString() + ' ' + line
      const override = readBootstrapFatalLogOverride()
      // Why: an unwritable override must cost the user a location, not the diagnostic.
      if (!override || !appendBootstrapFatalLine(fs, override, entry)) {
        appendBootstrapFatalLine(fs, resolveDefaultBootstrapFatalLogPath(), entry)
      }
    } catch {
      // Diagnostics must never replace the exit below.
    }
  }
  let exitScheduled = false
  const exitAfterBootstrapFailure = (error) => {
    if (exitScheduled) {
      return
    }
    exitScheduled = true
    recordBootstrapFailure(error)
    process.exitCode = 1
    setImmediate(() => process.exit(1))
  }
  globalThis[guardKey] = () => {
    process.off('uncaughtException', exitAfterBootstrapFailure)
    delete globalThis[guardKey]
  }
  process.once('uncaughtException', exitAfterBootstrapFailure)
})();
`;
}

// config/build-plugins/plain-node-entry-guard.ts
import { spawnSync } from "node:child_process";
import { join } from "node:path";
var PLAIN_NODE_ENTRY_NAMES = [
  "daemon-entry",
  "parcel-watcher-process-entry",
  "computer-sidecar",
  "agent-hooks/managed-agent-hook-controls",
  "codex/codex-app-server-grant-entry"
];
var WORKER_THREAD_ENTRY_NAMES = [
  "stt-worker",
  "warp-theme-parser-worker",
  "session-scanner-opencode-sqlite-worker-entry",
  "session-scanner-worker-entry",
  "main-thread-hang-watchdog-entry",
  "port-scan-command-worker-entry"
];
var ELECTRON_REQUIRE_RE = /require\(\s*["']electron["']\s*\)/;
function collectReachableChunks(entry, byFileName) {
  const seen = /* @__PURE__ */ new Set();
  const reachable = [];
  const stack = [entry.fileName];
  while (stack.length > 0) {
    const fileName = stack.pop();
    if (seen.has(fileName)) {
      continue;
    }
    seen.add(fileName);
    const chunk = byFileName.get(fileName);
    if (!chunk) {
      continue;
    }
    reachable.push(chunk);
    for (const imported of [...chunk.imports, ...chunk.dynamicImports]) {
      stack.push(imported);
    }
  }
  return reachable;
}
function assertNoElectronRequire(entryName, entry, byFileName, runtime = "plain-Node process") {
  for (const chunk of collectReachableChunks(entry, byFileName)) {
    if (ELECTRON_REQUIRE_RE.test(chunk.code)) {
      throw new Error(
        `[plain-node-entry-guard] "${entryName}" reaches chunk "${chunk.fileName}" that requires electron. "${entryName}" runs as a ${runtime}, where require("electron") throws MODULE_NOT_FOUND and kills it at startup (the v1.4.129-rc.1 daemon outage). Keep electron imports out of its module graph.`
      );
    }
  }
}
function smokeLoadDaemonEntry(outputDir) {
  const entryPath = join(outputDir, "daemon-entry.js");
  const result = spawnSync(process.execPath, [entryPath], {
    encoding: "utf8",
    timeout: 15e3
  });
  if (result.error) {
    throw new Error(
      `[plain-node-entry-guard] could not smoke-load daemon-entry.js under plain Node: ${result.error.message}`
    );
  }
  const stderr = result.stderr ?? "";
  if (/Cannot find module|MODULE_NOT_FOUND/.test(stderr)) {
    throw new Error(
      `[plain-node-entry-guard] daemon-entry.js failed to load under plain Node:
${stderr}`
    );
  }
  if (!stderr.includes("Usage: daemon-entry")) {
    throw new Error(
      `[plain-node-entry-guard] daemon-entry.js did not reach argv parsing under plain Node (expected the "Usage: daemon-entry" error). stderr:
${stderr}`
    );
  }
}
function createPlainNodeEntryGuardPlugin() {
  let daemonOutputDir;
  return {
    name: "FABRICA-plain-node-entry-guard",
    writeBundle(options, bundle) {
      if (this.meta.watchMode) {
        return;
      }
      const chunks = Object.values(bundle).filter(
        (item) => item.type === "chunk"
      );
      const byFileName = new Map(chunks.map((chunk) => [chunk.fileName, chunk]));
      const entryByName = /* @__PURE__ */ new Map();
      for (const chunk of chunks) {
        if (chunk.isEntry && chunk.name) {
          entryByName.set(chunk.name, chunk);
        }
      }
      for (const entryName of PLAIN_NODE_ENTRY_NAMES) {
        const entry = entryByName.get(entryName);
        if (entry) {
          assertNoElectronRequire(entryName, entry, byFileName, "plain-Node process");
        }
      }
      for (const entryName of WORKER_THREAD_ENTRY_NAMES) {
        const entry = entryByName.get(entryName);
        if (entry) {
          assertNoElectronRequire(entryName, entry, byFileName, "worker thread");
        }
      }
      if (entryByName.has("daemon-entry") && options.dir) {
        daemonOutputDir = options.dir;
      }
    },
    closeBundle() {
      if (daemonOutputDir) {
        const outputDir = daemonOutputDir;
        daemonOutputDir = void 0;
        smokeLoadDaemonEntry(outputDir);
      }
    }
  };
}

// package.json
var package_default = {
  name: "fabrica",
  version: "1.4.178-rc.2",
  description: "Next-gen IDE for parallel agentic development",
  homepage: "https://github.com/Auto-Scalers/Fabrica-app",
  author: "Auto-Scalers",
  bin: {
    fabrica: "./out/cli/index.js",
    "fabrica-dev": "./config/scripts/fabrica-dev.mjs"
  },
  main: "./out/main/index.js",
  scripts: {
    format: "oxfmt --write .",
    lint: "oxlint && pnpm run audit:code-quality:native && pnpm run audit:code-quality:type-aware && pnpm run check:reliability-gates && pnpm run check:max-lines-ratchet && pnpm run verify:bundled-skill-guides && pnpm run verify:skill-bundle-manifest && pnpm run verify:localization-catalog && pnpm run verify:localization-extraction && pnpm run verify:localization-coverage",
    "audit:code-quality": "pnpm run audit:code-quality:native && pnpm run audit:code-quality:type-aware && pnpm run audit:react-doctor",
    "audit:code-quality:native": "oxlint --config config/oxlint-code-quality-native-plugins.json src config tests mobile --deny-warnings",
    "audit:code-quality:type-aware": "oxlint --type-aware --config config/oxlint-code-quality-type-aware.json src config tests --deny-warnings",
    "audit:react-doctor": "pnpm dlx react-doctor@0.9.1 . --yes --no-supply-chain --no-telemetry --blocking none",
    "audit:dead-code": "pnpm dlx knip@5.88.1 --config config/knip.json",
    "check:code-quality:changed": "node config/scripts/check-changed-code-quality.mjs",
    "check:react-doctor:changed": "node config/scripts/check-react-doctor-changed.mjs",
    "check:zustand-selector-fanout": "node config/scripts/zustand-selector-fanout-benchmark.mjs --check",
    doctor: "pnpm dlx react-doctor@0.9.1 . --no-telemetry",
    "lint:react-doctor": "oxlint --config config/oxlint-react-doctor.json",
    "lint:react-doctor:changed": "node config/scripts/lint-react-doctor-changed.mjs",
    prepare: "husky",
    test: "node config/scripts/ensure-native-runtime.mjs --runtime=node && vitest run --config config/vitest.config.ts",
    "test:repro:remote-agent-session": "pnpm run build:cli && pnpm run build:electron-vite && node config/scripts/remote-agent-session-authority-repro.mjs",
    "check:reliability-gates": "node config/scripts/check-reliability-gates.mjs",
    "check:max-lines-ratchet": "node config/scripts/check-max-lines-ratchet.mjs",
    "check:feature-wall-assets": "node config/scripts/check-feature-wall-assets.mjs",
    "generate:bundled-skill-guides": "node config/scripts/generate-bundled-skill-guides.mjs --write",
    "verify:bundled-skill-guides": "node config/scripts/generate-bundled-skill-guides.mjs --check",
    "generate:skill-bundle-manifest": "node config/scripts/generate-skill-bundle-manifest.mjs --write",
    "verify:skill-bundle-manifest": "node config/scripts/generate-skill-bundle-manifest.mjs",
    "verify:macos-entitlements": "node config/scripts/verify-macos-entitlements.mjs",
    "vendor:feature-wall-assets": "node config/scripts/vendor-feature-wall-assets.mjs",
    "tc:node": "pnpm run typecheck:node",
    "tc:cli": "pnpm run typecheck:cli",
    "tc:web": "pnpm run typecheck:web",
    tc: "pnpm run typecheck",
    "typecheck:node": "tsc --noEmit -p config/tsconfig.node.json",
    "typecheck:cli": "tsc --noEmit -p config/tsconfig.tc.cli.json",
    "typecheck:web": "tsc --noEmit -p config/tsconfig.tc.web.json",
    typecheck: "tsc --noEmit -p config/tsconfig.node.json && tsc --noEmit -p config/tsconfig.tc.cli.json && tsc --noEmit -p config/tsconfig.tc.web.json",
    "typecheck:tsc:node": "tsc --noEmit -p config/tsconfig.node.json --composite false",
    "typecheck:tsc:cli": "tsc --noEmit -p config/tsconfig.cli.json --composite false",
    "typecheck:tsc:web": "tsc --noEmit -p config/tsconfig.web.json --composite false",
    "typecheck:tsc": "tsc --noEmit -p config/tsconfig.node.json --composite false && tsc --noEmit -p config/tsconfig.cli.json --composite false && tsc --noEmit -p config/tsconfig.web.json --composite false",
    "ensure:electron-runtime": "node config/scripts/ensure-native-runtime.mjs --runtime=electron",
    start: "pnpm run ensure:electron-runtime && electron-vite preview",
    dev: "pnpm run ensure:electron-runtime && node config/scripts/run-electron-vite-dev.mjs",
    "dev-stable-name": "pnpm run ensure:electron-runtime && node config/scripts/run-electron-vite-dev.mjs --stable-name",
    "dev:web": "vite --config vite.web.config.ts --host 127.0.0.1",
    "build:relay": "node config/scripts/build-relay.mjs",
    "build:computer-macos": "node config/scripts/build-computer-macos.mjs",
    "build:notification-status-macos": "node config/scripts/build-notification-status-macos.mjs",
    "build:native": "node config/scripts/build-native-for-platform.mjs",
    "smoke:computer": "node config/scripts/computer-use-smoke.mjs",
    "verify:computer-native": "node config/scripts/verify-computer-native.mjs",
    "verify:cli-bin": "node config/scripts/verify-cli-bin.mjs",
    "verify:built-skills-cli": "node config/scripts/verify-skills-cli-runtime.cjs out",
    "verify:localization-catalog": "node config/scripts/verify-localization-catalog.mjs",
    "sync:localization-catalog": "node config/scripts/verify-localization-catalog.mjs --fix",
    "verify:localization-extraction": "node config/scripts/verify-localization-extraction.mjs",
    "verify:localization-coverage": "node config/scripts/audit-localization-coverage.mjs --check",
    "audit:localization": "node config/scripts/audit-localization-coverage.mjs",
    "build:cli": "tsc -p config/tsconfig.cli.json --outDir out --composite false --incremental false && node config/scripts/verify-cli-bin.mjs --fix-executable --fix-package-json && node config/scripts/install-dev-cli.mjs",
    "test:repro:skills-cli-runtime": "pnpm run build:cli && pnpm run build:electron-vite && pnpm run verify:built-skills-cli",
    "build:electron-vite": "node config/scripts/run-electron-vite-build.mjs",
    "build:electron-vite:parallel": "node config/scripts/run-electron-vite-targets-in-parallel.mjs",
    "build:web": "node config/scripts/run-vite-web-build.mjs && node config/scripts/verify-web-build.mjs",
    "build:web-from-renderer": "node config/scripts/project-renderer-web-client.mjs && node config/scripts/verify-web-build.mjs",
    "build:desktop": "pnpm run typecheck && pnpm run build:relay && pnpm run build:cli && pnpm run build:electron-vite && pnpm run verify:built-skills-cli && pnpm run build:web-from-renderer",
    build: "pnpm run build:desktop && pnpm run build:native",
    "build:release": "pnpm run build:relay && pnpm run build:native && pnpm run verify:computer-native && pnpm run build:cli && pnpm run build:electron-vite && pnpm run verify:built-skills-cli && pnpm run build:web-from-renderer",
    postinstall: "node config/scripts/rebuild-native-deps.mjs",
    "rebuild:electron": "node config/scripts/rebuild-native-deps.mjs",
    "rebuild:node": "pnpm rebuild node-pty",
    "build:unpack": "pnpm run build && pnpm run ensure:electron-runtime && electron-builder --config config/electron-builder.config.cjs --dir",
    "build:win": "pnpm run build:desktop && pnpm run ensure:electron-runtime && electron-builder --config config/electron-builder.config.cjs --win",
    "build:icons": "bash resources/icon-source/generate.sh",
    "build:mac": "pnpm run build:desktop && pnpm run build:computer-macos && pnpm run build:notification-status-macos && pnpm run ensure:electron-runtime && node config/scripts/build-mac-local.mjs",
    "build:mac:release": "node config/scripts/verify-macos-release-env.mjs && FABRICA_MAC_RELEASE=1 pnpm run build:desktop && FABRICA_MAC_RELEASE=1 pnpm run build:computer-macos && FABRICA_MAC_RELEASE=1 pnpm run build:notification-status-macos && pnpm run ensure:electron-runtime && FABRICA_MAC_RELEASE=1 electron-builder --config config/electron-builder.config.cjs --mac",
    "build:linux": "pnpm run build:desktop && pnpm run ensure:electron-runtime && electron-builder --config config/electron-builder.config.cjs --linux AppImage deb",
    "test:e2e": "pnpm run ensure:electron-runtime && npx playwright test --config tests/playwright.config.ts --project=electron-headless",
    "test:e2e:multi-client-navigation": "node config/scripts/run-multi-client-navigation-e2e.mjs",
    "test:e2e:floating-mobile-emulator": "pnpm run ensure:electron-runtime && npx playwright test tests/e2e/floating-mobile-emulator-tab.spec.ts --config tests/playwright.config.ts --project electron-headless --workers=1",
    "test:e2e:terminal-rendering-golden": "pnpm run ensure:electron-runtime && npx playwright test tests/e2e/terminal-raw-emoji-table-scroll-restore.spec.ts tests/e2e/terminal-webgl-atlas-budget.spec.ts --grep @terminal-rendering-golden --config tests/playwright.config.ts --project electron-headless --workers=1",
    "test:e2e:terminal-rendering-release-evidence": "pnpm run ensure:electron-runtime && npx playwright test tests/e2e/terminal-opencode-emoji-table-rendering.spec.ts tests/e2e/terminal-long-table-scroll-restore.spec.ts --config tests/playwright.config.ts --project electron-headless --workers=2",
    "test:e2e:terminal-perf": "pnpm run ensure:electron-runtime && npx playwright test tests/e2e/terminal-typing-latency.spec.ts tests/e2e/terminal-foreground-redraw-freeze.spec.ts tests/e2e/terminal-output-scheduler.spec.ts tests/e2e/terminal-hidden-tui-visual-restore.spec.ts tests/e2e/artificial-opencode-terminal-load.spec.ts --config tests/playwright.config.ts --project electron-headless --workers=2",
    "test:e2e:terminal-perf:scale": "pnpm run ensure:electron-runtime && node config/scripts/run-terminal-scale-perf-e2e.mjs",
    "test:e2e:terminal-perf:scale:report": "pnpm run ensure:electron-runtime && node config/scripts/run-terminal-scale-perf-report-gate.mjs",
    "test:e2e:terminal-perf:check-report": "node config/scripts/check-terminal-perf-report-budgets.mjs",
    "test:e2e:terminal-perf:summarize": "node config/scripts/summarize-terminal-perf-report.mjs",
    "test:e2e:terminal-perf:html-report": "node config/scripts/generate-terminal-perf-html-report.mjs",
    "test:e2e:ssh-docker-perf": "node config/scripts/run-ssh-docker-perf-e2e.mjs",
    "test:e2e:ssh-docker-watcher-isolation": "node config/scripts/run-ssh-docker-watcher-isolation-e2e.mjs",
    "test:e2e:ssh-docker-terminal-parking": "node config/scripts/run-ssh-docker-terminal-parking-e2e.mjs",
    "test:e2e:nested-runtime-ssh": "node config/scripts/run-nested-runtime-ssh-e2e.mjs",
    "test:e2e:source-control-scale": "pnpm run ensure:electron-runtime && npx playwright test tests/e2e/source-control-large-file-count.spec.ts --config tests/playwright.config.ts --project electron-headless --workers=1",
    "win-update-e2e": "node tests/tools/win-update-e2e/run.mjs",
    "win-crash-survival-e2e": "node tests/tools/win-crash-survival-e2e/run.mjs",
    "test:e2e:ssh-codex-artifacts-repro": "node config/scripts/run-ssh-codex-artifacts-repro-e2e.mjs",
    "test:e2e:headful": "pnpm run ensure:electron-runtime && npx playwright test --config tests/playwright.config.ts --project electron-headful",
    "test:e2e:terminal-ime-native": "node config/scripts/run-terminal-ibus-hangul-e2e.mjs",
    "test:e2e:computer": "vitest run --config tests/e2e/vitest.config.ts",
    "bench:idle-cpu": "pnpm run ensure:electron-runtime && node config/scripts/run-idle-cpu-benchmark.mjs",
    "bench:macos-computer-helper-owner-loss": "node config/scripts/macos-computer-helper-owner-loss-benchmark.mjs",
    "bench:startup": "pnpm run ensure:electron-runtime && node tests/tools/benchmarks/startup-time-bench.mjs",
    "bench:daemon-coldstart": "pnpm run ensure:electron-runtime && node tests/tools/benchmarks/daemon-coldstart-bench.mjs",
    "bench:wsl-hook-relay-reattach": "pnpm run build:relay && node config/scripts/wsl-hook-relay-reattach-benchmark.mjs",
    "bench:wsl-git-shell": "node config/scripts/wsl-git-shell-benchmark.mjs",
    "bench:hang-watchdog-memory": "pnpm run ensure:electron-runtime && node config/scripts/hang-watchdog-memory-benchmark.mjs",
    "bench:main-thread-jank": "pnpm run ensure:electron-runtime && node tests/tools/benchmarks/main-thread-jank-bench.mjs",
    "bench:worktree-deletion": "node tests/tools/benchmarks/worktree-deletion-dev-bench.mjs",
    "bench:zustand-selector-fanout": "node config/scripts/zustand-selector-fanout-benchmark.mjs",
    "bench:worktree-refresh-churn": "node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON config/scripts/worktree-refresh-churn-benchmark.mjs",
    "bench:multi-workspace-typing": "pnpm run ensure:electron-runtime && node config/scripts/run-multi-workspace-typing-bench.mjs",
    "bench:ai-vault-typing": "pnpm run ensure:electron-runtime && node config/scripts/run-ai-vault-typing-bench.mjs",
    "bench:cold-park-reveal": "pnpm run ensure:electron-runtime && node tests/tools/benchmarks/terminal-cold-park-reveal-bench.mjs",
    "bench:cold-park-resource": "pnpm run ensure:electron-runtime && node tests/tools/benchmarks/terminal-cold-park-resource-bench.mjs",
    "bench:compare": "node config/scripts/compare-benchmark-artifacts.mjs",
    "test:e2e:remote-bulk-open-freeze": "pnpm run ensure:electron-runtime && pnpm exec playwright test tests/e2e/remote-session-bulk-open-freeze-repro.spec.ts --config tests/playwright.config.ts --project electron-headless --workers=1",
    "test:e2e:ssh-docker-bulk-open-freeze": "node config/scripts/run-ssh-docker-bulk-open-freeze-e2e.mjs",
    "repro:live-remote-bulk-open-freeze": "node config/scripts/live-remote-bulk-open-freeze-repro.mjs",
    "repro:live-remote-realistic-freeze": "node config/scripts/live-remote-realistic-freeze-repro.mjs"
  },
  dependencies: {
    "@electron-toolkit/preload": "^3.0.2",
    "@electron-toolkit/utils": "^4.0.0",
    "@floating-ui/dom": "1.7.6",
    "@linear/sdk": "^82.1.0",
    "@parcel/watcher": "^2.5.6",
    "@supabase/supabase-js": "^2.112.3",
    "@xterm/addon-serialize": "0.15.0-beta.287",
    "@xterm/headless": "6.1.0-beta.287",
    "agent-browser": "~0.27.0",
    "electron-updater": "^6.8.9",
    i18next: "^26.3.1",
    "jsonc-parser": "^3.3.1",
    "node-pty": "^1.1.0",
    "posthog-node": "^5.33.3",
    psl: "1.15.0",
    qrcode: "^1.5.4",
    "react-i18next": "^17.0.8",
    "serve-sim": "^0.1.40",
    "sherpa-onnx": "1.12.37",
    ssh2: "^1.17.0",
    tweetnacl: "^1.0.3",
    ws: "^8.21.0",
    yaml: "^2.8.4",
    zod: "~4.4.3"
  },
  devDependencies: {
    "@dnd-kit/core": "^6.3.1",
    "@dnd-kit/sortable": "^10.0.0",
    "@electron-toolkit/tsconfig": "^2.0.0",
    "@electron/rebuild": "^4.2.0",
    "@monaco-editor/react": "^4.7.0",
    "@playwright/test": "^1.59.1",
    "@sanity/diff-match-patch": "^3.2.0",
    "@autoscalers/playwright-test": "^2.1.14",
    "@tailwindcss/vite": "^4.2.4",
    "@tanstack/react-virtual": "^3.13.24",
    "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/react": "^16.3.2",
    "@testing-library/user-event": "^14.6.1",
    "@tiptap/extension-code-block-lowlight": "^3.22.5",
    "@tiptap/extension-details": "^3.22.5",
    "@tiptap/extension-image": "^3.22.5",
    "@tiptap/extension-link": "^3.22.5",
    "@tiptap/extension-mathematics": "3.22.5",
    "@tiptap/extension-placeholder": "^3.22.5",
    "@tiptap/extension-table": "3.22.4",
    "@tiptap/extension-table-cell": "3.22.4",
    "@tiptap/extension-table-header": "3.22.4",
    "@tiptap/extension-table-row": "3.22.4",
    "@tiptap/extension-task-item": "^3.22.5",
    "@tiptap/extension-task-list": "^3.22.5",
    "@tiptap/markdown": "^3.22.5",
    "@tiptap/pm": "^3.22.5",
    "@tiptap/react": "^3.22.5",
    "@tiptap/starter-kit": "^3.22.5",
    "@types/node": "^25.6.0",
    "@types/qrcode": "^1.5.6",
    "@types/react": "^19.2.17",
    "@types/react-dom": "^19.2.3",
    "@types/ssh2": "^1.15.5",
    "@types/ws": "^8.18.1",
    "@vitejs/plugin-react": "^5.2.0",
    "@xterm/addon-fit": "0.12.0-beta.287",
    "@xterm/addon-ligatures": "0.11.0-beta.287",
    "@xterm/addon-search": "0.17.0-beta.287",
    "@xterm/addon-unicode11": "0.10.0-beta.287",
    "@xterm/addon-web-links": "0.13.0-beta.287",
    "@xterm/addon-webgl": "0.20.0-beta.286",
    "@xterm/xterm": "6.1.0-beta.287",
    "class-variance-authority": "^0.7.1",
    clsx: "^2.1.1",
    cmdk: "^1.1.1",
    dompurify: "^3.4.13",
    electron: "^43.1.0",
    "electron-builder": "^26.15.3",
    "electron-builder-squirrel-windows": "^26.15.3",
    "electron-vite": "^5.0.0",
    "emoji-picker-react": "^4.19.1",
    "emojibase-data": "17.0.0",
    esbuild: "^0.25.12",
    "happy-dom": "^20.9.0",
    "html-to-image": "^1.11.13",
    husky: "^9.1.7",
    "i18next-cli": "1.65.0",
    katex: "^0.16.45",
    "lint-staged": "^16.4.0",
    lowlight: "^3.3.0",
    "lucide-react": "^0.577.0",
    marked: "^17.0.1",
    mermaid: "^11.16.1",
    "monaco-editor": "^0.55.1",
    oxfmt: "^0.52.0",
    oxlint: "^1.75.0",
    "oxlint-plugin-react-doctor": "0.9.1",
    "oxlint-tsgolint": "7.0.2001",
    "pdfjs-dist": "^6.2.108",
    pngjs: "^7.0.0",
    "radix-ui": "^1.6.2",
    react: "^19.2.7",
    "react-colorful": "^5.7.0",
    "react-dom": "^19.2.7",
    "react-grab": "^0.1.33",
    "react-markdown": "^10.1.0",
    "react-refresh": "^0.18.0",
    "rehype-highlight": "^7.0.2",
    "rehype-katex": "^7.0.1",
    "rehype-raw": "^7.0.0",
    "rehype-sanitize": "^6.0.0",
    "rehype-slug": "^6.0.0",
    "remark-breaks": "^4.0.0",
    "remark-frontmatter": "^5.0.0",
    "remark-gfm": "^4.0.1",
    "remark-math": "^6.0.0",
    "remark-parse": "^11.0.0",
    shadcn: "^4.13.1",
    sonner: "^2.0.7",
    "tailwind-merge": "^3.5.0",
    tailwindcss: "^4.2.4",
    "tw-animate-css": "^1.4.0",
    typescript: "^7.0.2",
    "typescript-api": "npm:typescript@6.0.3",
    unified: "^11.0.5",
    vite: "npm:rolldown-vite@7.3.1",
    vitest: "^4.1.5",
    "vscode-oniguruma": "^2.0.1",
    "vscode-textmate": "^9.3.2",
    zustand: "^5.0.14"
  },
  optionalDependencies: {
    "sherpa-onnx-darwin-arm64": "1.12.37",
    "sherpa-onnx-darwin-x64": "1.12.37",
    "sherpa-onnx-linux-arm64": "1.12.37",
    "sherpa-onnx-linux-x64": "1.12.37",
    "sherpa-onnx-win-x64": "1.12.37",
    "windows-native-registry": "3.2.2"
  },
  "lint-staged": {
    "*.{ts,tsx,js,jsx,mjs,mts,cts}": [
      "oxlint",
      "oxlint --config config/oxlint-react-doctor.json",
      "oxfmt --write"
    ],
    "*.{json,css}": [
      "oxfmt --write"
    ]
  },
  engines: {
    node: "24"
  },
  packageManager: "pnpm@10.24.0+sha512.01ff8ae71b4419903b65c60fb2dc9d34cf8bb6e06d03bde112ef38f7a34d6904c424ba66bea5cdcf12890230bf39f9580473140ed9c946fef328b6e5238a345a",
  pnpm: {
    overrides: {
      "monaco-editor>dompurify": "3.4.13"
    },
    supportedArchitectures: {
      os: [
        "current",
        "darwin",
        "linux",
        "win32"
      ],
      cpu: [
        "current",
        "x64",
        "arm64"
      ]
    },
    onlyBuiltDependencies: [
      "@parcel/watcher",
      "cpu-features",
      "esbuild",
      "node-pty",
      "sherpa-onnx"
    ],
    patchedDependencies: {
      "node-pty@1.1.0": "config/patches/node-pty@1.1.0.patch",
      "@xterm/addon-ligatures@0.11.0-beta.287": "config/patches/@xterm__addon-ligatures@0.11.0-beta.287.patch",
      "@xterm/addon-webgl@0.20.0-beta.286": "config/patches/@xterm__addon-webgl@0.20.0-beta.286.patch",
      "@xterm/addon-serialize@0.15.0-beta.287": "config/patches/@xterm__addon-serialize@0.15.0-beta.287.patch",
      "@xterm/xterm@6.1.0-beta.287": "config/patches/@xterm__xterm@6.1.0-beta.287.patch"
    }
  },
  reactDoctor: {
    rules: {
      "react-doctor/js-combine-iterations": "off"
    }
  }
};

// electron.vite.config.ts
var BUNDLED_MAIN_DEPENDENCIES = /* @__PURE__ */ new Set([
  "@xterm/headless",
  "@xterm/addon-serialize",
  "psl",
  // Why: Windows NSIS deploys app.asar before external resources; bootstrap must
  // not race the later resources/node_modules copy.
  "zod"
]);
var EXTERNAL_MAIN_DEPENDENCIES = Object.keys(package_default.dependencies).filter(
  (dependency) => !BUNDLED_MAIN_DEPENDENCIES.has(dependency)
);
function isExternalMainModule(source) {
  if (isBuiltin(source) || source === "electron" || source.startsWith("electron/")) {
    return true;
  }
  return EXTERNAL_MAIN_DEPENDENCIES.some(
    (dependency) => source === dependency || source.startsWith(`${dependency}/`)
  );
}
var fabricaBuildIdentity = process.env.FABRICA_BUILD_IDENTITY;
var FABRICA_BUILD_IDENTITY_LITERAL = fabricaBuildIdentity === "stable" || fabricaBuildIdentity === "rc" ? JSON.stringify(fabricaBuildIdentity) : "null";
var fabricaPostHogWriteKey = process.env.FABRICA_POSTHOG_WRITE_KEY;
var FABRICA_POSTHOG_WRITE_KEY_LITERAL = typeof fabricaPostHogWriteKey === "string" && fabricaPostHogWriteKey.length > 0 ? JSON.stringify(fabricaPostHogWriteKey) : "null";
var fabricaDiagnosticsTokenUrl = process.env.FABRICA_DIAGNOSTICS_TOKEN_URL;
var FABRICA_DIAGNOSTICS_TOKEN_URL_LITERAL = typeof fabricaDiagnosticsTokenUrl === "string" && fabricaDiagnosticsTokenUrl.length > 0 ? JSON.stringify(fabricaDiagnosticsTokenUrl) : "null";
var supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
var supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
var SUPABASE_URL_LITERAL = JSON.stringify(supabaseUrl);
var SUPABASE_ANON_KEY_LITERAL = JSON.stringify(supabaseAnonKey);
function createStartupDiagnosticsBanner(chunkName) {
  return `
;(() => {
  const env = typeof process !== 'undefined' ? process.env : undefined
  const mode = env?.FABRICA_STARTUP_DIAGNOSTICS
  if (mode !== '1' && mode !== 'trace') {
    return
  }
  const safeJson = (value) => {
    try {
      return JSON.stringify(value)
    } catch {
      return '"<unserializable>"'
    }
  }
  let closeSync
  let diagnosticFileDescriptor
  let openSync
  let writeSync
  try {
    const fs = require('node:fs')
    closeSync = fs.closeSync
    openSync = fs.openSync
    writeSync = fs.writeSync
  } catch {
    closeSync = undefined
    openSync = undefined
    writeSync = undefined
  }
  const diagnosticFile = env?.FABRICA_STARTUP_DIAGNOSTICS_FILE
  if (typeof diagnosticFile === 'string' && diagnosticFile.length > 0 && typeof openSync === 'function') {
    try {
      diagnosticFileDescriptor = openSync(diagnosticFile, 'a', 0o600)
    } catch {
      diagnosticFileDescriptor = undefined
    }
  }
  const writeLine = (message) => {
    try {
      const line = message.endsWith('\\n') ? message : message + '\\n'
      if (typeof writeSync === 'function') {
        writeSync(2, line)
        if (typeof diagnosticFileDescriptor === 'number') {
          writeSync(diagnosticFileDescriptor, line)
        }
      }
    } catch {
      // Diagnostics must never affect startup.
    }
  }
  const chunkName = ${JSON.stringify(chunkName)}
  writeLine('[bootstrap] bundle-enter chunk=' + safeJson(chunkName) + ' pid=' + process.pid + ' ppid=' + process.ppid + ' execPath=' + safeJson(process.execPath) + ' argv=' + safeJson(process.argv) + ' electronRunAsNode=' + safeJson(env?.ELECTRON_RUN_AS_NODE ?? null))
  if (!globalThis.__FABRICA_BOOTSTRAP_EXIT_LOG_INSTALLED__) {
    globalThis.__FABRICA_BOOTSTRAP_EXIT_LOG_INSTALLED__ = true
    process.once('exit', (code) => {
      writeLine('[bootstrap] process-exit code=' + code)
      if (typeof closeSync === 'function' && typeof diagnosticFileDescriptor === 'number') {
        try {
          closeSync(diagnosticFileDescriptor)
        } catch {
          // Diagnostics must never affect shutdown.
        }
      }
    })
    process.on('uncaughtExceptionMonitor', (error, origin) => {
      const message = error && typeof error === 'object' && 'stack' in error ? error.stack : error
      writeLine('[bootstrap] uncaught-exception origin=' + safeJson(origin) + ' error=' + safeJson(String(message)))
    })
    process.on('unhandledRejection', (reason) => {
      const message = reason && typeof reason === 'object' && 'stack' in reason ? reason.stack : reason
      writeLine('[bootstrap] unhandled-rejection error=' + safeJson(String(message)))
    })
  }
  if (mode === 'trace' && !globalThis.__FABRICA_BOOTSTRAP_REQUIRE_TRACE_INSTALLED__) {
    globalThis.__FABRICA_BOOTSTRAP_REQUIRE_TRACE_INSTALLED__ = true
    try {
      const Module = require('node:module')
      const originalLoad = Module._load
      const parsedTraceLimit = Number(env?.FABRICA_STARTUP_DIAGNOSTICS_TRACE_LIMIT ?? 20000)
      const traceLimit = Number.isFinite(parsedTraceLimit) && parsedTraceLimit > 0 ? parsedTraceLimit : 20000
      let traceLineCount = 0
      let traceLimitReported = false
      const writeTraceLine = (message) => {
        if (traceLineCount >= traceLimit) {
          if (!traceLimitReported) {
            traceLimitReported = true
            writeLine('[bootstrap] require-trace-limit-reached limit=' + safeJson(traceLimit))
          }
          return
        }
        traceLineCount += 1
        writeLine(message)
      }
      Module._load = function (request, parent, isMain) {
        const parentName = parent && parent.filename ? parent.filename : null
        writeTraceLine('[bootstrap] require-start request=' + safeJson(request) + ' parent=' + safeJson(parentName) + ' isMain=' + safeJson(Boolean(isMain)))
        try {
          const result = Reflect.apply(originalLoad, this, arguments)
          writeTraceLine('[bootstrap] require-ok request=' + safeJson(request))
          return result
        } catch (error) {
          const message = error && typeof error === 'object' && 'stack' in error ? error.stack : error
          writeTraceLine('[bootstrap] require-error request=' + safeJson(request) + ' error=' + safeJson(String(message)))
          throw error
        }
      }
    } catch (error) {
      writeLine('[bootstrap] require-trace-install-error error=' + safeJson(String(error)))
    }
  }
})();
`;
}
function createMainBootstrapPlugin() {
  return {
    name: "fabrica-main-bootstrap",
    generateBundle(_options, bundle) {
      const mainChunk = bundle["index.js"];
      if (!mainChunk || mainChunk.type !== "chunk") {
        return;
      }
      mainChunk.code = createBootstrapFatalExitBanner() + createStartupDiagnosticsBanner(mainChunk.fileName) + mainChunk.code;
    }
  };
}
var electronViteConfig = {
  main: {
    build: {
      // Why: daemon-entry.js is asar-unpacked so child_process.fork() can
      // execute it from disk. Node's module resolution from the unpacked
      // directory cannot reach into app.asar; startup-critical pure JS must
      // also survive a partially copied Windows resources tree.
      externalizeDeps: {
        exclude: [...BUNDLED_MAIN_DEPENDENCIES]
      },
      rollupOptions: {
        // Why: native dependencies must resolve from packaged node_modules,
        // while the unpacked daemon needs its pure-JS xterm graph bundled.
        external: isExternalMainModule,
        input: {
          index: resolve("src/main/index.ts"),
          // Why: sandboxed webview preloads cannot load Rollup helper chunks.
          "browser-window-close-preload": resolve("src/preload/browser-window-close.ts"),
          "daemon-entry": resolve("src/main/daemon/daemon-entry.ts"),
          "plugin-host-entry": resolve("src/main/plugins/plugin-host-entry.ts"),
          "computer-sidecar": resolve("src/main/computer/sidecar-entry.ts"),
          "stt-worker": resolve("src/main/speech/stt-worker.ts"),
          "warp-theme-parser-worker": resolve("src/main/warp-themes/warp-theme-parser-worker.ts"),
          "session-scanner-opencode-sqlite-worker-entry": resolve(
            "src/main/ai-vault/session-scanner-opencode-sqlite-worker-entry.ts"
          ),
          "session-scanner-worker-entry": resolve(
            "src/main/ai-vault/session-scanner-worker-entry.ts"
          ),
          "session-scanner-service-entry": resolve(
            "src/main/ai-vault/session-scanner-service-entry.ts"
          ),
          // Why: libuv spawns processes inline on the calling loop, so the port
          // scan's probe commands run on a worker thread instead of the UI one.
          "port-scan-command-worker-entry": resolve(
            "src/main/ports/port-scan-command-worker-entry.ts"
          ),
          // Why: forked with ELECTRON_RUN_AS_NODE so @parcel/watcher faults
          // can't take down the main process (issue #7547).
          "parcel-watcher-process-entry": resolve("src/main/ipc/parcel-watcher-process-entry.ts"),
          // Why: a worker thread survives the macOS 26 AppKit main-thread deadlock
          // without paying for another Electron process.
          "main-thread-hang-watchdog-entry": resolve(
            "src/main/hang-watchdog/main-thread-hang-watchdog-entry.ts"
          ),
          // Why: run under ELECTRON_RUN_AS_NODE while the caller blocks on
          // spawnSync — codex app-server trust grants need a live event loop
          // but must finish before a Codex pane launch proceeds.
          "codex/codex-app-server-grant-entry": resolve(
            "src/main/codex/codex-app-server-grant-entry.ts"
          ),
          // Why: electron-vite cleans out/main in dev. The dev CLI imports
          // this path for `fabrica agent hooks ...`, so it must survive rebuilds.
          "agent-hooks/managed-agent-hook-controls": resolve(
            "src/main/agent-hooks/managed-agent-hook-controls.ts"
          ),
          // Why: account import mutates the user's macOS Keychain from the CLI.
          "claude-accounts/keychain": resolve("src/main/claude-accounts/keychain.ts")
        },
        // Why: Rolldown's SSR default is ESM, but Electron and sidecar launchers
        // consume these stable CommonJS paths.
        output: {
          format: "cjs",
          entryFileNames: "[name].js",
          chunkFileNames: "chunks/[name]-[hash].js"
        },
        plugins: [createMainBootstrapPlugin(), createPlainNodeEntryGuardPlugin()]
      }
    },
    // Why: compile-time substitution for the telemetry gate. See the block
    // above for the full rationale.
    define: {
      FABRICA_BUILD_IDENTITY: FABRICA_BUILD_IDENTITY_LITERAL,
      FABRICA_POSTHOG_WRITE_KEY: FABRICA_POSTHOG_WRITE_KEY_LITERAL,
      FABRICA_DIAGNOSTICS_TOKEN_URL: FABRICA_DIAGNOSTICS_TOKEN_URL_LITERAL,
      "process.env.SUPABASE_URL": SUPABASE_URL_LITERAL,
      "process.env.SUPABASE_ANON_KEY": SUPABASE_ANON_KEY_LITERAL
    },
    // Why: @xterm/headless declares "exports": null in package.json, which
    // prevents Vite's default resolver from finding the CJS entry. Point
    // directly at the published main file so the bundler can inline it.
    resolve: {
      alias: {
        "@xterm/headless": resolve("node_modules/@xterm/headless/lib-headless/xterm-headless.js"),
        "@xterm/addon-serialize": resolve(
          "node_modules/@xterm/addon-serialize/lib/addon-serialize.js"
        )
      }
    }
  },
  preload: {
    build: {
      externalizeDeps: {
        exclude: ["@electron-toolkit/preload"]
      }
    }
  },
  renderer: {
    resolve: {
      alias: {
        "@renderer": resolve("src/renderer/src"),
        "@": resolve("src/renderer/src")
      }
    },
    plugins: [react(), tailwindcss()],
    worker: {
      format: "es"
    },
    build: {
      manifest: true,
      modulePreload: { polyfill: true },
      target: "es2020",
      // Why: the pop-out dashboard is a second top-level window with its own
      // React root. It gets its own HTML entry so it can boot independently of
      // the main window while reusing the same preload/window.api. `index` must
      // stay listed — overriding input otherwise drops electron-vite's default
      // renderer entry.
      rollupOptions: {
        // Why: shared chunks must never import an HTML entry whose module mounts
        // a different React root.
        preserveEntrySignatures: "strict",
        input: {
          index: resolve("src/renderer/index.html"),
          popout: resolve("src/renderer/popout.html"),
          web: resolve("src/renderer/web-index.html")
        }
      }
    }
  }
};
var electron_vite_config_default = defineConfig(electronViteConfig);
export {
  electron_vite_config_default as default,
  electronViteConfig
};
