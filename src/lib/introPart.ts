/**
 * One piece of home's intro that plays once, then shows finished on every
 * later visit: the centre card (pages/homeIntro.ts) and the skyline
 * (pages/skylineDraw.ts). chrome/intro.ts calls start() at the piece's time,
 * or skip() on a deep link; the page component, which remounts on every
 * visit, reads the state and listens for the start. Module state, because
 * the intro outlives the page (StrictMode double-mounts it too).
 *
 *   pending  the intro hasn't reached it (hide it, ready to play)
 *   started  the intro reached it (play it, or it's playing)
 *   done     played, skipped, or left mid-play: show it finished
 */
export type IntroState = "pending" | "started" | "done";

export interface IntroPart {
  readonly state: IntroState;
  /** The intro reached it: pending → started, telling the listeners. */
  start(): void;
  /** Show it finished from now on (deep link, played, or left mid-play). */
  finish(): void;
  /** Calls `fn` on start(). Returns the unsubscribe. */
  onStart(fn: () => void): () => void;
}

export function introPart(): IntroPart {
  let state: IntroState = "pending";
  const listeners = new Set<() => void>();
  return {
    get state() {
      return state;
    },
    start() {
      if (state !== "pending") return;
      state = "started";
      listeners.forEach((fn) => fn());
    },
    finish() {
      state = "done";
    },
    onStart(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}
