/**
 * The site's shared media queries, in one place for TS (lib/frame.ts,
 * lib/motion.ts) and CSS: vite.config.ts expands `@media (--compact)` and
 * `@media (--fine-pointer)` in every stylesheet to these. Pure data, so the
 * Vite config can import it.
 */

/** Narrow, portrait or short windows get the stacked compact layout (open
 *  question #7, user decision). */
export const COMPACT_CLAUSES = ["(max-width: 760px)", "(max-aspect-ratio: 1/1)", "(max-height: 500px)"] as const;
export const COMPACT_QUERY = COMPACT_CLAUSES.join(", ");

/** A mouse or trackpad: the custom cursor and scrollbar replace the native
 *  ones only here (touch keeps its own). */
export const FINE_POINTER_QUERY = "(hover: hover) and (pointer: fine)";

/** `@media (--name)` in CSS → the query. */
export const CUSTOM_MEDIA: Record<string, string> = {
  "--compact": COMPACT_QUERY,
  "--fine-pointer": FINE_POINTER_QUERY,
};
