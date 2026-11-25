// Postbuild size budget: what a visitor landing on home downloads before the
// intro can play. Sizes are gzip for text (JS, CSS, SVG; what a host sends)
// and raw for images and fonts (already compressed). Images count the
// largest file of the format a modern browser picks (AVIF, else WebP), so the
// total is an upper bound. Tune the numbers here; a failure exits 1 and fails
// `npm run build`.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { join } from "node:path";

const BUDGET_KB = {
  /** The main JS chunk (everything home needs to run). */
  mainJs: 135,
  /** Everything home loads before its intro: JS, CSS, preloaded fonts, home's images and skyline. */
  homeTotal: 300,
  /** Any one home image. */
  image: 60,
};

/** Home's images and the skyline, by source file name. */
const HOME_ASSETS = ["home-photo", "tape-long", "tape-short", "tape-skyline", "paper-sheet", "home-skyline"];

const DIST = "dist";
const ASSETS = join(DIST, "assets");
const files = readdirSync(ASSETS);
const kb = (n) => n / 1024;
const size = (file) => {
  const path = join(ASSETS, file);
  return /\.(js|css|svg|html)$/.test(file) ? gzipSync(readFileSync(path)).length : statSync(path).size;
};

const html = readFileSync(join(DIST, "index.html"), "utf8");
const linked = [...html.matchAll(/(?:src|href)="\/assets\/([^"]+)"/g)].map((m) => m[1]);
const mainJs = linked.filter((f) => f.endsWith(".js"));
const css = linked.filter((f) => f.endsWith(".css"));
const fonts = linked.filter((f) => /\.woff2?$/.test(f));

const images = HOME_ASSETS.map((name) => {
  const mine = files.filter((f) => f.startsWith(`${name}-`));
  const pick = ["avif", "webp", "svg", "png", "jpg"].map((ext) => mine.filter((f) => f.endsWith(`.${ext}`))).find((l) => l.length);
  if (!pick) return { name, file: null, bytes: 0 };
  const file = pick.sort((a, b) => size(b) - size(a))[0];
  return { name, file, bytes: size(file) };
});

const rows = [
  ...mainJs.map((f) => ["js", f, size(f)]),
  ...css.map((f) => ["css", f, size(f)]),
  ...fonts.map((f) => ["font", f, size(f)]),
  ...images.map((i) => ["image", i.file ?? `${i.name} (missing)`, i.bytes]),
];
const total = rows.reduce((s, r) => s + r[2], 0);
const mainBytes = mainJs.reduce((s, f) => s + size(f), 0);

console.log("\nHome first-load budget (KB; gzip for text):");
for (const [kind, file, bytes] of rows) console.log(`  ${kind.padEnd(6)} ${kb(bytes).toFixed(1).padStart(7)}  ${file}`);
console.log(`  ${"total".padEnd(6)} ${kb(total).toFixed(1).padStart(7)}`);

const fails = [];
if (kb(mainBytes) > BUDGET_KB.mainJs) fails.push(`main JS ${kb(mainBytes).toFixed(1)} KB > ${BUDGET_KB.mainJs} KB`);
if (kb(total) > BUDGET_KB.homeTotal) fails.push(`home total ${kb(total).toFixed(1)} KB > ${BUDGET_KB.homeTotal} KB`);
for (const i of images) if (kb(i.bytes) > BUDGET_KB.image) fails.push(`${i.file} ${kb(i.bytes).toFixed(1)} KB > ${BUDGET_KB.image} KB`);

if (fails.length) {
  console.error(`\n✖ Over budget (scripts/budget.mjs):\n  ${fails.join("\n  ")}\n`);
  process.exit(1);
}
console.log(`✓ Within budget (main JS ≤ ${BUDGET_KB.mainJs} KB, home ≤ ${BUDGET_KB.homeTotal} KB, images ≤ ${BUDGET_KB.image} KB)\n`);
