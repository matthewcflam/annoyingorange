/** vite-imagetools presets (vite.config.ts). */
declare module "*?hero" {
  const picture: import("./lib/assets").Picture;
  export default picture;
}
declare module "*?collage" {
  const picture: import("./lib/assets").Picture;
  export default picture;
}
declare module "*?frost" {
  /** A data URI. */
  const src: string;
  export default src;
}
declare module "*?frostlight" {
  const src: string;
  export default src;
}
declare module "*?poster" {
  /** A WebP URL. */
  const src: string;
  export default src;
}
/** Home's paper (vite.config.ts; the texture is baked in by scripts/paperBake.ts). */
declare module "*?print" {
  const picture: import("./lib/assets").Picture;
  export default picture;
}
declare module "*?homeposter" {
  const picture: import("./lib/assets").Picture;
  export default picture;
}
/** Tape: `?w=…&paperFibre=…&tape` (the preset name last). A WebP URL. */
declare module "*&tape" {
  const src: string;
  export default src;
}
declare module "*?sheet" {
  /** A WebP URL. */
  const src: string;
  export default src;
}
