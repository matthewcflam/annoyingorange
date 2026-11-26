import type { CSSProperties } from "react";
import type { Picture } from "../../lib/picture";

/**
 * One sheet of paper (home, About, Experience, the project collages). Boxes
 * are mockup px: the centre,
 * the unrotated size, and the CSS rotation (Figma's sign flipped). Each sheet
 * also says what it is printed with. The paper texture (fibre, halftone, the
 * tape's tint) is baked into the files at build time (vite.config.ts presets,
 * scripts/paperBake.ts), so every sheet is a plain image.
 */
export type SheetKind = "photo" | "tape" | "blank";

export interface Sheet {
  id: string;
  kind: SheetKind;
  cx: number;
  cy: number;
  w: number;
  h: number;
  rotate: number;
  /** Responsive image (photos) with its `sizes`. */
  picture?: Picture;
  sizes?: string;
  /** Plain image URL (tape, the blank sheet). */
  src?: string;
  /** Where the image sits in the box (Figma's crop): its offset and size as
   *  fractions of the box. Omitted: cover. */
  crop?: { x: number; y: number; w: number; h: number };
}

type Box = { cx: number; cy: number; w: number; h: number; rotate: number };

/** A box (centre, unrotated size, rotation) as the custom properties the
 *  paper CSS places it by (home.css, about.css, experience.css). */
export const placeAt = (b: Box): CSSProperties =>
  ({ "--cx": b.cx, "--cy": b.cy, "--w": b.w, "--h": b.h, "--r": `${b.rotate}deg` });
