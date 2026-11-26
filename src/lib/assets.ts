/**
 * Page code and image preload/decode (spec §10.3). Station-link hover calls
 * prefetchRoute(); the page transition awaits preloadRoute() before it swaps
 * the page in, so the images are decoded by the time they're shown.
 *
 * This file is the machinery only: what each route needs is
 * pages/routeAssets.ts, registered from main.tsx. Station pages list their
 * images in their own `*.preload.ts`, fetched with the page's chunk, so their
 * content stays out of the main chunk.
 */
import type { Picture } from "./picture";
import { loadTextFont } from "./fonts";
import { onBrowserIdle } from "./idle";
import { PREFETCH } from "../config/timings";
import type { RoutePath } from "../config/routes";

/** A picture and the `sizes` the page shows it at. */
export interface RouteImage {
  picture: Picture;
  sizes: string;
}

/** The images a route shows above the fold. */
export interface RoutePreload {
  /** Pictures to decode. */
  images?: readonly RouteImage[];
  /** Plain image URLs to decode (tape, logos). */
  urls?: readonly string[];
  /** Anything else to wait for (home's skyline markup). */
  extras?: () => Promise<unknown>;
}

/** What a route needs before it shows. */
export interface RouteAssets {
  /** Its images (sync for home, whose data is in the main chunk; a dynamic
   *  import of the page's `*.preload.ts` for the others). */
  preload?: () => RoutePreload | Promise<RoutePreload>;
  /** The page's own chunk (home is in the main chunk). Station pages set
   *  their body text in Nunito, which is fetched alongside. */
  page?: () => Promise<unknown>;
}

let routes: Partial<Record<RoutePath, RouteAssets>> = {};

/** main.tsx registers pages/routeAssets.ts before anything preloads. */
export function registerRouteAssets(table: Partial<Record<RoutePath, RouteAssets>>): void {
  routes = table;
}

const noop = () => undefined;

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

/** Fetch and decode a plain image URL (tape, the Experience logos). */
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

function loadAll(p: RoutePreload): Promise<unknown> {
  return Promise.all([...(p.images ?? []).map(load), ...(p.urls ?? []).map(decodeUrl), p.extras?.()]);
}

/** Fetch a route's code and decode its images. Never rejects. */
export function preloadRoute(path: string): Promise<void> {
  const a = routes[path as RoutePath] ?? {};
  const code = a.page?.().then(noop, noop);
  const font = a.page ? loadTextFont() : undefined;
  const images = a.preload ? Promise.resolve().then(a.preload).then(loadAll).then(noop, noop) : undefined;
  return Promise.all([code, font, images]).then(noop);
}

/** Fetch every page chunk (code only, no images) once the browser is idle. */
export function prefetchPages(): void {
  onBrowserIdle(() => Object.values(routes).forEach((r) => void r.page?.().catch(noop)), {
    timeoutMs: PREFETCH.IDLE_TIMEOUT_MS,
    fallbackMs: PREFETCH.IDLE_FALLBACK_MS,
  });
}

/** Start fetching a route's images. Cheap to call repeatedly (hover). */
export function prefetchRoute(path: string): void {
  void preloadRoute(path);
}
