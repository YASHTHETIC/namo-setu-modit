#!/usr/bin/env node
// CI guard: every /products/ image referenced in frontend source must exist
// on disk AND use a URL-safe name. (Linux 404s on , & + % and unicode in
// filenames — this test stops that bug class from shipping again.)
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..", "apps", "modit", "web");
const BAD = /[^A-Za-z0-9 ._\-/]/;
let bad = 0;
let missing = 0;
let total = 0;

function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name === ".next") continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(full);
    else if (/\.(ts|tsx)$/.test(e.name)) yield full;
  }
}

for (const file of walk(root)) {
  const src = fs.readFileSync(file, "utf8");
  const re = /(["'])(\/products\/[^\n]*?)\1/g;
  let m;
  while ((m = re.exec(src))) {
    total++;
    const ref = m[2];
    const name = ref.split("/").pop();
    if (BAD.test(name)) {
      bad++;
      console.log(`BAD NAME: ${ref}  (${path.relative(root, file)})`);
    }
    if (!fs.existsSync(path.join(root, "public", ref.replace(/^\//, "")))) {
      missing++;
      console.log(`MISSING:  ${ref}  (${path.relative(root, file)})`);
    }
  }
}
console.log(`checked ${total} refs — bad names: ${bad}, missing: ${missing}`);
process.exit(bad + missing > 0 ? 1 : 0);
