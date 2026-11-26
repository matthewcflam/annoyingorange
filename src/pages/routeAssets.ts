/**
 * What each route needs before it shows (lib/assets.ts preloads it; main.tsx
 * registers this table). Home's data is in the main chunk; each station
 * page's image list is its `*.preload.ts`, fetched alongside the page's own
 * chunk, so the page content never ships in the main chunk.
 */
import type { ComponentType } from "react";
import type { RouteAssets } from "../lib/assets";
import { PATHS, type RoutePath } from "../config/routes";
import { HOME_PICTURES, HOME_URLS } from "./home/homeSheets";
import { loadSkyline } from "./home/skyline";

/** A page chunk's loader that remembers the page once it has arrived,
 *  whoever fetched it (a hover prefetch, the transition), so Outlet.tsx can
 *  render it without suspending. */
export interface PageLoader {
  (): Promise<{ default: ComponentType }>;
  /** The page, if its chunk has arrived. */
  loaded(): ComponentType | null;
}

function pageLoader(load: () => Promise<{ default: ComponentType }>): PageLoader {
  let page: ComponentType | null = null;
  return Object.assign(
    () =>
      load().then((m) => {
        page = m.default;
        return m;
      }),
    { loaded: () => page },
  );
}

/** Station pages' chunks (Outlet.tsx renders them). Home is in the main
 *  chunk: it's what the site opens on. */
export const PAGE_LOADERS = {
  [PATHS.about]: pageLoader(() => import("./about/About")),
  [PATHS.experience]: pageLoader(() => import("./experience/Experience")),
  [PATHS.projects]: pageLoader(() => import("./projects/Projects")),
} as const satisfies Partial<Record<RoutePath, PageLoader>>;

export const ROUTE_ASSETS: Record<RoutePath, RouteAssets> = {
  [PATHS.home]: {
    preload: () => ({ images: HOME_PICTURES, urls: HOME_URLS, extras: () => loadSkyline().catch(() => undefined) }),
  },
  [PATHS.about]: {
    page: PAGE_LOADERS[PATHS.about],
    preload: () => import("./about/about.preload").then((m) => m.preload),
  },
  [PATHS.experience]: {
    page: PAGE_LOADERS[PATHS.experience],
    preload: () => import("./experience/experience.preload").then((m) => m.preload),
  },
  [PATHS.projects]: {
    page: PAGE_LOADERS[PATHS.projects],
    preload: () => import("./projects/projects.preload").then((m) => m.preload),
  },
};
