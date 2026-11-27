import type { RoutePreload } from "../../lib/assets";
import { LOGO_URLS } from "../../content/experience";
import { PRELOAD_PICTURES, TAPE_URL } from "../../content/experiencePhotos";

/** What preloadRoute("/experience") decodes: the index logos, and EnerSys's
 *  two photos (beside the first job) and their tape. */
export const preload: RoutePreload = { images: PRELOAD_PICTURES, urls: [...LOGO_URLS, TAPE_URL] };
