/**
 * The reference frame of design/mockups-v2: 1767×1024. CSS writes mockup
 * coordinates as calc(N * var(--px)) (global.css); TS code that needs the same
 * unit uses pxScale().
 */
export const FRAME = { W: 1767, H: 1024 } as const;

/** CSS px per mockup px: the value of --px. */
export function pxScale(): number {
  return Math.min(window.innerWidth / FRAME.W, window.innerHeight / FRAME.H);
}

/** Narrow, portrait or short windows get the stacked compact layout (open
 *  question #7, user decision). CSS repeats this query (global.css). */
const COMPACT_CLAUSES = ["(max-width: 760px)", "(max-aspect-ratio: 1/1)", "(max-height: 500px)"] as const;
export const COMPACT_QUERY = COMPACT_CLAUSES.join(", ");

/** A `<source sizes>` value: `compact` under any compact clause, else `full`. */
export const compactSizes = (compact: string, full: string) =>
  [...COMPACT_CLAUSES.map((q) => `${q} ${compact}`), full].join(", ");

const compactMql = window.matchMedia(COMPACT_QUERY);

export const isCompact = () => compactMql.matches;

/** `<source sizes>` for an image box `w` mockup px wide in the --px frame. */
export const frameSizes = (w: number) =>
  `(min-aspect-ratio: 1767/1024) ${((w / FRAME.H) * 100).toFixed(2)}vh, ${((w / FRAME.W) * 100).toFixed(2)}vw`;
