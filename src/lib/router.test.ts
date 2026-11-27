// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { TransitionRunner } from "./router";

// Lenis and the GSAP ticker play no part in routing.
vi.mock("./scroll", () => ({ lockScroll: vi.fn(), unlockScroll: vi.fn(), resetScroll: vi.fn() }));

type Router = typeof import("./router");

/** A fresh router (it is a module singleton) loaded at `url`. */
async function load(url = "/"): Promise<Router> {
  vi.resetModules();
  history.replaceState(null, "", url);
  return import("./router");
}

/** A runner the test steps by hand: each run waits until `cover()` commits
 *  it and `clear()` resolves it. */
function manualRunner() {
  const runs: { to: string; commit: () => void; resolve: () => void; reject: (e: unknown) => void }[] = [];
  const runner: TransitionRunner = (to, commit) => new Promise<void>((resolve, reject) => runs.push({ to, commit, resolve, reject }));
  const last = () => runs.at(-1)!;
  return {
    runner,
    runs,
    cover: () => last().commit(),
    clear: async () => {
      last().resolve();
      await flush();
    },
    fail: async (e = new Error("boom")) => {
      last().reject(e);
      await flush();
    },
  };
}

const flush = () => new Promise((r) => setTimeout(r, 0));

let popListeners: EventListener[] = [];
const addEventListener = window.addEventListener.bind(window);
beforeEach(() => {
  // Each fresh router adds a popstate listener; keep only the latest live.
  popListeners = [];
  vi.spyOn(window, "addEventListener").mockImplementation((type: string, fn: EventListenerOrEventListenerObject, opts?: unknown) => {
    if (type === "popstate") popListeners.push(fn as EventListener);
    else addEventListener(type, fn, opts as AddEventListenerOptions);
  });
  // happy-dom has no reportError; the router reports a failed transition with it.
  vi.stubGlobal("reportError", vi.fn());
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

/** The browser's Back/Forward: the URL moves, then popstate fires. */
function popTo(path: string) {
  history.replaceState(null, "", path);
  popListeners.at(-1)!(new PopStateEvent("popstate"));
}

describe("entry URL", () => {
  it("canonicalises old project links and remembers the project once", async () => {
    const r = await load("/projects/mango/");
    expect(r.getRoute()).toBe("/projects");
    expect(location.pathname).toBe("/projects");
    expect(document.title).toMatch(/^Projects · /);
    expect(r.takeProjectFocus()).toBe("mango");
    expect(r.takeProjectFocus()).toBeNull();
  });

  it("sends unknown paths home", async () => {
    const r = await load("/nope");
    expect(r.getRoute()).toBe("/");
    expect(location.pathname).toBe("/");
  });
});

describe("navigate", () => {
  it("pushes the URL at once and swaps the page at commit", async () => {
    const r = await load("/");
    const t = manualRunner();
    r.setTransitionRunner(t.runner);
    r.navigate("/about");
    expect(location.pathname).toBe("/about");
    expect(r.getRoute()).toBe("/");
    t.cover();
    expect(r.getRoute()).toBe("/about");
    expect(document.title).toMatch(/^About · /);
    await t.clear();
    expect(t.runs).toHaveLength(1);
  });

  it("ignores a click on the current page", async () => {
    const r = await load("/about");
    const t = manualRunner();
    r.setTransitionRunner(t.runner);
    const length = history.length;
    r.navigate("/about/");
    expect(t.runs).toHaveLength(0);
    expect(history.length).toBe(length);
  });

  it("ignores clicks mid-transition", async () => {
    const r = await load("/");
    const t = manualRunner();
    r.setTransitionRunner(t.runner);
    r.navigate("/about");
    r.navigate("/experience");
    expect(location.pathname).toBe("/about");
    t.cover();
    await t.clear();
    expect(t.runs.map((x) => x.to)).toEqual(["/about"]);
    expect(r.getRoute()).toBe("/about");
  });

  it("commits once even when the runner commits twice", async () => {
    const r = await load("/");
    const t = manualRunner();
    r.setTransitionRunner(t.runner);
    const seen: string[] = [];
    // useRoute's store: count the commits through a subscriber.
    const { renderHook } = await import("@testing-library/react");
    const { result } = renderHook(() => r.useRoute());
    r.navigate("/about");
    t.cover();
    seen.push(result.current);
    t.cover();
    seen.push(result.current);
    await t.clear();
    expect(seen).toEqual(["/about", "/about"]);
  });

  it("still commits when the runner fails before committing", async () => {
    const r = await load("/");
    const t = manualRunner();
    r.setTransitionRunner(t.runner);
    r.navigate("/experience");
    await t.fail();
    expect(r.getRoute()).toBe("/experience");
    expect(globalThis.reportError).toHaveBeenCalled();
    // And the router is free again.
    r.navigate("/about");
    expect(t.runs).toHaveLength(2);
  });

  it("remembers the project an old project link names", async () => {
    const r = await load("/");
    r.navigate("/projects/oyster-news");
    expect(location.pathname).toBe("/projects");
    await flush();
    expect(r.takeProjectFocus()).toBe("oyster-news");
  });
});

describe("back / forward", () => {
  it("runs a transition without pushing", async () => {
    const r = await load("/");
    const t = manualRunner();
    r.setTransitionRunner(t.runner);
    const length = history.length;
    popTo("/about");
    expect(history.length).toBe(length);
    t.cover();
    await t.clear();
    expect(r.getRoute()).toBe("/about");
  });

  it("queues mid-transition, and the latest wins", async () => {
    const r = await load("/");
    const t = manualRunner();
    r.setTransitionRunner(t.runner);
    r.navigate("/about");
    popTo("/experience");
    popTo("/projects");
    t.cover();
    await t.clear();
    expect(t.runs.map((x) => x.to)).toEqual(["/about", "/projects"]);
    t.cover();
    await t.clear();
    expect(r.getRoute()).toBe("/projects");
    expect(t.runs).toHaveLength(2);
  });

  it("drops a queued entry that lands back on the page just shown", async () => {
    const r = await load("/");
    const t = manualRunner();
    r.setTransitionRunner(t.runner);
    r.navigate("/about");
    popTo("/about");
    t.cover();
    await t.clear();
    expect(t.runs).toHaveLength(1);
  });
});

describe("whenIdle", () => {
  it("resolves at once when idle, else when the transition (and its queue) ends", async () => {
    const r = await load("/");
    const t = manualRunner();
    r.setTransitionRunner(t.runner);
    let idle = false;
    await r.whenIdle();
    r.navigate("/about");
    void r.whenIdle().then(() => (idle = true));
    popTo("/experience");
    t.cover();
    await t.clear();
    expect(idle).toBe(false); // the queued /experience is running
    t.cover();
    await t.clear();
    expect(idle).toBe(true);
  });
});

describe("isPlainClick", () => {
  it("lets modified and non-left clicks through to the browser", async () => {
    const r = await load("/");
    const click = (o: Partial<React.MouseEvent> = {}) =>
      ({ defaultPrevented: false, button: 0, metaKey: false, ctrlKey: false, shiftKey: false, altKey: false, ...o }) as React.MouseEvent;
    expect(r.isPlainClick(click())).toBe(true);
    expect(r.isPlainClick(click({ metaKey: true }))).toBe(false);
    expect(r.isPlainClick(click({ ctrlKey: true }))).toBe(false);
    expect(r.isPlainClick(click({ button: 1 }))).toBe(false);
    expect(r.isPlainClick(click({ defaultPrevented: true }))).toBe(false);
  });
});
