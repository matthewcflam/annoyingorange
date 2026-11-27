/**
 * Home lightbox's blue "next stop" strip (user request; home.css .home__strip).
 * The blue pours down from the top edge (user request), with the Map card's
 * water feel (MAP_BOX's bow and the NEXT_STOP eases): the falling front bows
 * downward by FRONT_BOW of the distance it has left, flat on arrival. Each line
 * fades in as the front passes it. It holds, then leaves from the bottom with
 * the same flow (duration, ease, bow): the top edge falls away, starting flat
 * and bowing as it goes, each line fading as it passes. It
 * rests on the white face and runs again, forever (NEXT_STOP in timings.ts).
 * Reduced motion: the strip is simply full.
 */
import { gsap } from "../../lib/gsap";
import { MAP_BOX, NEXT_STOP as N } from "../../config/timings";
import { prefersReducedMotion } from "../../lib/motion";

/** The blue between `top` and `bottom` (CSS px down from the strip's top),
 *  full width; the path's origin is the strip's top-right corner, x runs
 *  left. `bowTop` / `bowBottom` bow those edges downward (quadratic control
 *  offset). */
function bandPath(w: number, top: number, bottom: number, bowTop: number, bowBottom: number): string {
  if (bottom - top <= 0.01) return "";
  const f = (n: number) => n.toFixed(2);
  return (
    `M0 ${f(top)}Q${f(-w / 2)} ${f(top + bowTop)} ${f(-w)} ${f(top)}` +
    `V${f(bottom)}Q${f(-w / 2)} ${f(bottom + bowBottom)} 0 ${f(bottom)}Z`
  );
}

/** The first progress (0 → 1) at which `ease(p) * h` passes `y`. */
const reach = (ease: (p: number) => number, h: number, y: number) => {
  for (let i = 0; i <= 60; i++) if (ease(i / 60) * h >= y) return i / 60;
  return 1;
};

export function attachNextStop(card: HTMLElement, strip: HTMLElement, path: SVGPathElement, lines: HTMLElement[]): () => void {
  let tl: gsap.core.Timeline | null = null;
  let visible = true;
  let started = false;
  // The strip's CSS size, fractional (offsetHeight rounds, which can leave a
  // sliver of face under the full blue). Kept current by the ResizeObserver.
  let w = strip.offsetWidth;
  let h = strip.offsetHeight;

  const build = (progress = 0) => {
    tl?.kill();
    if (!w || !h) return;
    if (prefersReducedMotion()) {
      path.setAttribute("d", bandPath(w, 0, h, 0, 0));
      gsap.set(lines, { opacity: 1 });
      return;
    }
    const fillEase = gsap.parseEase(N.FILL_EASE);
    const drainEase = gsap.parseEase(N.DRAIN_EASE);
    const bow = MAP_BOX.FRONT_BOW;
    const drive = { fill: 0, drain: 0 };
    const draw = () => {
      if (drive.drain > 0) {
        // The leaving top edge bows like the entry's front, but it starts
        // flat (it was the full strip's straight top): its bow is scaled in
        // by 1 - (1 - p)², so the first frame doesn't jump and the edge never
        // bows the wrong way.
        const p = drive.drain;
        const top = drainEase(p) * h;
        path.setAttribute("d", bandPath(w, top, h, bow * (h - top) * (1 - (1 - p) ** 2), 0));
      } else {
        const bottom = fillEase(drive.fill) * h;
        path.setAttribute("d", bandPath(w, 0, bottom, 0, bow * (h - bottom)));
      }
    };

    const box = strip.getBoundingClientRect();
    const spans = lines.map((el) => {
      const r = el.getBoundingClientRect();
      return { el, top: r.top - box.top, mid: r.top + r.height / 2 - box.top };
    });

    const t = gsap.timeline({ repeat: -1, paused: true });
    t.set(lines, { opacity: 0 }, 0);
    t.set(drive, { fill: 0, drain: 0, onComplete: draw }, 0);
    t.to(drive, { fill: 1, duration: N.FILL, ease: "none", onUpdate: draw }, 0);
    // Each line as the falling front passes its middle.
    let prev = -Infinity;
    for (const s of spans) {
      const at = Math.max(reach(fillEase, h, s.mid) * N.FILL, prev + N.LINE_STAGGER);
      prev = at;
      t.to(s.el, { opacity: 1, duration: N.LINE_FADE, ease: N.LINE_FADE_EASE }, at);
    }
    const out = Math.max(N.FILL, prev + N.LINE_FADE) + N.HOLD;
    t.to(drive, { drain: 1, duration: N.DRAIN, ease: "none", onUpdate: draw }, out);
    // Each line is gone by the time the falling top edge reaches it (the
    // knockout letters would otherwise linger, white on the white face).
    for (const s of spans) {
      t.to(s.el, { opacity: 0, duration: N.TEXT_OUT, ease: "power2.in" }, Math.max(out - N.TEXT_OUT, out + reach(drainEase, h, s.top) * N.DRAIN - N.TEXT_OUT));
    }
    // White, before it runs again.
    t.to({}, { duration: N.REST }, out + N.DRAIN);
    t.progress(progress);
    tl = t;
    if (started && visible) t.play();
  };

  // Empty until the first fill.
  path.setAttribute("d", "");
  gsap.set(lines, { opacity: prefersReducedMotion() ? 1 : 0 });
  build();
  const startCall = gsap.delayedCall(N.START, () => {
    started = true;
    if (visible) tl?.play();
  });

  // Pause while the card is off screen (compact scrolls).
  const io = new IntersectionObserver(([e]) => {
    visible = e?.isIntersecting ?? true;
    if (!started || !tl) return;
    if (visible) tl.play();
    else tl.pause();
  });
  io.observe(card);

  // Sizes are CSS: rebuild at the new size, where the loop had got to. The
  // strip's own size, not the window's: a style change alone (the frame width,
  // the film's bleed under it, a CSS hot reload) left the blue short of the
  // strip's foot.
  const ro = new ResizeObserver(([e]) => {
    if (!e) return;
    const { width, height } = e.contentRect;
    if (Math.abs(width - w) < 0.01 && Math.abs(height - h) < 0.01) return;
    w = width;
    h = height;
    build(tl?.progress() ?? 0);
  });
  ro.observe(strip);

  if (import.meta.env.DEV) Object.assign(window, { __nextStop: { get tl() { return tl; } } });

  return () => {
    startCall.kill();
    io.disconnect();
    ro.disconnect();
    tl?.kill();
  };
}
