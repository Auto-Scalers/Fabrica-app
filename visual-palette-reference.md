# Fabrica App — Visual Palette Reference

**Purpose:** Aesthetic reference extracted from the Fabrica-web landing/app (`app/globals.css`)
to drive the Fabrica-app (Electron desktop) visual palette migration.

**Source files:**
- `Fabrica-web/app/globals.css` — OKLCH design tokens (primary source, mission-control Next.js app)
- `legacy-fabrica frontend-next/app/globals.css` — brand "Fabrica Copper" hex theme (supplementary)

**Migration strategy:** Port the OKLCH token model directly into the desktop app's
CSS variable system. Keep tokens semantic (`--background`, `--primary`, …) so light/dark
themes swap by toggling a `.dark` class on the root. Do NOT hard-code hex in components —
always reference the CSS variables.

---

## 1. Color Palette (OKLCH)

OKLCH syntax: `oklch(L C H)` — Lightness (0–1), Chroma (0–0.4), Hue (0–360°).
Convert to `rgb()`/`hsl()` at the CSS layer only if a target framework lacks OKLCH support.
Modern Electron (Chromium 100+) renders OKLCH natively.

### Light mode (`:root`)

| Token | OKLCH | Role |
|-------|-------|------|
| `--background` | `oklch(1 0 0)` | App canvas / window background |
| `--foreground` | `oklch(0.145 0 0)` | Primary text |
| `--card` | `oklch(1 0 0)` | Card / panel surface |
| `--card-foreground` | `oklch(0.145 0 0)` | Text on cards |
| `--popover` | `oklch(1 0 0)` | Popovers, tooltips, dropdowns |
| `--popover-foreground` | `oklch(0.145 0 0)` | Text on popovers |
| `--primary` | `oklch(0.205 0.064 270.94)` | Primary actions, brand indigo |
| `--primary-foreground` | `oklch(0.985 0 0)` | Text on primary |
| `--secondary` | `oklch(0.97 0 0)` | Secondary surface |
| `--secondary-foreground` | `oklch(0.205 0.064 270.94)` | Text on secondary |
| `--muted` | `oklch(0.97 0 0)` | Muted surface |
| `--muted-foreground` | `oklch(0.556 0.022 270.94)` | Muted / secondary text |
| `--accent` | `oklch(0.97 0 0)` | Hover / accent surface |
| `--accent-foreground` | `oklch(0.205 0.064 270.94)` | Text on accent |
| `--destructive` | `oklch(0.577 0.245 27.33)` | Delete / danger (red) |
| `--destructive-foreground` | `oklch(0.985 0 0)` | Text on destructive |
| `--border` | `oklch(0.922 0 0)` | Borders, dividers |
| `--input` | `oklch(0.922 0 0)` | Input field borders |
| `--ring` | `oklch(0.708 0.165 254.62)` | Focus ring (blue) |
| `--radius` | `0.625rem` | Base corner radius |

### Dark mode (`.dark`)

> Deep navy base — identifiably blue, not black.

| Token | OKLCH | Role |
|-------|-------|------|
| `--background` | `oklch(0.17 0.035 250)` | App canvas — deep navy |
| `--foreground` | `oklch(0.93 0.008 250)` | Primary text — soft white |
| `--card` | `oklch(0.20 0.035 250)` | Elevated card surface |
| `--card-foreground` | `oklch(0.93 0.008 250)` | Text on cards |
| `--popover` | `oklch(0.22 0.035 250)` | Popovers (above cards) |
| `--popover-foreground` | `oklch(0.93 0.008 250)` | Text on popovers |
| `--primary` | `oklch(0.65 0.2 265)` | Vibrant indigo primary |
| `--primary-foreground` | `oklch(0.98 0 0)` | Text on primary |
| `--secondary` | `oklch(0.25 0.030 250)` | Secondary surface |
| `--secondary-foreground` | `oklch(0.88 0.008 250)` | Text on secondary |
| `--muted` | `oklch(0.23 0.030 250)` | Muted surface |
| `--muted-foreground` | `oklch(0.70 0.020 250)` | Muted text |
| `--accent` | `oklch(0.26 0.035 250)` | Brighter accent surface |
| `--accent-foreground` | `oklch(0.93 0.008 250)` | Text on accent |
| `--destructive` | `oklch(0.65 0.2 25)` | Danger (red) |
| `--destructive-foreground` | `oklch(0.98 0 0)` | Text on destructive |
| `--border` | `oklch(0.28 0.025 250)` | Blue-tinted borders |
| `--input` | `oklch(0.25 0.025 250)` | Input borders |
| `--ring` | `oklch(0.65 0.2 265)` | Focus ring (indigo) |

