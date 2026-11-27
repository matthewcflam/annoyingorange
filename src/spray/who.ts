/**
 * "who?" on home (spec §7.2). User request: it shows finished and sprays
 * only when clicked (respray()). Home remounts on every visit, so its engine
 * attaches here:
 * - The first visit renders the finished spray at once, silently (the
 *   engine's instant mode: no hiss, no timeline).
 * - Every later visit shows the last picture (resolves open question #2);
 *   leaving mid-spray keeps the finished picture.
 */
import { prefersReducedMotion } from "../lib/motion";
import type { SprayEngine, SprayPicture } from "./sprayEngine";

let engine: SprayEngine | null = null;
/** The finished picture, saved when Home unmounts. */
let picture: SprayPicture | null = null;

/** Home mounted. Returns the detach function for unmount. */
export function attachWho(e: SprayEngine): () => void {
  engine = e;
  if (picture) e.show(picture);
  else e.spray({ instant: true });
  return () => {
    picture = e.finish();
    if (engine === e) engine = null;
  };
}

/** Spray again from scratch, animated: a click on "who?" (user request) and
 *  /?spray-debug after editing sprayPace.ts. Reduced motion: nothing. */
export function respray(): void {
  if (prefersReducedMotion()) return;
  engine?.spray();
}
