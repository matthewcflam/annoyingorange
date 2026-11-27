import { useEffect, useRef } from "react";

/**
 * One pending timeout per component (hover open/close delays): `set` replaces
 * any pending one, `clear` cancels it, and unmounting cancels it too.
 */
export function useTimer() {
  const id = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(id.current), []);
  return {
    /** Run `fn` after `seconds`, replacing any pending call. */
    set(fn: () => void, seconds: number) {
      clearTimeout(id.current);
      id.current = setTimeout(fn, seconds * 1000);
    },
    clear() {
      clearTimeout(id.current);
    },
  };
}
