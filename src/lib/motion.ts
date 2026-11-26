/** prefers-reduced-motion (spec §12). Read when an animation starts, so a
 *  change in system settings applies to the next one. */
export const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

import { FINE_POINTER_QUERY } from "../config/media";

/** A mouse or trackpad (config/media.ts). */
export const hasFinePointer = () => window.matchMedia(FINE_POINTER_QUERY).matches;
