import { describe, expect, it } from "vitest";
import { countUrl, shouldTrack } from "./track";

describe("shouldTrack", () => {
  it("sends only with a code, on the production hosts", () => {
    expect(shouldTrack("", "www.matthewlam.ca")).toBe(false);
    expect(shouldTrack("me", "localhost")).toBe(false);
    expect(shouldTrack("me", "orange-eight-xi.vercel.app")).toBe(false);
    expect(shouldTrack("me", "www.matthewlam.ca")).toBe(true);
    expect(shouldTrack("me", "matthewlam.ca")).toBe(true);
  });
});

describe("countUrl", () => {
  it("builds an encoded event URL", () => {
    const url = new URL(countUrl("me", "click/remind/devpost", "Projects", "abc"));
    expect(url.origin).toBe("https://me.goatcounter.com");
    expect(url.pathname).toBe("/count");
    expect(url.searchParams.get("p")).toBe("click/remind/devpost");
    expect(url.searchParams.get("t")).toBe("Projects");
    expect(url.searchParams.get("e")).toBe("true");
    expect(url.searchParams.get("rnd")).toBe("abc");
  });
});
