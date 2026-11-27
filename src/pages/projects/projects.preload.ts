import type { RoutePreload } from "../../lib/assets";
import { PROJECTS } from "../../content/projects";
import { collageSizes } from "./collageGeometry";

const first = PROJECTS[0]!;

/** What preloadRoute("/projects") decodes: the first project's collage, on
 *  screen as the page shows. */
export const preload: RoutePreload = {
  images: first.collage.items.flatMap((it) =>
    it.media.kind === "image" ? [{ picture: it.media.picture, sizes: collageSizes(it, first.collage.scale) }] : [],
  ),
};
