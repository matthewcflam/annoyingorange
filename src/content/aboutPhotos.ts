/**
 * About's collage (Figma "ABOUT FINAL", node 501:94, revised), back to front:
 * a grey sketch card with an orange bird drawn on it, the seawall print
 * (me-final.png, Figma's crop of the same photo), the café print, the
 * Connections card, and "Let's chat!" beside it. Boxes are the centre in the
 * 1600×998 frame, the unrotated size and the CSS rotation, all Figma px
 * (× --au in about.css). Both prints use home's paper styling
 * (components/paper/: 80% opacity, the shadow; user decision), no tape.
 */
import meFinal from "../../assets-src/images/me-final.png?print";
import meCafe from "../../assets-src/images/me-cafe.jpg?printLarge";
import birdSvg from "../../assets-src/svg/about-bird.svg";
import type { Sheet } from "../components/paper/sheet";
import { compactSizes } from "../lib/frame";

/** The prints are 214–366 CSS px wide at the usual size. */
const ABOUT_SIZES = compactSizes("100vw", "400px");

const print = (id: string, picture: Sheet["picture"], cx: number, cy: number, w: number, h: number, rotate: number): Sheet => ({
  id, kind: "photo", cx, cy, w, h, rotate, picture, sizes: ABOUT_SIZES,
});

export const ABOUT_SHEETS: Sheet[] = [
  print("about-seawall", meFinal, 639.9, 285.96, 213.82, 222.66, 4.85),
  print("about-cafe", meCafe, 481.76, 469.2, 366.35, 274.76, 1.52),
];

/**
 * The sketch card (Figma "Group 121"): a flat grey card, 328×114 at
 * (130, 298), no shadow, with the bird (Group 100, about-bird.svg) drawn on
 * it; `bird` is the SVG's box from the card's top-left. Both are 70% (tokens).
 */
export const ABOUT_SKETCH = {
  cx: 294, cy: 355, w: 328, h: 114, rotate: 0,
  bird: { src: birdSvg, x: 15, y: 5.62, w: 300.84, h: 100.43 },
};

/**
 * The Connections card on the collage (Figma "Group 122", node 507:219):
 * 308×168, tilted -4.18°, its centre from the bounding box (482–801.4,
 * 557–747). It lies in front of both prints.
 */
export const ABOUT_CARD = { cx: 641.7, cy: 652, w: 308, h: 168, rotate: -4.18 };

/** "Let's chat!" (Figma 512:745), left of the card: its right edge and the
 *  middle of its line. It is set at the card's text size (user request;
 *  Figma has 16), so it grows left and evenly up and down from Figma's box. */
export const ABOUT_CHAT = { right: 458.6, midY: 670.5 };

/** What preloadRoute("/about") decodes. */
export const ABOUT_PICTURES = [meFinal, meCafe].map((picture) => ({ picture, sizes: ABOUT_SIZES }));
