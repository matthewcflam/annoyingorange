import photo from "../../../assets-src/images/home-photo.jpg?printLarge";
import groupPhoto from "../../../assets-src/images/home-group.jpg?printLarge";
import tapeSkyline from "../../../assets-src/images/tape-skyline.png?w=252&paperFibre=126&tape";
import sheetPaper from "../../../assets-src/images/paper-sheet.png?sheet";
import { compactSizes, frameSizes } from "../../lib/frame";
import type { Sheet } from "../../components/paper/sheet";

/**
 * Home's paper (Figma "Home Page Final"): the two prints top right and the
 * skyline's sheet, as boxes in mockup px (components/paper/sheet.ts).
 */

/** Figma's crop of the photo inside the front print ("image 127"). */
const PHOTO_CROP = { x: -0.3058, y: -0.0952, w: 1.5207, h: 1.0952 };

/** The front print's image is 250.99 × 1.5207 ≈ 382 mockup px wide; the group
 *  photo fills its 349-wide box. Compact: ~340px and ~310px. */
const ME_SIZES = compactSizes("340px", frameSizes(382));
const GROUP_SIZES = compactSizes("310px", frameSizes(349));

/** The two prints, back to front (Figma "IMG_7757-2 1" and "image 127"; centres
 *  from Figma's transforms, CSS rotations). No tape. The group photo runs off
 *  the top edge (its top is at y -48), so home.css pins this cluster to the top. */
export const PHOTO_SHEETS: Sheet[] = [
  { id: "photo-group", kind: "photo", cx: 1492.9, cy: 48.17, w: 349, h: 183, rotate: 1.545, picture: groupPhoto, sizes: GROUP_SIZES },
  { id: "photo-me", kind: "photo", cx: 1299.26, cy: 139.41, w: 250.99, h: 261.36, rotate: -0.334, picture: photo, sizes: ME_SIZES, crop: PHOTO_CROP },
];

/** The skyline's sheet (Figma "Rectangle 154": a blank paper sheet, the
 *  skyline drawn on it) and its tape, centred on its top edge. The left side
 *  is trimmed (user request; Figma's is 763 wide at cx 539.71, cy 859.38) so
 *  the sheet runs as far past the drawing's left end (x 249.5) as Figma's runs
 *  past its right: 7.7. The right edge stays put, so the centre moves 41.79
 *  along the sheet's own (turned) x axis, and the tape moves with it. */
export const SKY_SHEET: Sheet = {
  id: "sky", kind: "blank", cx: 581.48, cy: 858.10, w: 679.42, h: 221, rotate: -1.757, src: sheetPaper,
};
export const SKY_TAPE: Sheet = {
  id: "tape-sky", kind: "tape", cx: 578.59, cy: 747.64, w: 126, h: 50, rotate: -1.757, src: tapeSkyline,
};

/** Everything home shows above the fold, for lib/assets.ts to fetch at boot. */
export const HOME_PICTURES = [
  { picture: photo, sizes: ME_SIZES },
  { picture: groupPhoto, sizes: GROUP_SIZES },
];
export const HOME_URLS = [tapeSkyline, sheetPaper];
