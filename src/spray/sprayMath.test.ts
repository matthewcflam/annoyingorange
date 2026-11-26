import { describe, expect, it } from "vitest";
import { pointAt, seeded } from "./sprayMath";
import { sampleGuide } from "./paceModel";

describe("seeded", () => {
  it("repeats the same sequence for the same seed (replays need it)", () => {
    const xs = Array.from({ length: 100 }, seeded(42));
    expect(Array.from({ length: 100 }, seeded(42))).toEqual(xs);
    expect(Array.from({ length: 100 }, seeded(43))).not.toEqual(xs);
  });

  it("stays in [0, 1) and spreads evenly", () => {
    const rng = seeded(7);
    let sum = 0;
    for (let i = 0; i < 10000; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
      sum += v;
    }
    expect(sum / 10000).toBeCloseTo(0.5, 1);
  });
});

describe("pointAt", () => {
  const g = sampleGuide("M0 0L100 0");

  it("walks the path by arc length", () => {
    expect(pointAt(g, 0)[0]).toBeCloseTo(0);
    expect(pointAt(g, 25)[0]).toBeCloseTo(25);
    expect(pointAt(g, 100)[0]).toBeCloseTo(100);
  });

  it("clamps past either end", () => {
    expect(pointAt(g, -10)).toEqual(pointAt(g, 0));
    expect(pointAt(g, 1e6)).toEqual(pointAt(g, 100));
  });
});
