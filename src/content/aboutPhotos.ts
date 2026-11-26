/**
 * About's collage (Figma "ABOUT FINAL", node 501:94): eight prints of
 * me-final.png, styled like home's (pages/paper/: 80% opacity, the orange
 * tint, the shadow), no tape. Back to front. Each sheet is its centre in the
 * 1600×998 frame, its unrotated size and its CSS rotation, all Figma px
 * (× --au in station.css). Every print is object-fit: cover of the same
 * image, so they share one download. Figma's ninth print (501:111) sits off
 * the frame and is left out.
 */
import meFinal from "../../assets-src/images/me-final.png?print";
import type { Sheet } from "../pages/paper/sheets";
import { compactSizes } from "../lib/frame";

/** The prints are 204–492 CSS px wide at the usual size (the wide one sets it). */
const ABOUT_SIZES = compactSizes("100vw", "500px");

const print = (id: string, cx: number, cy: number, w: number, h: number, rotate: number, crop?: Sheet["crop"]): Sheet => ({
  id, kind: "photo", cx, cy, w, h, rotate, picture: meFinal, sizes: ABOUT_SIZES, crop,
});

export const ABOUT_SHEETS: Sheet[] = [
  print("about-a", 661.5, 524, 253, 264, 0),
  print("about-b", 377.6, 536.57, 491.75, 272.1, -3.44),
  // Figma nests this one in the wide print, which clips its bottom 35px:
  // the visible top 177 of a 279×212 print, its image still sized for 212.
  print("about-c", 363.05, 584.9, 279.38, 177.31, -3.03, { x: 0, y: 0, w: 1, h: 212 / 177.31 }),
  print("about-d", 318.26, 323.75, 264.51, 275.5, 0),
  print("about-e", 606.94, 719.5, 185.06, 209.5, -3.03),
  print("about-f", 451, 314, 304, 316, 0),
  print("about-g", 602.47, 297.25, 204, 212, -3.03),
  print("about-h", 412.47, 670.25, 204, 212, -3.03),
  print("about-i", 265.47, 731.25, 204, 212, -3.03),
];

/**
 * The Connections card on the collage (Figma "Group 122", node 507:219):
 * 308×168, tilted -4.18°, its centre from the bounding box (469–788.4,
 * 654–844). It lies in front of every print.
 */
export const ABOUT_CARD = { cx: 628.7, cy: 749, w: 308, h: 168, rotate: -4.18 };

/** What preloadRoute("/about") decodes (one picture, shared by every print). */
export const ABOUT_PICTURES = [{ picture: meFinal, sizes: ABOUT_SIZES }];
