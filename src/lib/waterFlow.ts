/**
 * The Map box's water flow (components/MapBox.tsx), shared with the project
 * poster (pages/projects/ProjectList.tsx): one set of flow numbers, MAP_BOX.
 */
import { MAP_BOX as M } from "../config/timings";
import { projectScale } from "./tokens";
import { gsap } from "./gsap";
import { clamp01 } from "./math";

/** The blue shape, drawn from its top-right corner (the origin; x runs left,
 *  so it is negative). `bl` / `bb` bow the left and bottom edges outward,
 *  `r` rounds the corners (the pinned top-right one stays square). */
export interface Shape {
  w: number;
  h: number;
  bl: number;
  bb: number;
  r: number;
}

export function shapePath({ w, h, bl, bb, r }: Shape): string {
  const s = r * 0.6; // the two corners next to the pinned one round less
  return (
    `M0 0H${-w + s}Q${-w} 0 ${-w} ${s}` +
    `Q${-w - bl} ${h / 2} ${-w} ${h - r}Q${-w} ${h} ${-w + r} ${h}` +
    `Q${-w / 2} ${h + bb} ${-s} ${h}Q0 ${h} 0 ${h - s}Z`
  );
}


/**
 * A rush of water from the shape `s` to the box `to`, as a function of one
 * progress `p` (0 → 1) that mutates `s`. Width runs on `ease(p)`, height on the
 * same ease a beat later (MAP_BOX.H_LAG). Every moving edge bows toward where
 * it is going by FRONT_BOW of the distance it has left, and the leading
 * corners round by at most that distance, so the shape never passes the new
 * box and lands on it square, with nothing to settle. Closing follows the same
 * rule (the distances are negative: the edges bow inward, draining). A bow or
 * radius left by an interrupted flow fades out over the first part.
 * `reach(axis, size)` is the progress at which that axis first reaches `size`.
 * `maxR` caps the leading corners' radius (CSS px; defaults to the page's).
 */
export function flowShape(
  s: Shape,
  to: { w: number; h: number },
  ease: (p: number) => number,
  maxR = M.FRONT_RADIUS_PX * projectScale(),
) {
  const from = { ...s };
  const lagged = (p: number) => ease(clamp01((p - M.H_LAG) / (1 - M.H_LAG)));
  const at = (axis: "w" | "h", p: number) => from[axis] + (to[axis] - from[axis]) * (axis === "w" ? ease(p) : lagged(p));
  const corner = (w: number, h: number, dw: number, dh: number) =>
    Math.max(0, Math.min(maxR, Math.max(Math.abs(dw), Math.abs(dh)), w / 2, h / 2));
  const start = {
    bl: M.FRONT_BOW * (to.w - from.w),
    bb: M.FRONT_BOW * (to.h - from.h),
    r: corner(from.w, from.h, to.w - from.w, to.h - from.h),
  };
  const flow = (p: number) => {
    const w = at("w", p);
    const h = at("h", p);
    const dw = to.w - w;
    const dh = to.h - h;
    const left = (1 - p) * (1 - p); // what remains of an interrupted flow's shape
    s.w = w;
    s.h = h;
    s.bl = M.FRONT_BOW * dw + (from.bl - start.bl) * left;
    s.bb = M.FRONT_BOW * dh + (from.bb - start.bb) * left;
    s.r = Math.max(0, Math.min(corner(w, h, dw, dh) + (from.r - start.r) * left, w / 2, h / 2));
  };
  flow.reach = (axis: "w" | "h", size: number) => {
    for (let i = 0; i <= 60; i++) if (at(axis, i / 60) >= size) return i / 60;
    return 1;
  };
  return flow;
}

/** No shape at all (the poster before its first hover). A fresh copy each call. */
export const emptyShape = (): Shape => ({ w: 0, h: 0, bl: 0, bb: 0, r: 0 });

/** Jump `s` to a square box of `size` (reduced motion, first paint, resize). */
export function snapShape(s: Shape, size: { w: number; h: number }): void {
  Object.assign(s, size, { bl: 0, bb: 0, r: 0 });
}

/** Run `flow` (flowShape) from 0 to 1 over `duration` seconds, calling `draw`
 *  every frame. The tween is linear: the flow carries its own ease. */
export function runFlow(flow: (p: number) => void, duration: number, draw: () => void, onComplete?: () => void): gsap.core.Tween {
  const drive = { p: 0 };
  return gsap.to(drive, {
    p: 1,
    duration,
    ease: "none",
    onUpdate: () => {
      flow(drive.p);
      draw();
    },
    onComplete,
  });
}
