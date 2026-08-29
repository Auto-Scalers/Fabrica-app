const fs = require('fs');
const path = require('path');

const css = fs.readFileSync(
  path.join(__dirname, 'src/renderer/src/assets/main.css'),
  'utf8'
);

// Extract blocks: :root, .dark, .plugin-security-chrome
function extractBlock(css, selector) {
  const re = new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*\\{');
  const m = re.exec(css);
  if (!m) return null;
  let i = m.index + m[0].length;
  let depth = 1;
  const start = i;
  while (i < css.length && depth > 0) {
    if (css[i] === '{') depth++;
    else if (css[i] === '}') depth--;
    i++;
  }
  return css.slice(start, i - 1);
}

function parseVars(block) {
  const vars = {};
  const re = /(--[\w-]+)\s*:\s*([^;]+);/g;
  let m;
  while ((m = re.exec(block))) {
    vars[m[1].trim()] = m[2].trim();
  }
  return vars;
}

function resolve(vars, name, seen = new Set()) {
  let val = vars[name];
  if (val === undefined) return undefined;
  if (seen.has(name)) return val;
  seen.add(name);
  const m = /var\((--[\w-]+)(?:\s*,\s*([^)]+))?\)/.exec(val);
  if (m) {
    const r = resolve(vars, m[1], seen);
    return r !== undefined ? r : (m[2] || val);
  }
  return val;
}

// ---- color conversion ----
function parseColor(str) {
  str = str.trim();
  // oklch
  let m = /oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*([\d.]+%?))?\s*\)/.exec(str);
  if (m) {
    let alpha = m[4] ? parseFloat(m[4]) / (m[4].includes('%') ? 100 : 1) : 1;
    return { type: 'oklch', L: +m[1], C: +m[2], H: +m[3], alpha };
  }
  // rgb(...) with spaces and slash alpha
  m = /rgb\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*([\d.]+%?))?\s*\)/.exec(str);
  if (m) {
    let alpha = m[4] ? parseFloat(m[4]) / (m[4].includes('%') ? 100 : 1) : 1;
    return { type: 'srgb', r: +m[1] / 255, g: +m[2] / 255, b: +m[3] / 255, alpha };
  }
  return null;
}

