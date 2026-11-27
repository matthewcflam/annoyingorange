/**
 * Home's paper texture, baked at build time (an imagetools transform, wired
 * in vite.config.ts). The look the user approved was a WebGL shader
 * (paperShader.ts, deleted); this is the same math run once in sharp, so the
 * page only ships plain images and never needs a GPU context for it.
 *
 * Directives (on an image import, usually through a preset):
 *   paperFill=<css colour token>   replace every pixel with that colour (the
 *                                  blank skyline sheet: the source is a stub)
 *   paperTint=<css colour token>   multiply by the token's colour, mixed by its alpha (tape)
 *   paperFibre=<sheet width>       faint long fibre, in sheet (mockup) px
 *
 * Colour tokens are read from src/config/tokens.css, so the tokens stay the
 * one place to tune them (a change needs a dev-server restart).
 */
import { readFileSync } from "node:fs";
import sharp, { type FormatEnum } from "sharp";
import type { TransformFactory } from "imagetools-core";
import { PAPER } from "../src/config/timings.ts";

type Rgba = [number, number, number, number];

function token(name: string): Rgba {
  const css = readFileSync(new URL("../src/config/tokens.css", import.meta.url), "utf8");
  const m = css.match(new RegExp(`${name}\\s*:\\s*([^;]+);`));
  if (!m) throw new Error(`[paper] token ${name} not found in tokens.css`);
  const v = m[1].trim();
  const hex = v.match(/^#([0-9a-f]{6})$/i);
  if (hex) {
    const n = parseInt(hex[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 1];
  }
  const rgba = v.match(/rgba?\(([^)]+)\)/);
  if (rgba) {
    const [r, g, b, a = "1"] = rgba[1].split(/[\s,/]+/).filter(Boolean);
    return [Number(r), Number(g), Number(b), Number(a)];
  }
  throw new Error(`[paper] can't parse ${name}: ${v}`);
}

// The shader's value noise (hash, smoothstep-interpolated lattice).
const SEED = 23;
function hash2(x: number, y: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7 + SEED * 17) * 43758.5453123;
  return s - Math.floor(s);
}
function noise(x: number, y: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  let fx = x - ix;
  let fy = y - iy;
  fx = fx * fx * (3 - 2 * fx);
  fy = fy * fy * (3 - 2 * fy);
  const a = hash2(ix, iy);
  const b = hash2(ix + 1, iy);
  const c = hash2(ix, iy + 1);
  const d = hash2(ix + 1, iy + 1);
  return (a + (b - a) * fx) * (1 - fy) + (c + (d - c) * fx) * fy;
}

export const paperTransform: TransformFactory = (config, ctx) => {
  const fill = config.paperFill as string | undefined;
  const tint = config.paperTint as string | undefined;
  const fibre = config.paperFibre ? Number(config.paperFibre) : 0;
  if (!fill && !tint && !fibre) return;
  for (const k of ["paperFill", "paperTint", "paperFibre"]) if (config[k]) ctx.useParam(k);

  return async function paper(state, image) {
    // Runs last, so the resize has already been applied to these pixels.
    const { data, info } = await image.clone().ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const { width: w, height: h } = info;
    const fillC = fill ? token(fill) : null;
    const tintC = tint ? token(tint) : null;
    const perSheetPx = fibre ? fibre / w : 0; // sheet px per image px

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        let r = data[i] / 255;
        let g = data[i + 1] / 255;
        let b = data[i + 2] / 255;
        if (fillC) {
          r = fillC[0] / 255;
          g = fillC[1] / 255;
          b = fillC[2] / 255;
          data[i + 3] = Math.round(fillC[3] * 255);
        }
        if (tintC) {
          const a = tintC[3];
          r *= 1 - a + (tintC[0] / 255) * a;
          g *= 1 - a + (tintC[1] / 255) * a;
          b *= 1 - a + (tintC[2] / 255) * a;
        }
        if (fibre) {
          const sx = (x + 0.5) * perSheetPx;
          const sy = (y + 0.5) * perSheetPx;
          const fib = noise(sx * 0.08, sy * 0.9) * 0.6 + noise(sx * 0.7, sy * 0.7) * 0.4;
          const k = 1 + (fib - 0.5) * 2 * PAPER.FIBRE;
          r *= k;
          g *= k;
          b *= k;
        }
        data[i] = Math.round(Math.min(1, Math.max(0, r)) * 255);
        data[i + 1] = Math.round(Math.min(1, Math.max(0, g)) * 255);
        data[i + 2] = Math.round(Math.min(1, Math.max(0, b)) * 255);
      }
    }

    // A fresh pipeline from the baked pixels, re-encoded as the `format`
    // directive asked (it ran on the old pipeline).
    const out = sharp(data, { raw: { width: w, height: h, channels: 4 } });
    const format = (state.transforms.format as keyof FormatEnum | undefined) ?? "webp";
    const quality = state.transforms.quality as number | undefined;
    return out.toFormat(format, quality ? { quality } : {});
  };
};
