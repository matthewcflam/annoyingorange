/**
 * The collage's geometry (Collage.tsx, project.css), pure so it can be
 * tested: each print's `sizes`, its aspect on the page, the collage's height.
 * Lengths are % of the collage's width (cqw), as in content/projects.ts.
 */
import { compactSizes, gridSpan, PROJECT_FRAME_W } from "../../lib/frame";
import type { CollageItem } from "../../content/projects";

/** Rotated pieces are resampled by the browser, so they get more pixels than
 *  they cover to stay crisp. */
const COLLAGE_OVERSAMPLE = 1.5;

/** The collage's width on the full layout in the project frame: `scale` of
 *  columns 6–8, 3 columns + 2 gutters (project.css). */
const COLLAGE_SCALE = 0.75; // --collage-scale in collage.css
const COLLAGE_COLUMNS_W = gridSpan(3);

/** Room below the lowest print for its tilt (cqw). */
const COLLAGE_PAD = 3;

/** The collage piece `it`'s `sizes`: its print is `it.w`% of the collage,
 *  which is `scale` of columns 6–8 (COLLAGE_COLUMNS_W of the project frame) on
 *  the full layout and about the window's width on compact (project.css). */
export function collageSizes(it: CollageItem, scale = COLLAGE_SCALE): string {
  const share = (it.w / 100) * COLLAGE_OVERSAMPLE * coverZoom(it);
  return compactSizes(`${(share * 100).toFixed(1)}vw`, `${(((share * COLLAGE_COLUMNS_W * scale) / PROJECT_FRAME_W) * 100).toFixed(1)}vw`);
}

/** How much wider than its print a cropped photo is drawn (object-fit: cover). */
function coverZoom(it: CollageItem): number {
  const media = it.media.w / it.media.h;
  return it.aspect && media > it.aspect ? media / it.aspect : 1;
}

/** A print's width / height on the page (cropped when `aspect` is set). */
export function printAspect(it: CollageItem): number {
  return it.aspect ?? it.media.w / it.media.h;
}

/** The collage's height in cqw: down to the foot of its lowest print. */
export function collageHeight(items: readonly CollageItem[]): number {
  return Math.max(...items.map((it) => it.y + it.w / printAspect(it))) + COLLAGE_PAD;
}
