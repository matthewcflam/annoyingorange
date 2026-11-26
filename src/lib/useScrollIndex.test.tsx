// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";
import type { ScrollState } from "./scroll";

const scroll = vi.hoisted(() => ({
  listeners: new Set<(s: ScrollState) => void>(),
  scrollToY: vi.fn(),
}));
vi.mock("./scroll", () => ({
  onScroll: (cb: (s: ScrollState) => void) => {
    scroll.listeners.add(cb);
    return () => scroll.listeners.delete(cb);
  },
  scrollToY: scroll.scrollToY,
}));
vi.mock("../audio/engine", () => ({ play: vi.fn() }));

const { useScrollIndex } = await import("./useScrollIndex");
const { play } = await import("../audio/engine");

/** The page's scroll offset (window.scrollY is read-only in happy-dom). */
let scrollY = 0;
Object.defineProperty(window, "scrollY", { get: () => scrollY, configurable: true });
Object.defineProperty(window, "innerHeight", { value: 800, configurable: true });

const IDS = ["a", "b", "c"] as const;
type Id = (typeof IDS)[number];
/** Block tops in page px; each block is 1000 tall. */
const TOPS: Record<Id, number> = { a: 200, b: 1200, c: 2200 };

function block(id: Id): HTMLElement {
  const el = document.createElement("section");
  el.getBoundingClientRect = () => ({ top: TOPS[id] - window.scrollY, height: 1000 }) as DOMRect;
  Object.defineProperty(el, "offsetHeight", { value: 1000 });
  el.style.paddingBottom = "100px";
  document.body.append(el); // getComputedStyle reads only attached elements
  return el;
}

function setup(initial?: Id) {
  const blocks = { current: new Map<Id, HTMLElement>(IDS.map((id) => [id, block(id)])) };
  const root = { current: document.createElement("div") };
  return renderHook(() =>
    useScrollIndex(IDS, blocks, root, { sound: "project.select", duration: 1, ease: "none", initial: initial && (() => initial) }),
  );
}

/** The page scrolls to `y` (Lenis's onScroll). */
function scrollTo(y: number) {
  scrollY = y;
  act(() => scroll.listeners.forEach((cb) => cb({ scroll: y } as ScrollState)));
}

beforeEach(() => {
  scrollY = 0;
  scroll.scrollToY.mockReset();
});
afterEach(() => {
  cleanup();
  document.body.textContent = "";
});

describe("useScrollIndex", () => {
  it("focuses the block under the middle of the window (the first before any)", () => {
    const { result } = setup();
    expect(result.current.active).toBe("a");
    scrollTo(1200 - 400); // the window's middle reaches b's top
    expect(result.current.active).toBe("b");
    scrollTo(5000);
    expect(result.current.active).toBe("c");
  });

  it("glides a selected block to mid-screen and keeps the highlight on it meanwhile", () => {
    const { result } = setup();
    act(() => result.current.select("c"));
    expect(play).toHaveBeenCalledWith("project.select");
    expect(result.current.active).toBe("c");
    // Its centre without the 100px gap below it, minus half the window.
    expect(scroll.scrollToY).toHaveBeenCalledWith(2200 + 450 - 400, expect.objectContaining({ duration: 1, ease: "none" }));
    scrollTo(1000); // passing b mid-glide
    expect(result.current.active).toBe("c");
    act(() => scroll.scrollToY.mock.calls[0]![1].onComplete());
    scrollTo(1000);
    expect(result.current.active).toBe("b");
  });

  it("lets a wheel take over from a glide", () => {
    const { result } = setup();
    act(() => result.current.select("c"));
    scrollY = 1000;
    act(() => void window.dispatchEvent(new Event("wheel")));
    expect(result.current.active).toBe("b");
  });

  it("opens already scrolled to the initial block", () => {
    setup("b");
    expect(scroll.scrollToY).toHaveBeenCalledWith(1200 + 450 - 400, expect.objectContaining({ immediate: true }));
  });

  it("stops listening on unmount", () => {
    const { unmount } = setup();
    expect(scroll.listeners.size).toBe(1);
    unmount();
    expect(scroll.listeners.size).toBe(0);
  });
});
