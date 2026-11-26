/**
 * The intro on load (spec §6.5, minus the gate: user change). One timeline,
 * positions in seconds from load, all from INTRO in timings.ts. Built once
 * fonts are ready: by then the page is mounted.
 *
 * On home (Figma "Home Page Final"): the paper (tech papers, photos, tape,
 * the skyline's sheet) is simply there, sharp, from the first frame
 * (pages/paper/); the name fades up, the centre card rushes
 * open, the cat draws itself and the glyphs fade up. The skyline and "who?"
 * are there finished from the first frame (user request: only the cat
 * animates on load; a click replays either, see Home.tsx). Every later visit shows all of it finished.
 */
import { gsap } from "../../lib/gsap";
import { INTRO } from "../../config/timings";
import { openHomeCard } from "./homeCard";
import { markPageShown } from "../../lib/pageReveal";

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
  tl.call(markPageShown, undefined, INTRO.PAGE_SHOWN);

  if (!home) {
    // TODO(open-question #1): placeholder deep-link reveal.
    openHomeCard();
    const page = q(".layer--page");
    gsap.set(page, { autoAlpha: 0 });
    tl.to(page, { autoAlpha: 1, duration: INTRO.DEEP_LINK_FADE }, INTRO.PAGE_SHOWN);
    return tl;
  }

  const name = q(".home__name");
  const catPaths = q(".home__cat path");
  const icons = q(".home__social");

  gsap.set([name, icons], { autoAlpha: 0 });

  tl.to(name, { autoAlpha: 1, duration: INTRO.NAME_IN_DURATION, ease: INTRO.NAME_IN_EASE }, INTRO.NAME_IN)
    .call(openHomeCard, undefined, INTRO.CARD_OPEN)
    .to(icons, { autoAlpha: 1, duration: INTRO.FADE_DURATION, ease: INTRO.FADE_EASE }, INTRO.ICONS_IN);

  if (!reduced) {
    gsap.set(catPaths, { drawSVG: "0%" });
    tl.to(catPaths, { drawSVG: "100%", duration: INTRO.CAT_DRAW, ease: INTRO.CAT_DRAW_EASE }, INTRO.CAT_IN);
  }
  return tl;
}
