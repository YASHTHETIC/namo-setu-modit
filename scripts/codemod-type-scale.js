#!/usr/bin/env node
/**
 * Migrate text-[Npx] -> type tokens.
 *
 *   node scripts/codemod-type-scale.js apps/modit/web/app/products/page.tsx            (dry run)
 *   node scripts/codemod-type-scale.js apps/modit/web/app/products/page.tsx --write    (apply)
 *
 * 7-9px values are NOT auto-converted: they are listed for manual rewrite/removal.
 * Mapping: 10->tiny, 11->micro, 12->caption, 13->body-sm, 14->body-md,
 *          15-16->body-lg, 17-19->title-md, 20-23->title-lg, 24+->display.
 * Requires the matching fontSize tokens in tailwind.config (see plan Phase 1).
 */
const fs = require('fs');

const MAP = (px) => {
  if (px <= 9) return null;            // manual: delete or rewrite
  if (px === 10) return 'text-tiny';
  if (px === 11) return 'text-micro';
  if (px === 12) return 'text-caption';
  if (px === 13) return 'text-body-sm';
  if (px === 14) return 'text-body-md';
  if (px <= 16) return 'text-body-lg';
  if (px <= 19) return 'text-title-md';
  if (px <= 23) return 'text-title-lg';
  return 'text-display';
};

const args = process.argv.slice(2);
const write = args.includes('--write');
const targets = args.filter(a => !a.startsWith('--'));

const walk = (dir, out = []) => {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    if (f.name === 'node_modules' || f.name === '.next') continue;
    const p = require('path').join(dir, f.name);
    f.isDirectory() ? walk(p, out) : /\.(tsx|jsx)$/.test(f.name) && out.push(p);
  }
  return out;
};

const expand = (t) => {
  const base = t.replace(/\/?\*+$/, '');
  if (fs.existsSync(base) && fs.statSync(base).isDirectory()) return walk(base);
  return fs.existsSync(t) ? [t] : [];
};

let totalChanged = 0, totalManual = 0;
for (const file of targets.flatMap(expand)) {
  const src = fs.readFileSync(file, 'utf8');
  let changed = 0, manual = [];
  // handles variant prefixes too: sm:text-[13px], md:hover:text-[11px]
  const out = src.split('\n').map((line, i) =>
    line.replace(/text-\[(\d+(?:\.\d+)?)px\]/g, (m, n) => {
      const token = MAP(parseFloat(n));
      if (!token) { manual.push(`${i + 1}: ${m}`); return m; }
      changed++;
      return token;
    })
  ).join('\n');

  if (changed || manual.length) {
    console.log(`${file}: ${changed} converted, ${manual.length} manual`);
    manual.slice(0, 20).forEach(l => console.log(`   MANUAL ${l}`));
  }
  if (write && changed) fs.writeFileSync(file, out);
  totalChanged += changed; totalManual += manual.length;
}
console.log(`\nTotal: ${totalChanged} ${write ? 'converted' : 'would convert'}, ${totalManual} need manual rewrite.`);
if (!write) console.log('Dry run. Add --write to apply.');
