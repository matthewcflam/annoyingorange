/**
 * The page transition, copied from 2xa.studio (About → Projects there). A
 * dither cover fills the screen bottom to top while "Now arriving at: <name>"
 * scramble-types on it; under the cover the page swaps; after a hold the
 * cover dithers away, bottom to top, revealing the new page.
 * Cover: ditherCover.ts. Title: scrambleTitle.ts. Timings: TRANSITION.
 *
 * Cover colour (user decision): the opposite of the page being left. Every
 * page is light, so every cover is --color-cover-dark with light text.
 */
import { play } from "../audio/engine";
import { TRANSITION } from "../config/timings";
import { routeFor, STATIONS } from "../config/routes";
import { ARRIVING_LEAD, HOME_LABEL } from "../content/site";
import type { TransitionRunner } from "../lib/router";
import { preloadRoute } from "../lib/assets";
import { markPageHidden, markPageShown } from "../lib/pageReveal";
import { prefersReducedMotion } from "../lib/motion";
import { cover } from "./ditherCover";
import { title } from "./scrambleTitle";

/** The words typed on the cover, as groups placed by transition.css. */
function titleFor(path: string): string[] {
  const route = routeFor(path);
  const station = STATIONS.find((s) => s.id === route.station);
  return [ARRIVING_LEAD, station ? station.label : HOME_LABEL];
}

/** The next page's images, or give up after PRELOAD_MAX_MS. */
function imagesReady(to: string): Promise<void> {
  return Promise.race([preloadRoute(to), new Promise<void>((r) => setTimeout(r, TRANSITION.PRELOAD_MAX_MS))]);
}

export const pageTransition: TransitionRunner = async (to, commit) => {
  const ready = imagesReady(to);
  const reduced = prefersReducedMotion();
  play("station.click");

  // The title runs on its own clock: its type-out outlasts the cover, like 2xa's.
  if (reduced) title.showStatic(titleFor(to));
  else void title.run(titleFor(to));

  await cover.show(reduced);
  await ready;
  markPageHidden();
  commit(); // the new page mounts here, under the cover

  // Input unlocks once the cover is nearly clear; the rest of the clear and
  // the title's type-out finish on their own.
  await new Promise<void>((unlock) => {
    void cover.hide(reduced, {
      delay: TRANSITION.HOLD,
      onClearStart: markPageShown,
      onUnlock: () => {
        if (reduced) title.hide();
        unlock();
      },
    });
  });
};

