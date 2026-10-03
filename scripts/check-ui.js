#!/usr/bin/env node
/**
 * MODIT UI ratchet gate.
 * Counts violations per rule and fails if any count is HIGHER than the saved baseline.
 *
 *   node scripts/check-ui.js            -> check (use in CI)
 *   node scripts/check-ui.js --update   -> write/lower baseline (run after migrating files)
 *
 * Rules: type-scale, z-index, colors, images
 */
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'apps', 'modit', 'web');
const BASELINE = path.join(__dirname, 'ui-baseline.json');
const GLOBALS = [path.join(SRC, 'app', 'globals.css'), path.join(SRC, 'styles', 'globals.css')].find(fs.existsSync);

const walk = (dir, out = []) => {
  if (!fs.existsSync(dir)) return out;
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    if (f.name === 'node_modules' || f.name === '.next') continue;
    const p = path.join(dir, f.name);
    f.isDirectory() ? walk(p, out) : /\.(tsx|ts|jsx|js|css)$/.test(f.name) && out.push(p);
  }
  return out;
};

// Allowed hexes = every hex declared in globals.css (the token source of truth)
const allowedHex = new Set();
if (GLOBALS) {
  (fs.readFileSync(GLOBALS, 'utf8').match(/#[0-9a-fA-F]{3,8}\b/g) || []).forEach(h => allowedHex.add(h.toLowerCase()));
}
['#fff', '#ffffff', '#000', '#000000'].forEach(h => allowedHex.add(h));

const rules = {
  'type-scale': (src) => (src.match(/text-\[\d+(\.\d+)?px\]/g) || []).length,
  'z-index': (src) => (src.match(/\bz-\[\d+\]/g) || []).length,
  colors: (src, file) => {
    if (file === GLOBALS) return 0;
    return (src.match(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g) || [])
      .filter(h => !allowedHex.has(h.toLowerCase())).length;
  },
  images: (src, file) => {
    if (!/\.(tsx|jsx)$/.test(file)) return 0;
    return (src.match(/<img\b[^>]*>/gs) || [])
      .filter(tag => !/\bwidth=/.test(tag) || !/\bheight=/.test(tag) || !/\balt=/.test(tag)).length;
  },
};

const files = walk(SRC);
const counts = Object.fromEntries(Object.keys(rules).map(k => [k, 0]));
const perFile = {};

for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  for (const [name, fn] of Object.entries(rules)) {
    const n = fn(src, file);
    if (n) {
      counts[name] += n;
      (perFile[name] ||= []).push([path.relative(ROOT, file), n]);
    }
  }
}

if (process.argv.includes('--update')) {
  const prev = fs.existsSync(BASELINE) ? JSON.parse(fs.readFileSync(BASELINE, 'utf8')) : {};
  const next = {};
  for (const k of Object.keys(counts)) next[k] = prev[k] === undefined ? counts[k] : Math.min(prev[k], counts[k]);
  fs.writeFileSync(BASELINE, JSON.stringify(next, null, 2) + '\n');
  console.log('Baseline written:', next);
  process.exit(0);
}

if (!fs.existsSync(BASELINE)) {
  console.error('No baseline. Run: node scripts/check-ui.js --update');
  process.exit(1);
}

const base = JSON.parse(fs.readFileSync(BASELINE, 'utf8'));
let failed = false;
for (const k of Object.keys(counts)) {
  const b = base[k] ?? 0;
  const status = counts[k] > b ? 'FAIL' : counts[k] < b ? 'IMPROVED (run --update)' : 'ok';
  console.log(`${k.padEnd(11)} ${String(counts[k]).padStart(5)} / baseline ${String(b).padStart(5)}  ${status}`);
  if (counts[k] > b) {
    failed = true;
    (perFile[k] || []).sort((a, c) => c[1] - a[1]).slice(0, 8).forEach(([f, n]) => console.log(`    ${n}  ${f}`));
  }
}
process.exit(failed ? 1 : 0);
