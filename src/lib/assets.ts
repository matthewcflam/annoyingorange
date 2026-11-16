/**
 * Page code and image preload/decode (spec §10.3). Station and project-list hover call
 * prefetchRoute(); the page transition awaits preloadRoute() before it swaps
 * the page in, so heroes are decoded by the time they're shown.
 */
import { HEROES } from "../content/projects";
import { ABOUT_PHOTOS } from "../content/aboutPhotos";
import { EXPERIENCE_PHOTOS } from "../content/experience";
import { HOME_PICTURES, HOME_URLS, POSTER_SIZES } from "../pages/paper/sheets";
import { isCompact } from "./frame";
import { loadTextFont } from "./fonts";
import skylineUrl from "../../assets-src/svg/home-skyline.svg";

/** vite-imagetools `as=picture` output: srcset per format + <img> fallback. */
export interface Picture {
  /** Format ("avif", "webp") → srcset. */
  sources: Record<string, string>;
  img: { src: string; w: number; h: number };
}

/** Rendered width of a project hero: at most 502px, less under 1640 wide (project.css --hu). */
export const HERO_SIZES = "(max-width: 1640px) 31vw, 502px";

interface RouteImage {
  picture: Picture;
  sizes: string;
}

/** Images per route that must be decoded before it shows (above the fold,
 *  or Experience's hover photos, which must not pop in). */
function routeImages(path: string): RouteImage[] {
  // Home: the prints, and the posters unless compact hides them.
  if (path === "/") return HOME_PICTURES.filter((p) => !(isCompact() && p.sizes === POSTER_SIZES));
  if (path === "/about") return ABOUT_PHOTOS.map(({ picture, sizes }) => ({ picture, sizes }));
  if (path === "/experience") return EXPERIENCE_PHOTOS.map(({ picture, sizes }) => ({ picture, sizes }));
  if (path === "/projects") return HEROES.map((h) => ({ picture: h.picture, sizes: HERO_SIZES }));
  return [];
}

const loads = new Map<Picture, Promise<void>>();

/** A detached <picture> picks the same source the page will, so the fetch and
 *  decode land in the cache the real <img> uses. */
function load({ picture: pic, sizes }: RouteImage): Promise<void> {
  let p = loads.get(pic);
  if (!p) {
    const picture = document.createElement("picture");
    for (const [format, srcset] of Object.entries(pic.sources)) {
      const source = document.createElement("source");
      source.type = `image/${format}`;
      source.sizes = sizes;
      source.srcset = srcset;
      picture.append(source);
    }
    const img = document.createElement("img");
    img.src = pic.img.src;
    picture.append(img);
    p = img.decode().catch(() => {
      loads.delete(pic); // retry on the next hover
    });
    loads.set(pic, p);
  }
  return p;
}

const urlLoads = new Map<string, Promise<void>>();

/** Fetch and decode a plain image URL (the About photos' light frost). */
export function decodeUrl(src: string): Promise<void> {
  let p = urlLoads.get(src);
  if (!p) {
    const img = new Image();
    img.src = src;
    p = img.decode().catch(() => {
      urlLoads.delete(src);
    });
    urlLoads.set(src, p);
  }
  return p;
}

/** Plain image URLs per route (decoded alongside its pictures). */
function routeUrls(path: string): string[] {
  if (path === "/") return HOME_URLS;
  return path === "/about" ? ABOUT_PHOTOS.map((p) => p.frostLight) : [];
}

/** Home's skyline markup (home-skyline.svg), fetched once and inlined by
 *  Home.tsx so its paths can draw themselves. The same file an <img> would
 *  load, so its ~500 paths stay out of the JS bundle; fetched at boot when the
 *  visitor lands on home (preloadRoute), so it isn't waiting on React. */
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

/** Station pages' chunks (pages/Outlet.tsx renders them). Home is in the
 *  main chunk: it's what the site opens on. */
export const PAGE_LOADERS = {
  about: () => import("../pages/About"),
  experience: () => import("../pages/Experience"),
  projects: () => import("../pages/projects/Projects"),
} as const;

function pageLoader(path: string) {
  if (path === "/about") return PAGE_LOADERS.about;
  if (path === "/experience") return PAGE_LOADERS.experience;
  return path === "/projects" ? PAGE_LOADERS.projects : null;
}

/** Fetch a route's code and decode its images. Never rejects. */
export function preloadRoute(path: string): Promise<void> {
  const code = pageLoader(path)?.().then(() => undefined, () => undefined);
  const skyline = path === "/" ? loadSkyline().catch(() => undefined) : undefined;
  // Station pages set their body text in Nunito, which home never loads.
  const font = pageLoader(path) ? loadTextFont() : undefined;
  return Promise.all([...routeImages(path).map(load), ...routeUrls(path).map(decodeUrl), code, skyline, font]).then(() => undefined);
}

/** Fetch every page chunk (code only, no images) once the browser is idle. */
export function prefetchPages(): void {
  const run = () => Object.values(PAGE_LOADERS).forEach((load) => void load().catch(() => undefined));
  if ("requestIdleCallback" in window) requestIdleCallback(run, { timeout: 3000 });
  else setTimeout(run, 1000);
}

/** Start fetching a route's images. Cheap to call repeatedly (hover). */
export function prefetchRoute(path: string): void {
  void preloadRoute(path);
}
