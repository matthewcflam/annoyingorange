/**
 * Whether the page layer is on screen. A page mounts while hidden (behind the
 * intro on load, or at commit while the transition has it faded out), so an entrance
 * animation waits for whenPageShown() instead of guessing a delay. The intro
 * timeline and the transition runner mark the moments the page starts to appear.
 */
let shown = false;
let waiters: (() => void)[] = [];

export function markPageHidden(): void {
  shown = false;
}

export function markPageShown(): void {
  shown = true;
  const w = waiters;
  waiters = [];
  for (const fn of w) fn();
}

/** Resolves when the page starts to appear; immediately if it's already shown. */
export function whenPageShown(): Promise<void> {
  return shown ? Promise.resolve() : new Promise((resolve) => waiters.push(resolve));
}

/**
 * Once the page shows, watch `els` and call `onEnter` with each batch that
 * scrolls into view (at least `threshold` of it visible); each element fires
 * once. Lenis drives the native window scroll, so the observer sees it.
 * Returns a stop (also safe before the page has shown).
 */
export function observeOnceShown(els: Element[], threshold: number, onEnter: (entering: Element[]) => void): () => void {
  let stopped = false;
  let io: IntersectionObserver | null = null;
  void whenPageShown().then(() => {
    if (stopped) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entering = entries.filter((e) => e.isIntersecting).map((e) => e.target);
        if (entering.length === 0) return;
        for (const el of entering) observer.unobserve(el);
        onEnter(entering);
      },
      { threshold },
    );
    for (const el of els) observer.observe(el);
    io = observer;
  });
  return () => {
    stopped = true;
    io?.disconnect();
  };
}
