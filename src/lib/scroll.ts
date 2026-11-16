/**
 * Smooth wheel scrolling (Lenis, added at the user's request). Module-level
 * singleton on the window scroller, driven by the GSAP ticker so scroll
 * frames and tweens land in the same frame. Touch stays native (iOS
 * momentum). Reduced motion: no Lenis at all.
 */
import Lenis from "lenis";
import { gsap } from "./gsap";
import { prefersReducedMotion } from "./motion";
import { SCROLL } from "../config/timings";

let lenis: Lenis | null = null;
/** Starts Lenis's frames (it only ticks while it glides; see initScroll). */
let wake = () => {};

export function initScroll(): void {
  if (lenis || prefersReducedMotion()) return;
  lenis = new Lenis({
    autoRaf: false,
    lerp: SCROLL.LERP,
    wheelMultiplier: SCROLL.WHEEL_MULTIPLIER,
    syncTouch: false,
  });
  const l = lenis;
  // Lenis only needs frames while it glides, which a wheel starts (touch,
  // keys and the scrollbar are native). Ticking it only then lets the GSAP
  // ticker sleep when nothing moves, instead of running 60 times a second.
  let ticking = false;
  let still = 0;
  const tick = (time: number) => {
    l.raf(time * 1000);
    if (l.isScrolling === "smooth") still = 0;
    else if (++still > 2) {
      gsap.ticker.remove(tick);
      ticking = false;
    }
  };
  wake = () => {
    still = 0;
    if (ticking) return;
    ticking = true;
    l.time = 0; // the first frame's delta is 0, not the time asleep (which would snap the glide)
    gsap.ticker.add(tick);
  };
  window.addEventListener("wheel", wake, { passive: true });
  if (import.meta.env.DEV) (window as unknown as { __lenis: Lenis }).__lenis = l;
}

/** Jump to the top with no glide (a plain window.scrollTo mid-glide would be
 *  pulled back toward Lenis's old target). */
export function resetScroll(): void {
  if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
  else window.scrollTo(0, 0);
}

/**
 * Glide to `y` (clamped to the page) over `duration` seconds. Immediate with
 * no Lenis (reduced motion) or when `immediate`. `onComplete` runs once the
 * page is there; a wheel mid-glide takes over and it never runs.
 */
export function scrollToY(
  y: number,
  { duration, ease, immediate = false, onComplete }: { duration: number; ease: string; immediate?: boolean; onComplete?: () => void },
): void {
  if (!lenis) {
    window.scrollTo(0, y);
    onComplete?.();
    return;
  }
  lenis.resize(); // a page that just mounted may be taller than Lenis knows
  if (!immediate) wake();
  const easing = gsap.parseEase(ease);
  lenis.scrollTo(Math.max(0, Math.min(y, lenis.limit)), {
    immediate,
    force: true,
    duration,
    easing,
    onComplete: () => onComplete?.(),
  });
}

/** Stops any glide and swallows wheel input until unlockScroll(). */
export const lockScroll = () => lenis?.stop();
export const unlockScroll = () => lenis?.start();

/** Scroll position and how far the page can scroll (0 = it doesn't). */
export type ScrollState = { scroll: number; limit: number };

/** Calls back on every scroll frame. Lenis keeps `limit` cached (its own
 *  ResizeObserver), so this reads no layout; without Lenis (reduced motion)
 *  it falls back to a passive native listener. Returns an unsubscribe. */
export function onScroll(cb: (s: ScrollState) => void): () => void {
  if (lenis) return lenis.on("scroll", (l) => cb({ scroll: l.scroll, limit: l.limit }));
  const root = document.documentElement;
  const onNative = () => cb({ scroll: window.scrollY, limit: root.scrollHeight - window.innerHeight });
  window.addEventListener("scroll", onNative, { passive: true });
  return () => window.removeEventListener("scroll", onNative);
}
