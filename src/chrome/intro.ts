/**
 * The intro on load (spec §6.5, minus the gate: user change). One timeline,
 * positions in seconds from load, all from GATE in timings.ts. Built once
 * fonts are ready: by then the page is mounted.
 *
 * On home (Figma "Home Page Final"): the paper (posters, photos, tape, the
 * skyline's sheet) is simply there, sharp, from the first frame
 * (pages/paper/); the name fades up, the centre card rushes
 * open, the cat draws itself and the glyphs fade up. The skyline and "who?"
 * are there finished from the first frame (user request: only the cat
 * animates on load; a click replays either, see Home.tsx). Every later visit shows all of it finished.
 */
import { gsap } from "../lib/gsap";
import { GATE } from "../config/timings";
import { openHomeCard } from "../pages/homeIntro";
import { markPageShown } from "../lib/pageReveal";

interface Options {
  /** App root; everything is selected inside it. */
  root: HTMLElement;
  /** Landed on "/"; otherwise a deep link (open question #1). */
  home: boolean;
  reduced: boolean;
}

export function introTimeline({ root, home, reduced }: Options): gsap.core.Timeline {
  const q = gsap.utils.selector(root);
  const tl = gsap.timeline();

  // The page starts to appear here (deep link fade, or home's stagger).
  tl.call(markPageShown, undefined, GATE.PAGE_SHOWN);

  if (!home) {
    // TODO(open-question #1): placeholder deep-link reveal.
    openHomeCard();
    const page = q(".layer--page");
    gsap.set(page, { autoAlpha: 0 });
    tl.to(page, { autoAlpha: 1, duration: GATE.DEEP_LINK_FADE }, GATE.PAGE_SHOWN);
    return tl;
  }

  const name = q(".home__name");
  const catPaths = q(".home__cat path");
  const icons = q(".home__social");

  gsap.set([name, icons], { autoAlpha: 0 });

  tl.to(name, { autoAlpha: 1, duration: GATE.NAME_IN_DURATION, ease: "power2.out" }, GATE.NAME_IN)
    .call(openHomeCard, undefined, GATE.CARD_OPEN)
    .to(icons, { autoAlpha: 1, duration: GATE.FADE_DURATION }, GATE.ICONS_IN);

  if (!reduced) {
    gsap.set(catPaths, { drawSVG: "0%" });
    tl.to(catPaths, { drawSVG: "100%", duration: GATE.CAT_DRAW, ease: "power2.inOut" }, GATE.CAT_IN);
  }
  return tl;
}
