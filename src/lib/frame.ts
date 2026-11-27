/**
 * The reference frame of design/mockups-v2: 1767×1024. CSS writes mockup
 * coordinates as calc(N * var(--px)) (global.css); TS code that needs the same
 * unit uses pxScale().
 */
export const FRAME = { W: 1767, H: 1024 } as const;

/** The project pages' Figma frame (1640 wide) and its layout grid, as in
 *  tokens.css (--grid-cols / --grid-margin / --grid-gutter: keep in step). */
export const PROJECT_FRAME_W = 1640;
export const GRID = { COLS: 9, MARGIN: 15, GUTTER: 15 } as const;

/** Width of `n` grid columns plus the gutters between them, in frame px. */
export const gridSpan = (n: number, frameW = PROJECT_FRAME_W) =>
  (n * (frameW - 2 * GRID.MARGIN - (GRID.COLS - 1) * GRID.GUTTER)) / GRID.COLS + (n - 1) * GRID.GUTTER;

/** CSS px per mockup px: the value of --px. */
export function pxScale(): number {
  return Math.min(window.innerWidth / FRAME.W, window.innerHeight / FRAME.H);
}

import { COMPACT_CLAUSES, COMPACT_QUERY } from "../config/media";

/** A `<source sizes>` value: `compact` under any compact clause, else `full`. */
export const compactSizes = (compact: string, full: string) =>
  [...COMPACT_CLAUSES.map((q) => `${q} ${compact}`), full].join(", ");

/** Created on first use, so the pure helpers here import without a window (tests). */
let compactMql: MediaQueryList | null = null;

export const isCompact = () => (compactMql ??= window.matchMedia(COMPACT_QUERY)).matches;

/** `<source sizes>` for an image box `w` mockup px wide in the --px frame. */
export const frameSizes = (w: number) =>
  `(min-aspect-ratio: ${FRAME.W}/${FRAME.H}) ${((w / FRAME.H) * 100).toFixed(2)}vh, ${((w / FRAME.W) * 100).toFixed(2)}vw`;
