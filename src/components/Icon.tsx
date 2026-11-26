import { ICONS } from "./icons";

/** One of the inline glyphs (icons.ts); sized by its parent's CSS. `tight`
 *  crops the viewBox to the glyph's ink, so the box is exactly what shows. */
export default function Icon({ name, tight = false }: { name: keyof typeof ICONS; tight?: boolean }) {
  const { viewBox, ink, d } = ICONS[name];
  return (
    <svg viewBox={tight ? ink : viewBox} aria-hidden="true" focusable="false">
      <path fill="currentColor" d={d} />
    </svg>
  );
}
