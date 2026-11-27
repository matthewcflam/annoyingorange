/**
 * The spray engine's pure helpers (sprayEngine.ts), kept apart so they can be
 * tested without a canvas.
 */
import { clamp01 } from "../lib/math";
import type { Guide } from "./paceModel";

/** Point at distance `along` on a guide (linear between samples). */
export function pointAt(g: Guide, along: number): [number, number] {
  const f = g.length > 0 ? clamp01(along / g.length) * g.segments : 0;
  const i = Math.min(Math.floor(f), g.segments - 1);
  const t = f - i;
  const p = g.pts;
  return [p[i * 2]! + (p[i * 2 + 2]! - p[i * 2]!) * t, p[i * 2 + 1]! + (p[i * 2 + 3]! - p[i * 2 + 1]!) * t];
}

/** mulberry32: small, fast, seedable. Replays need the same dot sequence. */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