function oklchToLinear(L, C, H) {
  const h = (H * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
  const r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bl = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;
  return [r, g, bl];
}

function toLinearSrgb(c) {
  if (c.type === 'oklch') return oklchToLinear(c.L, c.C, c.H);
  return [c.r, c.g, c.b];
}

function clamp(x) { return Math.min(1, Math.max(0, x)); }

function srgbGamma(x) {
  return x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
}

function relLuminance(lin) {
  const [r, g, b] = lin.map(srgbGamma).map(clamp);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function composite(fgLin, bgLin, alpha) {
  return fgLin.map((c, i) => c * alpha + bgLin[i] * (1 - alpha));
}

function contrast(fg, bg) {
  const fgLin = toLinearSrgb(fg);
  const bgLin = toLinearSrgb(bg);
  let fLin, bLin;
  if (fg.alpha !== undefined && fg.alpha < 1) {
    fLin = composite(fgLin, bgLin, fg.alpha);
    bLin = bgLin;
  } else if (bg.alpha !== undefined && bg.alpha < 1) {
    // fg over bg composited on white
    const white = [1, 1, 1];
    const cb = composite(bgLin, white, bg.alpha);
    fLin = fgLin;
    bLin = cb;
  } else {
    fLin = fgLin;
    bLin = bgLin;
  }
  const L1 = relLuminance(fLin);
  const L2 = relLuminance(bLin);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

const blocks = {
  light: { sel: ':root', vars: parseVars(extractBlock(css, ':root')) },
  dark: { sel: '.dark', vars: parseVars(extractBlock(css, '\\.dark')) },
  'security-light': null,
  'security-dark': null,
};

// plugin-security-chrome reuses fabrica-security tokens; analyze those separately
const secBlock = extractBlock(css, '\\.plugin-security-chrome');
const secVars = parseVars(secBlock);

const pairsText = [
  ['foreground', 'background'],
  ['foreground', 'card'],
  ['card-foreground', 'card'],
  ['card-foreground', 'background'],
  ['popover-foreground', 'popover'],
  ['muted-foreground', 'background'],
  ['muted-foreground', 'card'],
  ['muted-foreground', 'muted'],
  ['secondary-foreground', 'secondary'],
  ['secondary-foreground', 'background'],
  ['accent-foreground', 'accent'],
  ['primary-foreground', 'primary'],
  ['destructive-foreground', 'destructive'],
  ['sidebar-foreground', 'sidebar'],
  ['sidebar-accent-foreground', 'sidebar-accent'],
  ['sidebar-primary-foreground', 'sidebar-primary'],
  ['worktree-sidebar-foreground', 'worktree-sidebar'],
  ['worktree-sidebar-accent-foreground', 'worktree-sidebar-accent'],
];
const pairsUI = [
  ['border', 'background'],
  ['border', 'card'],
  ['input', 'background'],
  ['sidebar-border', 'sidebar'],
  ['worktree-sidebar-border', 'worktree-sidebar'],
  ['tab-group-split-divider', 'card'],
  ['tab-group-split-divider-strong', 'card'],
  ['ring', 'background'],
  ['terminal-pane-title-on-dark-fg', 'background'],
  ['terminal-pane-title-on-dark-placeholder', 'background'],
  ['terminal-pane-title-on-light-fg', 'background'],
  ['terminal-pane-title-on-light-placeholder', 'background'],
];

function analyze(name, vars, pairs, ui) {
  console.log('\n===== ' + name + ' =====');
  for (const [fgN, bgN] of pairs) {
    const fgs = resolve(vars, '--' + fgN);
    const bgs = resolve(vars, '--' + bgN);
    if (!fgs || !bgs) { console.log(`  skip ${fgN}/${bgN} (undef)`); continue; }
    const fg = parseColor(fgs); const bg = parseColor(bgs);
    if (!fg || !bg) { console.log(`  skip ${fgN}/${bgN} (parse ${fgs} / ${bgs})`); continue; }
    const r = contrast(fg, bg);
    const ok = r >= 4.5;
    console.log(`  ${ok ? 'PASS' : 'FAIL'} ${r.toFixed(2)}:1  ${fgN} / ${bgN}`);
  }
  for (const [fgN, bgN] of ui) {
    const fgs = resolve(vars, '--' + fgN);
    const bgs = resolve(vars, '--' + bgN);
    if (!fgs || !bgs) { console.log(`  skip ${fgN}/${bgN} (undef)`); continue; }
    const fg = parseColor(fgs); const bg = parseColor(bgs);
    if (!fg || !bg) { console.log(`  skip ${fgN}/${bgN} (parse)`); continue; }
    const r = contrast(fg, bg);
    const ok = r >= 3;
    console.log(`  [UI] ${ok ? 'PASS' : 'FAIL'} ${r.toFixed(2)}:1  ${fgN} / ${bgN}`);
  }
}

analyze('light', blocks.light.vars, pairsText, pairsUI);
analyze('dark', blocks.dark.vars, pairsText, pairsUI);

// security chrome uses fabrica-security-* tokens (resolved through vars map of .dark/.light depending on theme)
// Build a merged vars map for security: use light base + security overrides
function analyzeSecurity(themeName, baseVars) {
  const vars = Object.assign({}, baseVars, secVars);
  console.log('\n===== plugin-security-chrome (' + themeName + ') =====');
  const secPairsText = [
    ['fabrica-security-foreground', 'fabrica-security-background'],
    ['fabrica-security-card-foreground', 'fabrica-security-card'],
    ['fabrica-security-popover-foreground', 'fabrica-security-popover'],
    ['fabrica-security-secondary-foreground', 'fabrica-security-secondary'],
    ['fabrica-security-muted-foreground', 'fabrica-security-background'],
    ['fabrica-security-muted-foreground', 'fabrica-security-muted'],
    ['fabrica-security-accent-foreground', 'fabrica-security-accent'],
    ['fabrica-security-primary-foreground', 'fabrica-security-primary'],
  ];
  const secPairsUI = [
    ['fabrica-security-border', 'fabrica-security-background'],
    ['fabrica-security-input', 'fabrica-security-background'],
    ['fabrica-security-ring', 'fabrica-security-background'],
  ];
  for (const [fgN, bgN] of secPairsText) {
    const fg = parseColor(resolve(vars, '--' + fgN));
    const bg = parseColor(resolve(vars, '--' + bgN));
    if (!fg || !bg) { console.log(`  skip ${fgN}`); continue; }
    const r = contrast(fg, bg);
    console.log(`  ${r >= 4.5 ? 'PASS' : 'FAIL'} ${r.toFixed(2)}:1  ${fgN} / ${bgN}`);
  }
  for (const [fgN, bgN] of secPairsUI) {
    const fg = parseColor(resolve(vars, '--' + fgN));
    const bg = parseColor(resolve(vars, '--' + bgN));
    if (!fg || !bg) { console.log(`  skip ${fgN}`); continue; }
    const r = contrast(fg, bg);
    console.log(`  [UI] ${r >= 3 ? 'PASS' : 'FAIL'} ${r.toFixed(2)}:1  ${fgN} / ${bgN}`);
  }
}
analyzeSecurity('light', blocks.light.vars);
analyzeSecurity('dark', blocks.dark.vars);
