import { FONTS } from "../config/timings";

/**
 * Font family names as Fontsource registers them (spec §5.1). The variable
 * packages add a " Variable" suffix; the short name silently falls back.
 * These must match the stacks in config/tokens.css.
 */
export const FAMILY = {
  body: "Inter Variable",
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

/** Body text on the station pages (tokens.css --font-text). */
const NUNITO = fontString(500, 16, "Nunito");

/** Load the station pages' body font (Nunito). preloadRoute() calls it, so a
 *  page transition never swaps fonts on screen. Never rejects. */
export function loadTextFont(): Promise<void> {
  return document.fonts.load(NUNITO).then(
    () => undefined,
    () => undefined,
  );
}

/**
 * Resolve once every font the landing route's first screen needs is loaded,
 * or after the timeout (spec §5.4). Nothing renders until this, so no font
 * swap lands mid-animation. Always Helvetica Rounded (if supplied) and Inter
 * (its fallback until the file arrives; preloaded from index.html,
 * vite.config.ts). Nunito only when landing on a station page: home doesn't
 * use it, so it never holds up home's first paint.
 */
export async function waitForFonts(route: string, timeoutMs = FONTS.TIMEOUT_MS): Promise<void> {
  await Promise.race([
    Promise.all([
      document.fonts.load(fontString(400, 16, FAMILY.body)),
      document.fonts.load(fontString(700, 16, FAMILY.body)),
      route === "/" ? null : loadTextFont(),
      roundedRegistered ? document.fonts.load(fontString(700, 16, ROUNDED)) : null,
    ]),
    new Promise((resolve) => setTimeout(resolve, timeoutMs)),
  ]);
}
