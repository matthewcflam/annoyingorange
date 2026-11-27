import { useSyncExternalStore } from "react";
import { FINE_POINTER_QUERY } from "../config/media";

const reducedMql = window.matchMedia("(prefers-reduced-motion: reduce)");

/** prefers-reduced-motion (spec §12). Read when an animation starts, so a
 *  change in system settings applies to the next one. */
export const prefersReducedMotion = () => reducedMql.matches;

const onReducedChange = (fn: () => void) => {
  reducedMql.addEventListener("change", fn);
  return () => reducedMql.removeEventListener("change", fn);
};

/** prefers-reduced-motion for rendering: re-renders when the setting changes. */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(onReducedChange, prefersReducedMotion);
}

/** A mouse or trackpad (config/media.ts). */
export const hasFinePointer = () => window.matchMedia(FINE_POINTER_QUERY).matches;
