import { GOATCOUNTER_CODE, TRACK_HOSTS } from "../config/analytics";

/** Where a link was clicked: GoatCounter's title, so each path splits by place. */
export type ClickSource = "Home" | "Footer" | "About" | "Projects";

export const shouldTrack = (code: string, host: string): boolean => code !== "" && TRACK_HOSTS.includes(host);

/** GoatCounter's count endpoint for one event (no script; a beacon is enough). */
export function countUrl(code: string, path: string, title: string, rnd: string): string {
  const q = new URLSearchParams({ p: path, t: title, e: "true", rnd });
  return `https://${code}.goatcounter.com/count?${q}`;
}

/**
 * Counts one click on an outbound link, e.g. `trackClick("click/github", "Home")`.
 * Never throws and never delays the link (which opens in a new tab anyway).
 */
export function trackClick(path: string, source: ClickSource): void {
  try {
    if (!shouldTrack(GOATCOUNTER_CODE, location.hostname)) return;
    const url = countUrl(GOATCOUNTER_CODE, path, source, Math.random().toString(36).slice(2));
    if (!navigator.sendBeacon?.(url)) new Image().src = url;
  } catch {
    // Counting is best-effort.
  }
}
