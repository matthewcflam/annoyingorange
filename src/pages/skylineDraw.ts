/**
 * Home's skyline (home-skyline.svg: the mountain's ridge lines, then the
 * city) draws itself during the intro (user request): the lines start at the
 * peak and run downhill, and the city follows top to bottom, each vector
 * drawn along its own length, never swiped.
 *
 * An intro part (lib/introPart.ts): the intro calls startSkyline() at
 * GATE.SKYLINE_IN; Home attaches the SVG once it's injected. The draw runs
 * when both have happened (a slow fetch draws late, not never). Every later
 * visit, a deep link, and reduced motion show it finished.
 *
 * Measuring ~500 paths (their lengths and ends) is thousands of synchronous
 * geometry calls, so it happens in idle time right after the SVG is attached,
 * well before the intro reaches the skyline, not on the intro's busy frame.
 * The result is by path index, so it's computed once per load.
 */
import { gsap } from "../lib/gsap";
import { GATE } from "../config/timings";
import { prefersReducedMotion } from "../lib/motion";
import { introPart } from "../lib/introPart";

const part = introPart();
let svg: SVGSVGElement | null = null;
let tl: gsap.core.Timeline | null = null;

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

/** Deep link: the intro never plays on home, so show it finished. */
export function skipSkyline(): void {
  part.finish();
}

/** The intro, at GATE.SKYLINE_IN. */
export function startSkyline(): void {
  if (part.state !== "pending") return;
  part.start();
  if (svg) draw(svg);
}

/** Home injected the SVG. Returns the detach for unmount. */
export function attachSkyline(el: SVGSVGElement): () => void {
  svg = el;
  let idle = 0;
  if (part.state === "pending" && !prefersReducedMotion()) {
    // Hidden until the intro reaches it (before the first paint), and
    // measured while the browser is idle.
    gsap.set(el.querySelectorAll("path"), { drawSVG: "0%" });
    if (!plan) idle = whenIdle(() => (plan ??= makePlan(el)));
  } else if (part.state === "started") {
    draw(el);
  }
  return () => {
    cancelIdle(idle);
    // Leaving mid-draw: the next visit shows it finished.
    if (tl) {
      tl.kill();
      tl = null;
    }
    if (part.state !== "pending") part.finish();
    if (svg === el) svg = null;
  };
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

const durationFor = (len: number) => gsap.utils.clamp(GATE.SKYLINE_SEG_MIN, GATE.SKYLINE_SEG_MAX, len * GATE.SKYLINE_SEG_S_PER_PX);

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
    return { fromStart, at: dist(fromStart ? a : b) * GATE.SKYLINE_MOUNTAIN_S_PER_PX, duration: durationFor(len) };
  });

  // The city follows down from the ridge: top to bottom (each path from its
  // higher end), the towers under the peak a little before the ones out to
  // the sides. Flat strokes (the ground and treeline) run outward from the
  // peak instead, at the sweep's own pace, so a long one (the right-hand
  // treeline is three long strokes; the left is many short ones) keeps up
  // with the rest instead of trailing in after it as a separate group.
  const cityTop = Math.min(...c.map((s) => s.top));
  const city = c.map(({ len, a, b, top }) => {
    const dx = Math.abs(b.x - a.x);
    const flat = dx > 2 * Math.abs(b.y - a.y) && dx > 15;
    const fromStart = flat ? Math.abs(a.x - peak.x) <= Math.abs(b.x - peak.x) : a.y <= b.y;
    const at =
      GATE.SKYLINE_CITY_START +
      (top - cityTop) * GATE.SKYLINE_CITY_S_PER_PX +
      Math.abs((fromStart ? a : b).x - peak.x) * GATE.SKYLINE_CITY_S_PER_PX_X;
    const duration = flat
      ? gsap.utils.clamp(GATE.SKYLINE_SEG_MIN, GATE.SKYLINE_SEG_MAX, dx * GATE.SKYLINE_CITY_S_PER_PX_X)
      : durationFor(len);
    return { fromStart, at, duration };
  });

  return [...ridges, ...city];
}

function draw(el: SVGSVGElement) {
  part.finish();
  if (prefersReducedMotion()) return;
  const paths = parts(el);
  // Normally measured already; a very early start measures now.
  const steps = (plan ??= makePlan(el));

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
    t.fromTo(
      p,
      { drawSVG: s.fromStart ? "0% 0%" : "100% 100%" },
      { drawSVG: "0% 100%", duration: s.duration, ease: GATE.SKYLINE_SEG_EASE },
      s.at,
    );
  });
}
