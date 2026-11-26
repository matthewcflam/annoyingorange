/**
 * Scroll reveal (Experience, user request): each element fades up once, as it
 * enters the window. Lenis drives the native window scroll, so an
 * IntersectionObserver sees it. Nothing runs until the page is on screen;
 * then the elements already in view cascade in together, and the rest follow
 * as they're scrolled to. Reduced motion: everything just shows.
 */
import { gsap } from "./gsap";
import { pxScale } from "./frame";
import { prefersReducedMotion } from "./motion";
import { observeOnceShown } from "./pageReveal";
import { REVEAL } from "../config/timings";

const inDocumentOrder = (a: Element, b: Element) =>
  a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;

/** Hide `els` now (call from a layout effect, so they never flash) and reveal
 *  them on scroll. Returns a cleanup. */
export function revealOnScroll(els: HTMLElement[]): () => void {
  if (prefersReducedMotion() || els.length === 0) return () => {};
  gsap.set(els, { opacity: 0, y: REVEAL.Y * pxScale() });

  const tweens: gsap.core.Tween[] = [];
  let first = true;
  const stop = observeOnceShown(els, REVEAL.THRESHOLD, (entering) => {
    tweens.push(
      gsap.to(entering.sort(inDocumentOrder), {
        opacity: 1,
        y: 0,
        duration: REVEAL.DURATION,
        ease: REVEAL.EASE,
        stagger: REVEAL.STAGGER,
        delay: first ? REVEAL.DELAY : 0,
        clearProps: "opacity,transform",
      }),
    );
    first = false;
  });

  return () => {
    stop();
    for (const t of tweens) t.kill();
  };
}
