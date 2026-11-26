import { useEffect, useEffectEvent } from "react";

/** Keys typed into a field are text, not shortcuts. */
const typing = (t: EventTarget | null) =>
  t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));

/**
 * A window keyboard shortcut. `match` picks the key (modifiers included); key
 * repeats and keys typed into a field never fire it. `run` always sees the
 * latest props and state, and the listener is added once.
 */
export function useShortcut(match: (e: KeyboardEvent) => boolean, run: (e: KeyboardEvent) => void): void {
  const onKey = useEffectEvent((e: KeyboardEvent) => {
    if (e.repeat || typing(e.target) || !match(e)) return;
    run(e);
  });
  useEffect(() => {
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}
