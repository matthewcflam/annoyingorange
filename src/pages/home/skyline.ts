/**
 * Home's skyline markup (home-skyline.svg), fetched once and inlined by
 * Home.tsx so its paths can draw themselves (skylineDraw.ts). The same file
 * an <img> would load, so its ~500 paths stay out of the JS bundle; fetched
 * at boot when the visitor lands on home (pages/routeAssets.ts), so it isn't
 * waiting on React.
 */
import skylineUrl from "../../../assets-src/svg/home-skyline.svg";

let skylinePromise: Promise<string> | null = null;
let skylineText: string | null = null;

export function loadSkyline(): Promise<string> {
  return (skylinePromise ??= fetch(skylineUrl)
    .then((r) => (r.ok ? r.text() : Promise.reject(new Error(String(r.status)))))
    .then((text) => (skylineText = text))
    .catch((err: unknown) => {
      skylinePromise = null; // retry on the next visit
      throw err;
    }));
}

/** The skyline markup if it has arrived (return visits inject it at once). */
export const skylineMarkup = () => skylineText;