---

## 2. Chart / Data Colors

### Light mode
| Token | OKLCH |
|-------|-------|
| `--chart-1` | `oklch(0.646 0.222 41.12)` |
| `--chart-2` | `oklch(0.6 0.118 184.71)` |
| `--chart-3` | `oklch(0.398 0.07 227.39)` |
| `--chart-4` | `oklch(0.828 0.189 84.43)` |
| `--chart-5` | `oklch(0.769 0.188 70.08)` |

### Dark mode (vibrant)
| Token | OKLCH |
|-------|-------|
| `--chart-1` | `oklch(0.65 0.2 265)` |
| `--chart-2` | `oklch(0.7 0.17 162)` |
| `--chart-3` | `oklch(0.75 0.18 80)` |
| `--chart-4` | `oklch(0.65 0.22 310)` |
| `--chart-5` | `oklch(0.65 0.22 25)` |

---

## 3. Sidebar Tokens

### Light mode
| Token | OKLCH |
|-------|-------|
| `--sidebar-background` | `oklch(0.985 0 0)` |
| `--sidebar-foreground` | `oklch(0.556 0.022 270.94)` |
| `--sidebar-primary` | `oklch(0.205 0.064 270.94)` |
| `--sidebar-primary-foreground` | `oklch(0.985 0 0)` |
| `--sidebar-accent` | `oklch(0.97 0 0)` |
| `--sidebar-accent-foreground` | `oklch(0.205 0.064 270.94)` |
| `--sidebar-border` | `oklch(0.922 0 0)` |
| `--sidebar-ring` | `oklch(0.708 0.165 254.62)` |

### Dark mode (deeper navy for hierarchy)
| Token | OKLCH |
|-------|-------|
| `--sidebar-background` | `oklch(0.14 0.040 250)` |
| `--sidebar-foreground` | `oklch(0.70 0.020 250)` |
| `--sidebar-primary` | `oklch(0.65 0.2 265)` |
| `--sidebar-primary-foreground` | `oklch(0.98 0 0)` |
| `--sidebar-accent` | `oklch(0.21 0.035 250)` |
| `--sidebar-accent-foreground` | `oklch(0.93 0.008 250)` |
| `--sidebar-border` | `oklch(0.23 0.025 250)` |
| `--sidebar-ring` | `oklch(0.65 0.2 265)` |

---

## 4. Domain Accent Colors

These carry semantic meaning (status, priority). Reuse them across components for
consistency — do not invent new hues.

### Eisenhower quadrant accents
| Token | Light OKLCH | Dark OKLCH | Meaning |
|-------|-------------|------------|---------|
| `--quadrant-do` | `oklch(0.55 0.22 25)` | `oklch(0.55 0.18 25)` | DO (urgent + important) |
| `--quadrant-schedule` | `oklch(0.50 0.22 265)` | `oklch(0.55 0.18 265)` | SCHEDULE (important) |
| `--quadrant-delegate` | `oklch(0.55 0.18 80)` | `oklch(0.6 0.16 80)` | DELEGATE (urgent) |
| `--quadrant-eliminate` | `oklch(0.45 0.03 260)` | `oklch(0.4 0.025 250)` | ELIMINATE (neither) |

### Status colors
| Token | Light OKLCH | Dark OKLCH |
|-------|-------------|------------|
| `--status-not-started` | `oklch(0.55 0.03 260)` | `oklch(0.5 0.025 250)` |
| `--status-in-progress` | `oklch(0.50 0.22 265)` | `oklch(0.6 0.18 265)` |
| `--status-done` | `oklch(0.50 0.20 155)` | `oklch(0.6 0.17 155)` |

