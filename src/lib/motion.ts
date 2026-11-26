/** prefers-reduced-motion (spec §12). Read when an animation starts, so a
 *  change in system settings applies to the next one. */
export const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** A mouse or trackpad: the custom cursor and scrollbar replace the native
 *  ones only here (touch keeps its own). global.css repeats this query. */
export const FINE_POINTER_QUERY = "(hover: hover) and (pointer: fine)";
export const hasFinePointer = () => window.matchMedia(FINE_POINTER_QUERY).matches;
