// Dev: compare a /?glass-lab screenshot with Figma's 4x render of the glass
// card (design/figma-glass/glass-4x.png). Prints the RMSE (0–255) over the
// card, the edge band (the 20 frame px bevel, 80 px at 4x) and the interior,
// with Figma's text masked out (it isn't in the lab); writes a diff image.
//   node scripts/glassDiff.mjs <ours.png> [diff-out.png]
import sharp from "sharp";

const [, , oursPath, outPath] = process.argv;
if (!oursPath) throw new Error("usage: node scripts/glassDiff.mjs <ours.png> [diff-out.png]");
const W = 1824, H = 784, R = 200, BAND = 80;
const load = (p) => sharp(p).extract({ left: 0, top: 0, width: W, height: H }).removeAlpha().raw().toBuffer();
const [ours, figma] = await Promise.all([load(oursPath), load(new URL("../design/figma-glass/glass-4x.png", import.meta.url).pathname.replace(/^\/(\w:)/, "$1"))]);

// Figma's text: dark, unsaturated pixels, dilated.
const text = new Uint8Array(W * H);
for (let i = 0; i < W * H; i++) {
  const r = figma[i * 3], g = figma[i * 3 + 1], b = figma[i * 3 + 2];
  if (Math.max(r, g, b) < 200 && Math.max(r, g, b) - Math.min(r, g, b) < 30) text[i] = 1;
}
const mask = new Uint8Array(W * H);
const D = 10;
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  if (!text[y * W + x]) continue;
  for (let dy = -D; dy <= D; dy++) for (let dx = -D; dx <= D; dx++) {
    const yy = y + dy, xx = x + dx;
    if (yy >= 0 && yy < H && xx >= 0 && xx < W) mask[yy * W + xx] = 1;
  }
}

const sd = (x, y) => {
  const px = Math.abs(x + 0.5 - W / 2) - W / 2 + R, py = Math.abs(y + 0.5 - H / 2) - H / 2 + R;
  return Math.min(Math.max(px, py), 0) + Math.hypot(Math.max(px, 0), Math.max(py, 0)) - R;
};
const acc = { card: [0, 0], band: [0, 0], interior: [0, 0], paint: [0, 0], "paint-band": [0, 0] };
const chroma = (buf, i) => Math.max(buf[i * 3], buf[i * 3 + 1], buf[i * 3 + 2]) - Math.min(buf[i * 3], buf[i * 3 + 1], buf[i * 3 + 2]);
const diff = Buffer.alloc(W * H * 3, 255);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const i = y * W + x, d = sd(x, y);
  if (d > -3 || mask[i]) continue; // skip the stroke and the text
  let e = 0;
  for (let c = 0; c < 3; c++) {
    const v = ours[i * 3 + c] - figma[i * 3 + c];
    e += v * v;
    diff[i * 3 + c] = Math.max(0, Math.min(255, 128 + v * 4));
  }
  e /= 3;
  const add = (k) => { acc[k][0] += e; acc[k][1]++; };
  add("card");
  add(d > -BAND ? "band" : "interior");
  // The paint: where either render shows orange.
  if (chroma(ours, i) > 25 || chroma(figma, i) > 25) {
    add("paint");
    if (d > -BAND) add("paint-band");
  }
}
for (const [k, [s, n]] of Object.entries(acc)) console.log(`${k.padEnd(9)} rmse ${Math.sqrt(s / n).toFixed(2)}  (${n} px)`);
if (outPath) await sharp(diff, { raw: { width: W, height: H, channels: 3 } }).png().toFile(outPath);
