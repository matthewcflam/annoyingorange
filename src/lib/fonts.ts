import { FONTS } from "../config/timings";

/**
 * Font family names as Fontsource registers them (spec §5.1). The variable
 * packages add a " Variable" suffix; the short name silently falls back.
 * These must match the stacks in config/tokens.css.
 */
export const FAMILY = {
  body: "Inter Variable",
  name: "Inter Variable",
  station: "Fragment Mono",
  sound: "Inter Variable",
  muted: "Inter Variable",
} as const;

/** Build a CSS `font` shorthand. */
export function fontString(weight: number, sizePx: number, family: string): string {
  return `${weight} ${sizePx}px "${family}"`;
}

/**
 * Helvetica Rounded Bold (the project pages and the Map box): a licensed
 * font the user supplies as assets-src/fonts/helvetica-rounded-bold.woff2
 * (or .woff / .otf / .ttf). Discovered at build time, so the build passes
 * without it; then --font-rounded falls back (tokens.css, global.css).
 */
const ROUNDED = "Helvetica Rounded";
const roundedFiles = import.meta.glob("/assets-src/fonts/helvetica-rounded-bold.{woff2,woff,otf,ttf}", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

let roundedRegistered = false;

/** Register the supplied file as "Helvetica Rounded" 700. Call once, before render. */
export function registerRoundedFont(): void {
  const url = Object.values(roundedFiles)[0];
  if (!url || roundedRegistered) return;
  roundedRegistered = true;
  const face = new FontFace(ROUNDED, `url("${url}")`, { weight: "700", style: "normal" });
  document.fonts.add(face);
  void face.load().catch(() => undefined);
}

/**
 * Resolve once every font the first screens need is loaded, or after the
 * timeout (spec §5.4). Nothing renders until this, so no font swap lands
 * mid-animation. Inter, and Helvetica Rounded if supplied: Fragment Mono
 * (the mute toggle, hero placeholder labels) loads on use and may swap in. The
 * Inter latin file is preloaded from index.html (vite.config.ts).
 */
export async function waitForFonts(timeoutMs = FONTS.TIMEOUT_MS): Promise<void> {
  await Promise.race([
    Promise.all([
      document.fonts.load(`1em "${FAMILY.sound}"`),
      document.fonts.load(`1em "${FAMILY.muted}"`),
      document.fonts.load(fontString(400, 16, FAMILY.body)),
      document.fonts.load(fontString(500, 16, "Nunito")), // body text (tokens.css --font-text)
      roundedRegistered ? document.fonts.load(fontString(700, 16, ROUNDED)) : null,
    ]),
    new Promise((resolve) => setTimeout(resolve, timeoutMs)),
  ]);
}
