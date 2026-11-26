import { describe, expect, it, vi } from "vitest";
import { introPart } from "./introPart";

describe("introPart", () => {
  it("starts pending and tells listeners once on start", () => {
    const part = introPart();
    const fn = vi.fn();
    part.onStart(fn);
    expect(part.state).toBe("pending");
    part.start();
    part.start();
    expect(part.state).toBe("started");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("stops telling a listener after it unsubscribes", () => {
    const part = introPart();
    const fn = vi.fn();
    part.onStart(fn)();
    part.start();
    expect(fn).not.toHaveBeenCalled();
  });

  it("never starts once finished (deep link, played, or left mid-play)", () => {
    const part = introPart();
    const fn = vi.fn();
    part.onStart(fn);
    part.finish();
    part.start();
    expect(part.state).toBe("done");
    expect(fn).not.toHaveBeenCalled();
  });
});
