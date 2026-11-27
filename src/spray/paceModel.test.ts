import { describe, expect, it } from "vitest";
import whoSvg from "../../assets-src/svg/who-spray.svg?raw";
import { alongAt, maxSpeed, parsePath, sampleGuide, segmentTimes, speedShape, timeMap } from "./paceModel";
import { SPRAY_PACE } from "../config/sprayPace";

/** who-spray.svg's guide paths, in draw order. */
const GUIDES = [...whoSvg.matchAll(/<path\b[^>]*\sd="([^"]+)"/g)].map((m) => m[1]!);

describe("parsePath", () => {
  it("reads lines and cubics", () => {
    expect(parsePath("M0 0L10 0C10 5 5 10 0 10")).toEqual([
      [[0, 0], [10, 0]],
      [[10, 0], [10, 5], [5, 10], [0, 10]],
    ]);
  });

  it("rejects commands the guides never use", () => {
    expect(() => parsePath("M0 0Q5 5 10 0")).toThrow();
  });
});

describe("sampleGuide", () => {
  it("samples evenly at 1px or less and marks each anchor", () => {
    const g = sampleGuide("M0 0L30 0L30 40");
    expect(g.length).toBeCloseTo(70);
    expect(g.step).toBeLessThanOrEqual(1);
    expect(g.anchors.map((a) => Math.round(a))).toEqual([0, 30, 70]);
    expect(g.pts.length).toBe((g.segments + 1) * 2);
  });
});

describe("speedShape", () => {
  it("slows on curves (two-thirds power law) and at the stroke's ends", () => {
    // A straight run, a tight quarter turn, another straight.
    const g = sampleGuide("M0 0L200 0C205 0 210 5 210 10L210 210");
    const v = speedShape(g);
    const at = (px: number) => v[Math.min(v.length - 1, Math.round(px / g.step))]!;
    expect(at(100)).toBeGreaterThan(at(205) * 2);
    expect(at(0)).toBeLessThan(at(100));
    expect(at(g.length)).toBeLessThan(at(310));
  });

  it("rushes the finish when asked", () => {
    const g = sampleGuide("M0 0L300 0");
    const plain = speedShape(g);
    const finish = speedShape(g, { finish: true });
    const i = Math.round(250 / g.step);
    expect(finish[i]!).toBeGreaterThan(plain[i]!);
    expect(finish[10]!).toBeCloseTo(plain[10]!);
  });
});

describe("timeMap", () => {
  const g = sampleGuide("M0 0L50 0C80 0 80 40 50 40L0 40");
  const segMs = [300, 500, 200];
  const t = timeMap(g, speedShape(g), segMs);

  it("lands every anchor on its exact time", () => {
    let total = 0;
    for (let seg = 0; seg < segMs.length; seg++) {
      total += segMs[seg]! / 1000;
      expect(alongAt(g, t, total)).toBeCloseTo(g.anchors[seg + 1]!, 0);
    }
    expect(t[t.length - 1]!).toBeCloseTo(1, 3);
  });

  it("only moves forward", () => {
    for (let i = 1; i < t.length; i++) expect(t[i]!).toBeGreaterThanOrEqual(t[i - 1]!);
    expect(alongAt(g, t, -1)).toBe(0);
    expect(alongAt(g, t, 99)).toBe(g.length);
    expect(maxSpeed(g, t)).toBeGreaterThan(0);
  });

  it("times every anchor segment", () => {
    const times = segmentTimes(g, speedShape(g));
    expect(times).toHaveLength(segMs.length);
    for (const s of times) expect(s).toBeGreaterThan(0);
  });
});

describe("config/sprayPace.ts", () => {
  it("has one stroke per guide path in who-spray.svg", () => {
    expect(GUIDES.length).toBeGreaterThan(0);
    expect(SPRAY_PACE.strokes).toHaveLength(GUIDES.length);
  });

  it("has one time per pair of anchor points in each path", () => {
    GUIDES.forEach((d, i) => {
      const stroke = SPRAY_PACE.strokes[i]!;
      expect(stroke.segmentsMs, stroke.letter).toHaveLength(sampleGuide(d).anchors.length - 1);
      for (const ms of stroke.segmentsMs) expect(ms).toBeGreaterThan(0);
    });
  });
});
