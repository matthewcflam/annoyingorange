import photo from "../../../assets-src/images/home-photo.png?print";
import { TAPE_LONG, TAPE_SHORT } from "../../components/paper/tapes";
import tapeSkyline from "../../../assets-src/images/tape-skyline.png?w=252&paperFibre=126&tape";
import sheetPaper from "../../../assets-src/images/paper-sheet.png?sheet";
import { compactSizes, frameSizes } from "../../lib/frame";
import type { Sheet } from "../../components/paper/sheet";

/**
 * Home's paper (Figma "Home Page Final"): the taped prints and the skyline's
 * sheet, as boxes in mockup px (components/paper/sheet.ts).
 */

/** Figma's crop of the photo inside each print. */
const PHOTO_CROP = { x: -0.3058, y: -0.0952, w: 1.5207, h: 1.0952 };

/** The prints' image is 213.82 × 1.5207 ≈ 325 mockup px wide (the big ones;
 *  all three share one `sizes`, so they share one download). Compact: ~310px.
 */
const PRINT_SIZES = compactSizes("310px", frameSizes(325));

/** The three prints, back to front, and their tape. */
export const PHOTO_SHEETS: Sheet[] = [
  { id: "photo-0", kind: "photo", cx: 1485.7, cy: 244.6, w: 213.82, h: 222.66, rotate: 4.51, picture: photo, sizes: PRINT_SIZES, crop: PHOTO_CROP },
  { id: "photo-1", kind: "photo", cx: 1430.4, cy: 186.8, w: 213.82, h: 222.66, rotate: -3.59, picture: photo, sizes: PRINT_SIZES, crop: PHOTO_CROP },
  { id: "photo-2", kind: "photo", cx: 1371.7, cy: 337.4, w: 146.14, h: 152.18, rotate: 2.79, picture: photo, sizes: PRINT_SIZES, crop: PHOTO_CROP },
];

export const PHOTO_TAPES: Sheet[] = [
  { id: "tape-long", kind: "tape", cx: 1420.9, cy: 79.8, w: 135, h: 31, rotate: -7.2, src: TAPE_LONG },
  { id: "tape-short", kind: "tape", cx: 1375, cy: 263, w: 76, h: 30, rotate: 0, src: TAPE_SHORT },
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
  { picture: photo, sizes: PRINT_SIZES },
];
export const HOME_URLS = [TAPE_LONG, TAPE_SHORT, tapeSkyline, sheetPaper];
