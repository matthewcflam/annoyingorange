// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { charClass, charStart, cubicBezierAt, snap, titleFrames, VARIATIONS } from "./scrambleTitle";
import { TRANSITION as T } from "../config/timings";

describe("helpers", () => {
  it("snaps to the nearest step", () => {
    expect(snap(0.37, 0.05)).toBeCloseTo(0.35);
    expect(snap(0.38, 0.05)).toBeCloseTo(0.4);
  });

  it("evaluates a CSS cubic-bezier", () => {
    expect(cubicBezierAt(0, 0.42, 0, 0.58, 1)).toBeCloseTo(0);
    expect(cubicBezierAt(1, 0.42, 0, 0.58, 1)).toBeCloseTo(1);
    expect(cubicBezierAt(0.5, 0.42, 0, 0.58, 1)).toBeCloseTo(0.5); // symmetric ease-in-out
    expect(cubicBezierAt(0.3, 0.42, 0, 1, 1)).toBeLessThan(0.3); // ease-in
  });
});

describe("titleFrames", () => {
  it("is none for an empty title and grows with its length", () => {
    expect(titleFrames(0)).toBe(0);
    expect(titleFrames(1)).toBe(Math.round(T.TITLE_FPS * T.TITLE_SECONDS * (1 + T.TITLE_STRETCH_PER_CHAR)));
    expect(titleFrames(40)).toBeGreaterThan(titleFrames(10));
  });
});

describe("charStart", () => {
  it("starts the first character at 0 and staggers the rest, snapped", () => {
    const n = 20;
    const starts = Array.from({ length: n }, (_, i) => charStart(i, n));
    expect(starts[0]).toBe(0);
    for (const cp of starts) expect(cp / T.TITLE_START_SNAP).toBeCloseTo(Math.round(cp / T.TITLE_START_SNAP));
    expect(new Set(starts).size).toBeGreaterThan(1);
  });

  it("handles a single character", () => {
    expect(Number.isFinite(charStart(0, 1))).toBe(true);
  });
});

describe("charClass", () => {
  const frames = titleFrames(20);

  it("is hidden before typing, plain once typed, hidden again after typing out", () => {
    expect(charClass(0, frames, 0.5, VARIATIONS)).toBe("char charInit");
    expect(charClass(frames, frames, 0, VARIATIONS)).toBe("char");
    expect(charClass(frames * 2, frames, 0, VARIATIONS)).toBe("char charInit");
  });

  it("shows a box variant while in motion", () => {
    const seen = new Set<string>();
    for (let f = 0; f <= frames * 2; f++) seen.add(charClass(f, frames, 0.2, VARIATIONS));
    const moving = [...seen].filter((c) => c !== "char" && c !== "char charInit");
    expect(moving.length).toBeGreaterThan(0);
    for (const c of moving) expect(VARIATIONS).toContain(c.replace("char ", ""));
  });

  it("types a later-starting character later", () => {
    const firstTyped = (cp: number) => {
      for (let f = 0; f <= frames; f++) if (charClass(f, frames, cp, VARIATIONS) === "char") return f;
      return Infinity;
    };
    expect(firstTyped(0.6)).toBeGreaterThan(firstTyped(0));
  });
});
