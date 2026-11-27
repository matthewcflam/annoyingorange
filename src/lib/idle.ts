/**
 * requestIdleCallback with a fallback (Safari before 18 has none): `fn` runs
 * when the browser is idle, or after `timeoutMs` at the latest; without the
 * API, after `fallbackMs`. Returns a cancel.
 */
const hasIdle = typeof requestIdleCallback === "function";

export function onBrowserIdle(fn: () => void, { timeoutMs, fallbackMs }: { timeoutMs: number; fallbackMs: number }): () => void {
  if (hasIdle) {
    const id = requestIdleCallback(fn, { timeout: timeoutMs });
    return () => cancelIdleCallback(id);
  }
  const id = setTimeout(fn, fallbackMs);
  return () => clearTimeout(id);
}
