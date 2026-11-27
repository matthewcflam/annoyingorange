/** `v` held between `lo` and `hi`. */
export const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);

/** `v` held between 0 and 1. */
export const clamp01 = (v: number) => clamp(v, 0, 1);
