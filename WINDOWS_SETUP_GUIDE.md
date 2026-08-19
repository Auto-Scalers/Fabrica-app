# Fabrica Setup & Run Guide for Windows (Agent Guide)

This guide documents the exact steps, context, rationale (**why**), and implementation details (**how**) required to set up and run [Fabrica](https://github.com/Auto-Scalers/Fabrica-app) on a Windows machine without requiring Microsoft Visual Studio C++ Build Tools.

---

## 1. Overview & Objective

Fabrica is an Electron desktop app written in TypeScript/React using `pnpm` workspace tools and `electron-vite`.

When running on Windows without Visual Studio C++ Build Tools installed, `pnpm install` and `pnpm dev` trigger native module rebuilds (`node-gyp`) for C++ addons like `windows-native-registry`. Without MSVC, node-gyp fails with:
`Error: Could not find any Visual Studio installation to use`

### Why the Workaround is Safe
`windows-native-registry` is used by Fabrica as an optional performance enhancement to read environment variables from the Windows Registry. Fabrica's TypeScript runtime gracefully catches failure to load this module and falls back safely to pure JavaScript path resolution. Bypassing native compilation for this module allows Fabrica to build and launch cleanly on any standard Windows machine.

---

## 2. Step-by-Step Setup Process

### Step 1: Clone the Repository
```bash
git clone https://github.com/Auto-Scalers/Fabrica-app
cd Fabrica-app
```

### Step 2: Modify Rebuild Scripts to Ignore Non-Essential Native Modules

Before running `pnpm install` or `pnpm dev`, patch two internal rebuild scripts inside the `Fabrica-app` repository:

#### File 1: `config/scripts/rebuild-native-deps.mjs`
* **Why:** This script manages `@electron/rebuild` during `postinstall` and Electron builds. Adding `windows-native-registry` to `ignoreModules` tells Electron rebuild to skip compiling this C++ module.
* **How:**
  Change:
  ```javascript
  const ignoreModules = ['cpu-features']
  ```
  To:
  ```javascript
  const ignoreModules = ['cpu-features', 'windows-native-registry']
  ```

#### File 2: `config/scripts/ensure-native-runtime.mjs`
* **Why:** This script verifies that native runtime binaries load before launching `pnpm dev`. Removing `windows-native-registry` from `NATIVE_MODULES` prevents `ensure-native-runtime.mjs` from failing the runtime health check when the native binary `.node` file is absent.
* **How:**
  Change:
  ```javascript
  const NATIVE_MODULES = [
    'node-pty',
    ...(process.platform === 'win32' ? ['windows-native-registry'] : [])
  ]
  ```
  To:
  ```javascript
  const NATIVE_MODULES = [
    'node-pty'
  ]
  ```

---

### Step 3: Install Dependencies
```bash
pnpm install
```
*Note: You may see build warning messages regarding `cpu-features` or `windows-native-registry`, but `pnpm install` will complete successfully.*

---

### Step 4: Run Fabrica in Development Mode
```bash
pnpm dev
```

`pnpm dev` will:
1. Run `ensure-native-runtime.mjs` (which verifies `node-pty`).
2. Launch `electron-vite` to compile main, preload, and renderer bundles.
3. Spawn the Electron Desktop App window.

---

## 3. Summary of Files Modified in Fabrica Repo
- `Fabrica-app/config/scripts/rebuild-native-deps.mjs`
- `Fabrica-app/config/scripts/ensure-native-runtime.mjs`
