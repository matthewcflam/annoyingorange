/**
 * Home's skyline (home-skyline.svg: the mountain's ridge lines, then the
 * city). It shows finished on every visit; a click draws it again (user
 * request, like the cat's Redraw): it wipes, then the lines start at the peak
 * and run downhill, and the city follows top to bottom, each vector drawn
 * along its own length, never swiped.
 *
 * Measuring ~500 paths (their lengths and ends) is thousands of synchronous
 * geometry calls, so it happens in idle time right after the SVG is attached,
 * not on the click's frame. The result is by path index, so it's computed
 * once per load.
 */
import { gsap } from "../lib/gsap";
import { SKYLINE } from "../config/timings";
import { prefersReducedMotion } from "../lib/motion";

/** One path's draw: which end it starts from, when, and for how long. */
interface Step {
  fromStart: boolean;
  at: number;
  duration: number;
}
/** Mountain paths first, then the city, in document order. */
let plan: Step[] | null = null;

const parts = (el: SVGSVGElement) => [
  ...el.querySelectorAll<SVGPathElement>('[data-part="mountain"] path'),
  ...el.querySelectorAll<SVGPathElement>('[data-part="city"] path'),
];

/** Home injected the SVG. replay() draws it again; detach() on unmount. */
export function attachSkyline(el: SVGSVGElement): { replay: () => void; detach: () => void } {
  let tl: gsap.core.Timeline | null = null;
  const idle = plan ? 0 : whenIdle(() => (plan ??= makePlan(el)));
  const paths = parts(el);

  const replay = () => {
    if (prefersReducedMotion()) return;
    tl?.kill();
    const steps = (plan ??= makePlan(el));
    // Wipe it all at once, then draw from the peak down.
    paths.forEach((p, i) => gsap.set(p, { drawSVG: steps[i]?.fromStart === false ? "100% 100%" : "0% 0%" }));
    const t = gsap.timeline({
      onComplete: () => {
        // Plain strokes when idle: no dash styles left behind.
        gsap.set(paths, { clearProps: "strokeDasharray,strokeDashoffset" });
        tl = null;
      },
    });
    tl = t;
    paths.forEach((p, i) => {
      const s = steps[i];
      if (!s) return;
      t.to(p, { drawSVG: "0% 100%", duration: s.duration, ease: SKYLINE.SEG_EASE }, s.at);
    });
  };

  const detach = () => {
    cancelIdle(idle);
    tl?.kill();
    tl = null;
    gsap.set(paths, { clearProps: "strokeDasharray,strokeDashoffset" });
  };

  return { replay, detach };
}

// Safari before 18 has no requestIdleCallback.
const hasIdle = typeof requestIdleCallback === "function";
const whenIdle = (fn: () => void): number => (hasIdle ? requestIdleCallback(fn, { timeout: 500 }) : setTimeout(fn, 50));
const cancelIdle = (id: number) => {
  if (!id) return;
  if (hasIdle) cancelIdleCallback(id);
  else clearTimeout(id);
};

type Pt = { x: number; y: number };

/** A path's two ends, its length and its top. */
function measure(p: SVGPathElement) {
  const len = p.getTotalLength();
  const a = p.getPointAtLength(0);
  const b = p.getPointAtLength(len);
  let top = Math.min(a.y, b.y);
  let topPt: Pt = a.y <= b.y ? a : b;
  for (let i = 1; i < 8; i++) {
    const q = p.getPointAtLength((len * i) / 8);
    if (q.y < top) {
      top = q.y;
      topPt = q;
    }
  }
  return { len, a, b, top, topPt };
}

const durationFor = (len: number) => gsap.utils.clamp(SKYLINE.SEG_MIN, SKYLINE.SEG_MAX, len * SKYLINE.SEG_S_PER_PX);

function makePlan(el: SVGSVGElement): Step[] {
  const m = Array.from(el.querySelectorAll<SVGPathElement>('[data-part="mountain"] path'), measure);
  const c = Array.from(el.querySelectorAll<SVGPathElement>('[data-part="city"] path'), measure);

  // The peak: the highest point along the ridge lines.
  const peak = m.reduce((best, s) => (s.topPt.y < best.y ? s.topPt : best), m[0]?.topPt ?? { x: 0, y: 0 });
  const dist = (q: Pt) => Math.hypot(q.x - peak.x, q.y - peak.y);

  // Ridges run downhill: each from the end nearer the peak, later the farther
  // that end is from it.
  const ridges = m.map(({ len, a, b }) => {
    const fromStart = dist(a) <= dist(b);
    return { fromStart, at: dist(fromStart ? a : b) * SKYLINE.MOUNTAIN_S_PER_PX, duration: durationFor(len) };
  });

  // The city follows down from the ridge: top to bottom (each path from its
  // higher end), the towers under the peak a little before the ones out to
  // the sides. Flat strokes (the ground and treeline) run outward from the
  // peak instead, at the sweep's own pace, so a long one keeps up with the
  // rest instead of trailing in after it as a separate group.
  const cityTop = Math.min(...c.map((s) => s.top));
  const city = c.map(({ len, a, b, top }) => {
    const dx = Math.abs(b.x - a.x);
    const flat = dx > 2 * Math.abs(b.y - a.y) && dx > 15;
    const fromStart = flat ? Math.abs(a.x - peak.x) <= Math.abs(b.x - peak.x) : a.y <= b.y;
    const at =
      SKYLINE.CITY_START +
      (top - cityTop) * SKYLINE.CITY_S_PER_PX +
      Math.abs((fromStart ? a : b).x - peak.x) * SKYLINE.CITY_S_PER_PX_X;
    const duration = flat ? gsap.utils.clamp(SKYLINE.SEG_MIN, SKYLINE.SEG_MAX, dx * SKYLINE.CITY_S_PER_PX_X) : durationFor(len);
    return { fromStart, at, duration };
  });

  return [...ridges, ...city];
}
