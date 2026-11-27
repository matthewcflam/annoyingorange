import { useSyncExternalStore } from "react";
import { isMuted, subscribe } from "./engine";

/** Re-renders when the mute state changes. */
export function useMuted(): boolean {
  return useSyncExternalStore(subscribe, isMuted);
}
