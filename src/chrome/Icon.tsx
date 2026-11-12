import { ICONS } from "./icons";

/** One of the inline glyphs (icons.ts); sized by its parent's CSS. */
export default function Icon({ name }: { name: keyof typeof ICONS }) {
  const { viewBox, d } = ICONS[name];
  return (
    <svg viewBox={viewBox} aria-hidden="true" focusable="false">
      <path fill="currentColor" d={d} />
    </svg>
  );
}
