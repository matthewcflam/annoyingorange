import { lazy, Suspense, type ComponentType } from "react";
import { useRoute } from "../lib/router";
import { PATHS, type RoutePath } from "../config/routes";
import { PAGE_LOADERS, type PageLoader } from "./routeAssets";
import Home from "./home/Home";

/**
 * A page in its own chunk. The transition fetches it before committing
 * (lib/assets.ts preloadRoute), so by render time it is usually loaded and
 * renders straight away. React.lazy alone would still suspend once (and
 * React 19 can hold a Suspense reveal for 300 ms); only a page that isn't
 * loaded yet goes through it.
 */
function chunked(load: PageLoader): ComponentType {
  const Lazy = lazy(load);
  return function Page() {
    const Loaded = load.loaded();
    return Loaded ? <Loaded /> : <Lazy />;
  };
}

/** Canonical path → page (paths from config/routes.ts). */
const PAGES: Record<RoutePath, ComponentType> = {
  [PATHS.home]: Home,
  [PATHS.about]: chunked(PAGE_LOADERS[PATHS.about]),
  [PATHS.experience]: chunked(PAGE_LOADERS[PATHS.experience]),
  [PATHS.projects]: chunked(PAGE_LOADERS[PATHS.projects]),
};

/** Renders the committed route's page, keyed so pages remount fresh. */
export default function Outlet() {
  const route = useRoute();
  const Page = PAGES[route];
  return (
    <Suspense fallback={null}>
      <Page key={route} />
    </Suspense>
  );
}
