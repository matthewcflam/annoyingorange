import { describe, expect, it } from "vitest";
import { compactSizes, frameSizes, GRID, gridSpan, PROJECT_FRAME_W } from "./frame";
import { COMPACT_CLAUSES } from "../config/media";

describe("gridSpan", () => {
  it("spans the frame inside its margins at all 9 columns", () => {
    expect(gridSpan(GRID.COLS)).toBeCloseTo(PROJECT_FRAME_W - 2 * GRID.MARGIN);
  });

  it("adds a gutter between each pair of columns", () => {
    expect(gridSpan(2)).toBeCloseTo(2 * gridSpan(1) + GRID.GUTTER);
    expect(gridSpan(3, 1000)).toBeCloseTo(3 * gridSpan(1, 1000) + 2 * GRID.GUTTER);
  });
});

describe("compactSizes", () => {
  it("lists each compact clause, then the full size", () => {
    expect(compactSizes("100vw", "500px").split(", ")).toEqual([...COMPACT_CLAUSES.map((q) => `${q} 100vw`), "500px"]);
  });
});

describe("frameSizes", () => {
  it("is the box's share of the frame's width, or of its height on wide windows", () => {
    expect(frameSizes(1767)).toBe("(min-aspect-ratio: 1767/1024) 172.56vh, 100.00vw");
  });
});
