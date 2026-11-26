import { describe, expect, it } from "vitest";
import { collageHeight, collageSizes, printAspect } from "./collageGeometry";
import { PROJECTS, type CollageItem } from "../../content/projects";
import { COMPACT_CLAUSES } from "../../config/media";

const piece = (over: Partial<CollageItem> & { mw?: number; mh?: number } = {}): CollageItem => ({
  media: { kind: "placeholder", label: "x", w: over.mw ?? 400, h: over.mh ?? 200 },
  w: 50,
  x: 0,
  y: 0,
  rotate: 0,
  tape: { x: 50, rotate: 0 },
  ...over,
});

describe("printAspect", () => {
  it("is the media's own aspect, unless the piece crops it", () => {
    expect(printAspect(piece())).toBe(2);
    expect(printAspect(piece({ aspect: 1.5 }))).toBe(1.5);
  });
});

describe("collageHeight", () => {
  it("reaches the foot of the lowest print, plus room for its tilt", () => {
    const h = collageHeight([piece({ y: 10 }), piece({ y: 40, w: 40 })]);
    // 40 + 40 / 2 = 60 is the lowest foot.
    expect(h).toBeGreaterThan(60);
    expect(h).toBeLessThan(70);
  });
});

describe("collageSizes", () => {
  it("gives a compact size per clause, then the full one", () => {
    const parts = collageSizes(piece()).split(", ");
    expect(parts).toHaveLength(COMPACT_CLAUSES.length + 1);
    expect(parts.at(-1)).toMatch(/^\d+(\.\d)?vw$/);
  });

  it("grows with the print's width and with a cropped photo's zoom", () => {
    const vw = (s: string) => parseFloat(s.split(", ").at(-1)!);
    expect(vw(collageSizes(piece({ w: 60 })))).toBeGreaterThan(vw(collageSizes(piece({ w: 30 }))));
    expect(vw(collageSizes(piece({ aspect: 1 })))).toBeGreaterThan(vw(collageSizes(piece())));
  });
});

describe("content/projects.ts collages", () => {
  it("keeps every print on its collage", () => {
    for (const p of PROJECTS) {
      for (const it of p.collage.items) {
        expect(it.w, p.slug).toBeGreaterThan(0);
        expect(it.x, p.slug).toBeGreaterThanOrEqual(0);
        expect(it.x + it.w, p.slug).toBeLessThanOrEqual(100);
        expect(it.y, p.slug).toBeGreaterThanOrEqual(0);
      }
    }
  });
});
