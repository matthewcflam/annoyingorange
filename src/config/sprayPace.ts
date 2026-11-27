/**
 * "who?" spray pace: how long the nozzle takes between each pair of anchor
 * points in assets-src/svg/who-spray.svg, in ms. Edit freely; the spray lasts
 * as long as everything here adds up to (now 2500 ms).
 *
 * Points are named by letter and index along the path: w0 is the w's first
 * point. Within a segment the nozzle still slows on curves and speeds up on
 * straights (src/spray/paceModel.ts); these only set each segment's total.
 * The comments are the starting values' length and average speed; they go
 * stale once you edit (the dev overlay shows live numbers).
 *
 * Dev: open /?spray-debug to see every point labelled with its ms, coloured
 * by speed; save this file to replay, or press R.
 * Starting values: node scripts/spray-pace.mjs (handwriting model).
 */
export interface StrokePace {
  readonly letter: string;
  /** One value per segment: the path's anchor points − 1. */
  readonly segmentsMs: readonly number[];
  /** The can lifts off before the next stroke. */
  readonly liftMs?: number;
}

export const SPRAY_PACE: { readonly leadMs: number; readonly strokes: readonly StrokePace[] } = {
  /** Before the first stroke (the hiss starts here). */
  leadMs: 250,
  strokes: [
    {
      letter: "w",
      segmentsMs: [
         123, // w0 → w1      23px    184 px/s
          39, // w1 → w2      11px    291 px/s
          32, // w2 → w3      11px    338 px/s
          30, // w3 → w4      11px    351 px/s
          29, // w4 → w5      10px    337 px/s
          18, // w5 → w6       6px    325 px/s
          25, // w6 → w7       9px    347 px/s
          29, // w7 → w8      11px    392 px/s
          32, // w8 → w9      10px    319 px/s
          32, // w9 → w10     11px    347 px/s
          31, // w10 → w11    11px    345 px/s
          86, // w11 → w12    21px    250 px/s
          29, // w12 → w13     3px    120 px/s
          20, // w13 → w14     2px    108 px/s
      ],
      liftMs: 110,
    },
    {
      letter: "h",
      segmentsMs: [
          93, // h0 → h1      41px    445 px/s
          17, // h1 → h2       4px    262 px/s
           8, // h2 → h3       2px    248 px/s
          53, // h3 → h4      21px    391 px/s
          33, // h4 → h5      11px    329 px/s
          23, // h5 → h6       6px    274 px/s
          71, // h6 → h7      19px    273 px/s
          34, // h7 → h8       6px    170 px/s
      ],
      liftMs: 120,
    },
    {
      letter: "o",
      segmentsMs: [
         140, // o0 → o1      24px    175 px/s
          17, // o1 → o2       4px    255 px/s
          33, // o2 → o3      10px    293 px/s
          27, // o3 → o4       8px    311 px/s
          64, // o4 → o5      19px    292 px/s
          74, // o5 → o6      10px    136 px/s
          22, // o6 → o7       2px     97 px/s
      ],
      liftMs: 100,
    },
    {
      letter: "?",
      segmentsMs: [
          18, // ?0 → ?1       2px     88 px/s
          69, // ?1 → ?2       7px    108 px/s
          43, // ?2 → ?3       8px    192 px/s
          30, // ?3 → ?4       9px    316 px/s
          27, // ?4 → ?5       9px    337 px/s
          34, // ?5 → ?6      13px    369 px/s
          31, // ?6 → ?7      11px    362 px/s
          17, // ?7 → ?8       7px    431 px/s
          23, // ?8 → ?9      13px    582 px/s
          37, // ?9 → ?10     11px    288 px/s
          18, // ?10 → ?11     3px    165 px/s
          19, // ?11 → ?12     3px    143 px/s
      ],
      liftMs: 140,
    },
    {
      letter: ".",
      segmentsMs: [
          54, // .0 → .1       5px     89 px/s
          23, // .1 → .2       2px    101 px/s
          47, // .2 → .3       5px    104 px/s
          26, // .3 → .4       2px     96 px/s
      ],
    },
  ],
};
