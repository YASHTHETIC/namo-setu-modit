// Guard: every project-custom utility class referenced in TSX must have a
// definition in globals.css. (Tailwind utilities are fine without one.)
// Catches regressions like the deleted `.scroll-rail` base rule that once
// collapsed every home rail into a single vertical column.
const fs = require("fs");
const path = require("path");

const CSS = "apps/modit/web/app/globals.css";
const ROOTS = ["apps/modit/web/app", "apps/modit/web/components", "apps/modit/web/widgets", "apps/modit/web/lib"];

// Tailwind core animate utilities — defined by the framework, not by us.
const TAILWIND_ANIMATE = new Set(["animate-spin", "animate-ping", "animate-pulse", "animate-bounce", "animate-none"]);

const css = fs.readFileSync(CSS, "utf8");
const defined = (name) => new RegExp("\\." + name.replace(/-/g, "\\-") + "(?![\\w-])").test(css);

const files = [];
for (const root of ROOTS) {
  const walk = (d) =>
    fs.readdirSync(d, { withFileTypes: true }).forEach((e) => {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.tsx?$/.test(e.name)) files.push(p);
    });
  walk(root);
}

const customRe = /\b(scroll-rail|scroll-snap[\w-]*|skeleton[\w-]*|thin-scroll|scrollbar-hide|fx-[\w-]+|trust3d[\w-]*|animate-(?!spin|ping|pulse|bounce|none)[\w-]+)\b/g;
const missing = new Map();
for (const f of files) {
  const text = fs.readFileSync(f, "utf8");
  // Only className strings — never comments or prose.
  const classAreas = [];
  let c;
  const classRe = /className\s*=\s*(?:"([^"]*)"|'([^']*)'|`([^`]*)`|\{["']([^"']*)["']\})/g;
  while ((c = classRe.exec(text))) classAreas.push(c.slice(1).filter(Boolean).join(" "));
  const hay = classAreas.join("\n");
  let m;
  customRe.lastIndex = 0;
  while ((m = customRe.exec(hay))) {
    const name = m[1];
    if (!defined(name)) {
      if (!missing.has(name)) missing.set(name, []);
      missing.get(name).push(f);
    }
  }
}

if (missing.size) {
  console.error("Undefined custom CSS classes referenced in TSX:");
  for (const [name, users] of missing) console.error(`  .${name} <- ${users.slice(0, 3).join(", ")}`);
  process.exit(1);
}
console.log(`check-css-refs OK — all custom classes resolve (${files.length} files scanned)`);
