// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest";
import { pageLoader } from "./routeAssets";

const Page = () => null;

describe("pageLoader", () => {
  it("imports once for every caller (Vite waits for a chunk's CSS only on the first import)", async () => {
    const load = vi.fn(() => Promise.resolve({ default: Page }));
    const loader = pageLoader(load);
    expect(loader.loaded()).toBeNull();
    const [a, b] = await Promise.all([loader(), loader()]);
    await loader();
    expect(load).toHaveBeenCalledTimes(1);
    expect(a).toBe(b);
    expect(loader.loaded()).toBe(Page);
  });

  it("forgets a failed load, so the next call retries", async () => {
    const load = vi.fn().mockRejectedValueOnce(new Error("offline")).mockResolvedValue({ default: Page });
    const loader = pageLoader(load);
    await expect(loader()).rejects.toThrow("offline");
    expect(loader.loaded()).toBeNull();
    await expect(loader()).resolves.toEqual({ default: Page });
    expect(load).toHaveBeenCalledTimes(2);
  });
});
