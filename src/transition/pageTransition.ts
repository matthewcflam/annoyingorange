/**
 * The page transition, copied from 2xa.studio (About → Projects there). A
 * dither cover fills the screen bottom to top while "Now arriving at: <name>"
 * scramble-types on it; under the cover the page (and the page theme) swaps;
 * after a hold the cover dithers away, bottom to top, revealing the new page.
 * Cover: ditherCover.ts. Title: scrambleTitle.ts. Timings: TRANSITION.
 *
 * Cover colour (user decision): the opposite of the page being left. Leaving
 * a light page (home, the project pages) it is dark, with light text; leaving
 * a dark one (About, Experience) it is light, with black text. Home ↔
 * projects uses the same dark as every other dark cover (user request).
 *
 * Switching between projects is not a station change, so it only crossfades
 * the project's content; the name, list and Map box stay put.
 */
import { gsap } from "../lib/gsap";
import { play } from "../audio/engine";
import { PROJECT, TRANSITION } from "../config/timings";
import { routeFor, STATIONS } from "../config/routes";
import { getRoute, type TransitionRunner } from "../lib/router";
import { preloadRoute } from "../lib/assets";
import { markPageHidden, markPageShown } from "../lib/pageReveal";
import { prefersReducedMotion } from "../lib/motion";
import { projectScale } from "../lib/tokens";
import { cover } from "./ditherCover";
import { title } from "./scrambleTitle";

const isProject = (path: string) => routeFor(path).station === "projects";

/** The words typed on the cover, as groups placed by transition.css. */
function titleFor(path: string): string[] {
  const route = routeFor(path);
  const station = STATIONS.find((s) => s.id === route.station);
  return ["Now arriving at:", station ? station.label : "Home"];
}

/** Cover tone for leaving `from`: opposite to its page theme. */
const toneLeaving = (from: string) => (routeFor(from).theme === "light" ? "dark" : "light");

/** The cover's colour token: the dark or light page colour. */
const coverColor = (tone: "dark" | "light"): `--${string}` =>
  tone === "light" ? "--color-cover-light" : "--color-cover-dark";

/** The next page's images, or give up after PRELOAD_MAX_MS. */
function imagesReady(to: string): Promise<void> {
  return Promise.race([preloadRoute(to), new Promise<void>((r) => setTimeout(r, TRANSITION.PRELOAD_MAX_MS))]);
}

export const pageTransition: TransitionRunner = async (to, commit) => {
  const ready = imagesReady(to);
  if (isProject(getRoute()) && isProject(to)) return projectSwitch(ready, commit);

  const reduced = prefersReducedMotion();
  const tone = toneLeaving(getRoute());
  const color = coverColor(tone);
  cover.setTone(tone, color);
  play("station.click");

  // The title runs on its own clock: its type-out outlasts the cover, like 2xa's.
  if (reduced) title.showStatic(titleFor(to));
  else void title.run(titleFor(to));

  await cover.show(reduced, color);
  await ready;
  markPageHidden();
  commit(); // the map morph and name-block fade start here, under the cover

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

/** TODO(open-question #3): placeholder project switch (§10.1). */
async function projectSwitch(ready: Promise<void>, commit: () => void) {
  const offset = prefersReducedMotion() ? 0 : PROJECT.SWITCH_OFFSET_PX * projectScale();
  const swap = () => document.querySelectorAll(".project__swap");
  play("project.select");
  await gsap.to(swap(), {
    autoAlpha: 0,
    y: -offset,
    duration: PROJECT.SWITCH_OUT,
    ease: PROJECT.SWITCH_EASE_OUT,
  });
  await ready;
  commit();
  await gsap.fromTo(
    swap(),
    { autoAlpha: 0, y: offset },
    { autoAlpha: 1, y: 0, duration: PROJECT.SWITCH_IN, ease: PROJECT.SWITCH_EASE_IN, clearProps: "transform" },
  );
}
