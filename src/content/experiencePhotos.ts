/**
 * Experience's taped photos (Figma "Experience Final"), by job id, styled
 * like home's prints (pages/paper/). Kept out of content/experience.ts, which
 * the main chunk imports for the index logos: only the Experience chunk and
 * preloadRoute("/experience") (a dynamic import) load these.
 *
 * A cluster's top-left is `dx` right of column `col`'s left edge and `dy`
 * below the job's company cap top; `w`×`h` is its box. Each sheet is placed
 * by its centre inside that box, with its unrotated size and CSS rotation.
 * All Figma px (× --cp in station.css).
 *
 * Column 9 stays empty (user request): the columns stretch but the photos
 * don't, so where a cluster would cross column 8's right edge, `fit` slides
 * it left by just that much: "cluster" moves the whole cluster and narrows
 * the job's text to end before it; a list of sheet ids moves only those.
 */
import enersysSelfie from "../../assets-src/images/enersys1.png?print";
import enersysDemo from "../../assets-src/images/enersys2.png?print";
import sailbotTeam from "../../assets-src/images/sailbot2.png?print";
import tqdTeam from "../../assets-src/images/tqd-team.jpg?print";
import { TAPE_SHORT as tape } from "../components/paper/tapes";
import type { Sheet } from "../components/paper/sheet";
import { compactSizes } from "../lib/frame";
import type { JobId } from "./experience";

export interface PhotoCluster {
  col: number;
  dx: number;
  dy: number;
  w: number;
  h: number;
  fit?: "cluster" | string[];
  sheets: Sheet[];
}

/** The photos are shown ~215–350 CSS px wide at the usual size. */
const PHOTO_SIZES = compactSizes("350px", "360px");

const photo = (id: string, picture: Sheet["picture"], cx: number, cy: number, w: number, h: number, rotate: number): Sheet => ({
  id, kind: "photo", cx, cy, w, h, rotate, picture, sizes: PHOTO_SIZES,
});
const tapeStrip = (id: string, cx: number, cy: number, w: number, h: number, rotate: number): Sheet => ({
  id, kind: "tape", cx, cy, w, h, rotate, src: tape,
});

export const JOB_PHOTOS: Record<JobId, PhotoCluster> = {
  enersys: {
    col: 7, dx: 16.67, dy: 15, w: 296.1, h: 333.6,
    fit: ["enersys-demo", "enersys-tape-1"],
    sheets: [
      photo("enersys-selfie", enersysSelfie, 117.5, 103, 235, 176, 0),
      photo("enersys-demo", enersysDemo, 174.06, 236.78, 229, 173, 5.34),
      tapeStrip("enersys-tape-0", 117, 15, 76, 30, 0),
      tapeStrip("enersys-tape-1", 189.93, 148.98, 76, 30, 9.37),
    ],
  },
  sailbot: {
    col: 4, dx: 30.33, dy: 35, w: 224, h: 185.4,
    sheets: [
      photo("sailbot-team", sailbotTeam, 112, 98.86, 215.47, 161.6, -3.14),
      tapeStrip("sailbot-tape", 107.04, 18.47, 82.3, 32.49, -3.14),
    ],
  },
  tqd: {
    col: 7, dx: -16.73, dy: 10, w: 353.8, h: 212.7,
    fit: "cluster",
    sheets: [
      photo("tqd-team", tqdTeam, 176.9, 116.5, 349, 183, 1.54),
      tapeStrip("tqd-tape", 177.85, 19.91, 82.3, 32.49, 5.21),
    ],
  },
};

/** What preloadRoute("/experience") decodes: EnerSys's two photos (beside
 *  the first job) and the tape. */
export const PRELOAD_PICTURES = [enersysSelfie, enersysDemo].map((picture) => ({ picture, sizes: PHOTO_SIZES }));
export const TAPE_URL = tape;
