/**
 * Page code and image preload/decode (spec §10.3). Station-link hover calls
 * prefetchRoute(); the page transition awaits preloadRoute() before it swaps
 * the page in, so heroes are decoded by the time they're shown.
 */
import { PROJECTS, type CollageItem } from "../content/projects";
import { ABOUT_PICTURES } from "../content/aboutPhotos";
import { LOGO_URLS } from "../content/experience";
import { HOME_PICTURES, HOME_URLS } from "../pages/paper/sheets";
import { loadTextFont } from "./fonts";
import { compactSizes, gridSpan, PROJECT_FRAME_W } from "./frame";
import { onBrowserIdle } from "./idle";
import { PREFETCH } from "../config/timings";
import { PATHS, type RoutePath } from "../config/routes";
import skylineUrl from "../../assets-src/svg/home-skyline.svg";

/** vite-imagetools `as=picture` output: srcset per format + <img> fallback. */
export interface Picture {
  /** Format ("avif", "webp") → srcset. */
  sources: Record<string, string>;
  img: { src: string; w: number; h: number };
}

/** Rotated pieces are resampled by the browser, so they get more pixels than
 *  they cover to stay crisp. */
const COLLAGE_OVERSAMPLE = 1.5;

/** The collage's width on the full layout in the project frame: columns 6–8,
 *  3 columns + 2 gutters (project.css). */
const COLLAGE_SCALE = 0.75; // --collage-scale in project.css
const COLLAGE_COLUMNS_W = gridSpan(3);

/** The collage piece `it`'s `sizes`: its print is `it.w`% of the collage,
 *  which is `scale` of columns 6–8 (COLLAGE_COLUMNS_W of the project frame) on the full
 *  layout and about the window's width on compact (project.css). */
export function collageSizes(it: CollageItem, scale = COLLAGE_SCALE): string {
  const share = (it.w / 100) * COLLAGE_OVERSAMPLE * coverZoom(it);
  return compactSizes(`${(share * 100).toFixed(1)}vw`, `${(((share * COLLAGE_COLUMNS_W * scale) / PROJECT_FRAME_W) * 100).toFixed(1)}vw`);
}

/** How much wider than its print a cropped photo is drawn (object-fit: cover). */
function coverZoom(it: CollageItem): number {
  const media = it.media.w / it.media.h;
  return it.aspect && media > it.aspect ? media / it.aspect : 1;
}

interface RouteImage {
  picture: Picture;
  sizes: string;
}

/** What each route needs before it shows (above the fold). */
interface RouteAssets {
  /** Pictures to decode. */
  images?: () => RouteImage[];
  /** Plain image URLs to decode (home's tape, the Experience logos). */
  urls?: () => string[];
  /** The page's own chunk (home is in the main chunk). */
  page?: () => Promise<unknown>;
  /** Anything else: home's skyline markup, images in a page's own chunk. */
  extras?: () => Promise<unknown>;
}

const ROUTE_ASSETS: Record<RoutePath, RouteAssets> = {
  [PATHS.home]: {
    images: () => HOME_PICTURES,
    urls: () => HOME_URLS,
    extras: () => loadSkyline().catch(() => undefined),
  },
  [PATHS.about]: {
    images: () => ABOUT_PICTURES,
    page: () => PAGE_LOADERS.about(),
  },
  [PATHS.experience]: {
    urls: () => LOGO_URLS,
    page: () => PAGE_LOADERS.experience(),
    // Experience's first photos and tape live in its own chunk: fetched
    // through a dynamic import so the main chunk doesn't carry them.
    extras: () =>
      import("../content/experiencePhotos").then(
        (m) => Promise.all([...m.PRELOAD_PICTURES.map(load), decodeUrl(m.TAPE_URL)]),
        () => undefined,
      ),
  },
  [PATHS.projects]: {
    // The first project's collage, on screen as the page shows.
    images: () =>
      PROJECTS[0].collage.items.flatMap((it) => (it.media.kind === "image" ? [{ picture: it.media.picture, sizes: collageSizes(it, PROJECTS[0].collage.scale) }] : [])),
    page: () => PAGE_LOADERS.projects(),
  },
};

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

/** Fetch and decode a plain image URL (home's tape, the Experience logos). */
function decodeUrl(src: string): Promise<void> {
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

/** Fetch a route's code and decode its images. Never rejects. */
export function preloadRoute(path: string): Promise<void> {
  const a: RouteAssets = ROUTE_ASSETS[path as RoutePath] ?? {};
  const code = a.page?.().then(() => undefined, () => undefined);
  // Station pages set their body text in Nunito, which home never loads.
  const font = a.page ? loadTextFont() : undefined;
  return Promise.all([...(a.images?.() ?? []).map(load), ...(a.urls?.() ?? []).map(decodeUrl), code, font, a.extras?.()]).then(() => undefined);
}

/** Fetch every page chunk (code only, no images) once the browser is idle. */
export function prefetchPages(): void {
  onBrowserIdle(() => Object.values(PAGE_LOADERS).forEach((load) => void load().catch(() => undefined)), {
    timeoutMs: PREFETCH.IDLE_TIMEOUT_MS,
    fallbackMs: PREFETCH.IDLE_FALLBACK_MS,
  });
}

/** Start fetching a route's images. Cheap to call repeatedly (hover). */
export function prefetchRoute(path: string): void {
  void preloadRoute(path);
}
