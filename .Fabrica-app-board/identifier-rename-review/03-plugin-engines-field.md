# 03. Plugin `engines.orca` compatibility field

> **STATUS: ⏳ PLANNING — NOT DONE.** Plan drafted; implementation not started.

## What it is
Plugins (add-ons, like the Portuguese-language pack or navigation shortcuts) declare which app they're built for in a small header. That header says `engines.orca` — a **contract between a plugin and the app**, similar to "this app requires Windows 10 or newer." The app checks it before trusting/running a plugin.

## Where it lives
- Manifest schema + gate: `src/shared/plugins/plugin-manifest.ts:94` (`engines: z.object({ orca: ... })`) and `:177` (`satisfiesOrcaEngineRange`)
- Install-time gate: `src/main/plugins/plugin-install-staging.ts:73`
- Discovery-time gate: `src/main/plugins/plugin-discovery.ts:110`
- Bundled plugin manifests under `resources/plugins/launch/`
- Shared with desktop + headless server + relay + CLI, so validation is identical everywhere (SSH/remote parity)

## Visible to users?
No — it's metadata inside plugin files. Users see the plugin's *display name*, not this field.

## The 0-users impact
No user data involved. At 0 users, nothing is installed and no plugins are published to users — so the whole ecosystem can be renamed cleanly in one coordinated move.

---

## The full plan — "Plugin ecosystem takeover" (verified against the code)

The entire marketplace is **already externalized to GitHub**. The app clones the catalog and each plugin live at runtime; nothing is invented for the takeover — we copy, rename, republish, repoint. Confirmed live: `stablyai/orca-plugins`, `stablyai/orca-portuguese`, `stablyai/orca-navigation-shortcuts`, `stablyai/orca-multipass-recipes` all exist on GitHub.

How the chain flows today:

```
our app code  →  trust constants (stablyai + orca-*)  →  marketplace repo (github.com/stablyai/orca-plugins)
                                                          →  plugin repos (github.com/stablyai/orca-*)
                                                          →  bundled copies in our installer (resources/plugins/launch/)
```

### Step 1 — Repoint the marketplace + trust to Fabrica (code)
`src/shared/plugins/plugin-marketplace.ts`:
- `OFFICIAL_PLUGIN_PUBLISHER = 'stablyai'` → your Fabrica publisher slug
- `OFFICIAL_PLUGIN_ID_PREFIX = 'orca-'` → `fabrica-`
- `OFFICIAL_MARKETPLACE_OWNER = 'stablyai'` → Fabrica org
- `OFFICIAL_MARKETPLACE_REPOSITORY = 'orca-plugins'` → `fabrica-plugins`
- `OFFICIAL_MARKETPLACE_GIT_SOURCE` (line 117) → `https://github.com/Auto-Scalers/fabrica-plugins.git`

`src/shared/plugins/plugin-manifest.ts`:
- `:94` `engines: z.object({ orca: ... })` → `engines: z.object({ fabrica: ... })`
- `satisfiesOrcaEngineRange` → rename accordingly (behavior unchanged)

Messages referencing "orca" / "stablyai" in gates:
- `plugin-install-staging.ts:76`, `plugin-discovery.ts:114`, `plugin-install-trust.ts:15,21,26`, `plugin-marketplace-provenance.ts:18,23`

### Step 2 — Create the Fabrica plugin repos on GitHub
Copy each `stablyai/orca-*` repo into your org under Fabrica names. The 3 the current build actually supports (themes/skills/icons packs are hidden at runtime by `isMarketplaceListingSupported`):
- `stablyai/orca-portuguese` → `Auto-Scalers/fabrica-portuguese`
- `stablyai/orca-multipass-recipes` → `Auto-Scalers/fabrica-multipass-recipes`
- `stablyai/orca-navigation-shortcuts` → `Auto-Scalers/fabrica-navigation-shortcuts`
- `stablyai/orca-plugins` (marketplace index repo) → `Auto-Scalers/fabrica-plugins`

### Step 3 — Rewrite every plugin manifest (`orca-plugin.json`)
In each copied repo:
- `publisher: "stablyai"` → Fabrica publisher
- `id: "orca-portuguese"` (etc.) → `fabrica-portuguese`
- `engines: { "orca": ">=1.4.0" }` → `engines: { "fabrica": ">=1.4.0" }`
- `repository` URL → new repo

### Step 4 — Rewrite the marketplace index JSON
`name`, `owner` → Fabrica, and each plugin entry:
- `id` → `fabrica.*` qualified key
- `source.url` → `https://github.com/Auto-Scalers/fabrica-*.git`

### Step 5 — Update the shipped-in-installer content
`resources/plugins/launch/`:
- `orca-marketplace.json` → same as Step 4 (filename stays — it's the schema constant `PLUGIN_MARKETPLACE_FILENAME`)
- Each bundled plugin dir (`stablyai.orca-*/`) → renamed dirs + rewritten manifests
- `bundled-plugins.json` → new plugin keys **and recompute the `contentHash`** (must exactly match the new bytes)
- `plugin-launch-content.test.ts` expectations → new keys

### Step 6 — Repoint the kill-list
`src/main/plugins/plugin-kill-list-service.ts:10` `https://onorca.dev/plugins/kill-list.json` → Fabrica domain.

### Step 7 — Ship as one release
All of the above lands together; run lint + vitest. At 0 users this is a clean cutover, no migration.

---

## Options

### Option A — Keep `engines.orca` (do nothing)
Benefit: zero effort/risk today.
Tradeoff: "orca" lingers in plugin metadata; the takeover (Steps above) still needs to happen eventually for a clean Fabrica brand.

### Option B — Full takeover now (✅ Recommended)
Benefit: complete, consistent Fabrica plugin ecosystem; the field, publisher, ids, URLs, and trust all change as one unit; 0 users means zero migration.
Tradeoff: coordinated work across code + marketplace repo + 3 plugin repos + bundled content hashes in one release. Medium effort, no user-facing cost at 0 users.

### Option C — Accept both (`engines.orca` OR `engines.fabrica`)
Benefit: old plugins keep loading during transition.
Tradeoff: extra schema/logic; `validateMarketplaceProvenance` and ID-gates still force one publisher — so it adds complexity without removing the coordination, pointless at 0 users.

---

## Recommendation
**Option B — do the full takeover as one coordinated step** (it's also item `11.1` of `infra-migration_plan.md`, now expanded here). Goods news: since everything is external GitHub repos we own the rename mirrors Orca's own runtime design — copy, rename, republish, repoint, ship one release.

Effort: Medium (code + 4 repos + bundled hashes + tests). Value to users: zero directly, but it's the only path to a fully-Fabrica product.