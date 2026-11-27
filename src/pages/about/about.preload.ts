import type { RoutePreload } from "../../lib/assets";
import { ABOUT_PICTURES } from "../../content/aboutPhotos";

/** What preloadRoute("/about") decodes: the collage's one picture. */
export const preload: RoutePreload = { images: ABOUT_PICTURES };