### Success / Warning / Info
| Token | Light OKLCH | Dark OKLCH |
|-------|-------------|------------|
| `--success` | `oklch(0.50 0.20 155)` | `oklch(0.6 0.17 155)` |
| `--warning` | `oklch(0.60 0.20 80)` | `oklch(0.7 0.18 80)` |
| `--info` | `oklch(0.50 0.22 265)` | `oklch(0.65 0.2 265)` |

---

## 5. Typography

The OKLCH source (mission-control) inherits system fonts. The **brand** Fabrica theme
(legacy `frontend-next`) defines an explicit type system — apply this to the desktop app:

| Variable | Value | Usage |
|----------|-------|-------|
| `--sans` | `"Inter", system-ui, -apple-system, Segoe UI, Roboto, sans-serif` | Body text |
| `--mono` | `"JetBrains Mono", ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace` | Slugs, metrics, IDs, code |
| `--font-display` | `"Space Grotesk", var(--sans)` | Headings (h1–h6) |

**Fluid type scale (from legacy brand theme):**
- Root `font-size: clamp(10px, 0.75vw + 7.5px, 15.5px)` — never below 10px, never above 15.5px.
- Body: `0.95rem`. Headings: display font, uppercase labels at `0.6–0.8rem`, `letter-spacing ~0.05rem`.

**Applied to desktop UI:**
- Use `--sans` for all UI copy, `--mono` for machine-generated identifiers/metrics.
- Headings and section titles (pane headers, window titles) use `--font-display`.
- Match the web's condensed, uppercase, letter-spaced label style for panel headers.

---

## 6. Motion & Interaction Tokens

Port these interaction rules into the desktop shell:

- **Transitions:** `transition-colors duration-150` on all `a, button, input, textarea, select`.
- **Focus visibility:** `:focus-visible { outline: 2px solid var(--ring); outline-offset: 2px; border-radius: 4px; }`
- **Card entrance:** `@keyframes fade-in-up` (0.3s ease-out) — apply to cards/panels as they mount.
- **Progress shimmer:** `@keyframes shimmer` (2s ease-in-out infinite) — for active progress bars.
- **Scrollbars:** 8px width/height; thumb `oklch(0.8 0.01 260)` light / `oklch(0.32 0.02 250)` dark; `border-radius: 4px`; transparent track.
- **Accessibility:** include a `.skip-to-content` link (visually hidden until focused) for keyboard nav.

---

## 7. Mapping to Electron Desktop UI

| Web token | Desktop target |
|-----------|----------------|
| `--background` | BrowserWindow / root container background |
| `--card` | Panels, settings windows, dialog surfaces |
| `--popover` | Context menus, tooltips, command palette |
| `--sidebar-*` | Main app sidebar / activity rail |
| `--primary` | Toolbar primary buttons, active states |
| `--ring` | Keyboard focus outlines (must be visible) |
| `--chart-*` | Any in-app charts/dashboards |
| `--quadrant-*` / `--status-*` | Task/status indicators |
| `--radius` | Window-internal corner radius (0.625rem ≈ 10px) |

**Implementation notes:**
1. Define all tokens as CSS custom properties on `:root`; add `.dark` overrides.
2. Toggle theme by adding/removing `.dark` on the root element (persist user choice).
3. Respect `prefers-color-scheme` as the default if no explicit choice is stored.
4. Because Electron uses Chromium, OKLCH is supported natively — no preprocessor needed.
5. Keep the `--mono` / `--font-display` fonts bundled locally (Inter, JetBrains Mono, Space Grotesk) so the UI is identical offline.

---

## 8. Brand Copper (Supplementary — legacy Fabrica theme)

The original Fabrica brand uses a copper accent rather than indigo. If the desktop app
should echo the brand slide-deck identity, treat `--accent` (and `--primary` secondary
usage) as:

| Token | Hex | Name |
|-------|-----|------|
| `--accent` | `#CC7A4A` | Fabrica Copper |
| `--accent-contrast` | `#FFFFFF` | Text on copper |
| `--status-success` | `#10b981` | Green |
| `--status-error` | `#ef4444` (light) / `#f43f5e` (dark) | Red |
| `--status-warn` | `#f59e0b` | Amber |

Use copper as the *secondary* brand highlight while keeping the OKLCH indigo primary
above for core actions — or swap primary to copper if brand consistency outweighs the
web's indigo identity. **Decision needed from product owner.**
