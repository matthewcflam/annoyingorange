import { describe, expect, it } from "vitest";
import { emptyShape, flowShape, shapePath, snapShape, type Shape } from "./waterFlow";
import { MAP_BOX } from "../config/timings";

const easeOut = (p: number) => 1 - (1 - p) ** 3;
const MAX_R = 20;

/** The shape's outermost reach on each axis, bows included (a quadratic's
 *  peak is half its control offset). */
const reach = (s: Shape) => ({ w: s.w + Math.max(0, s.bl) / 2, h: s.h + Math.max(0, s.bb) / 2 });

function run(from: Shape, to: { w: number; h: number }, steps = 200) {
  const s = { ...from };
  const flow = flowShape(s, to, easeOut, MAX_R);
  const frames: Shape[] = [];
  for (let i = 0; i <= steps; i++) {
    flow(i / steps);
    frames.push({ ...s });
  }
  return { frames, flow };
}

describe("flowShape", () => {
  it("never crosses the open box's edges", () => {
    const to = { w: 460, h: 260 };
    const { frames } = run({ w: 98, h: 64, bl: 0, bb: 0, r: 0 }, to);
    for (const f of frames) {
      expect(reach(f).w).toBeLessThanOrEqual(to.w + 1e-6);
      expect(reach(f).h).toBeLessThanOrEqual(to.h + 1e-6);
    }
  });

  it("never drains inside the closed box", () => {
    const to = { w: 98, h: 64 };
    const { frames } = run({ w: 460, h: 260, bl: 0, bb: 0, r: 0 }, to);
    for (const f of frames) {
      expect(f.w).toBeGreaterThanOrEqual(to.w - 1e-6);
      expect(f.h).toBeGreaterThanOrEqual(to.h - 1e-6);
    }
  });

  it("lands square, with nothing to settle", () => {
    const { frames } = run({ w: 98, h: 64, bl: 0, bb: 0, r: 0 }, { w: 460, h: 260 });
    expect(frames.at(-1)).toEqual({ w: 460, h: 260, bl: 0, bb: 0, r: 0 });
  });

  it("caps the corner radius at maxR and half the box", () => {
    const { frames } = run({ w: 10, h: 10, bl: 0, bb: 0, r: 0 }, { w: 460, h: 260 });
    for (const f of frames) {
      expect(f.r).toBeLessThanOrEqual(MAX_R + 1e-6);
      expect(f.r).toBeLessThanOrEqual(Math.min(f.w, f.h) / 2 + 1e-6);
    }
  });

  it("fades out the bow of an interrupted flow", () => {
    const { frames } = run({ w: 300, h: 200, bl: 80, bb: 60, r: 15 }, { w: 98, h: 64 });
    expect(frames.at(-1)).toEqual({ w: 98, h: 64, bl: 0, bb: 0, r: 0 });
  });

  it("starts the height a beat after the width (H_LAG)", () => {
    const { flow } = run({ w: 98, h: 64, bl: 0, bb: 0, r: 0 }, { w: 460, h: 260 });
    expect(flow.reach("w", 99)).toBeLessThan(flow.reach("h", 65));
    expect(flow.reach("h", 65)).toBeGreaterThanOrEqual(MAP_BOX.H_LAG);
    expect(flow.reach("w", 1e6)).toBe(1);
  });
});

describe("shapes", () => {
  it("snaps to a square box", () => {
    const s = { w: 1, h: 2, bl: 3, bb: 4, r: 5 };
    snapShape(s, { w: 10, h: 20 });
    expect(s).toEqual({ w: 10, h: 20, bl: 0, bb: 0, r: 0 });
  });

  it("draws from the top-right corner, leftward", () => {
    expect(shapePath(emptyShape())).toMatch(/^M0 0H/);
    expect(shapePath({ w: 10, h: 20, bl: 0, bb: 0, r: 0 })).toContain("-10");
  });

  it("gives a fresh empty shape each call", () => {
    expect(emptyShape()).not.toBe(emptyShape());
  });
});
