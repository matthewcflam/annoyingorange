/**
 * Home's centre card opens once, during the intro (intro.ts calls
 * openHomeCard() at INTRO.CARD_OPEN), then stays open on every visit (user
 * decision). A deep link opens it at once, so it's open when home first
 * mounts.
 */
import { useSyncExternalStore } from "react";
import { introPart } from "../../lib/introPart";

const card = introPart();

const isHomeCardOpen = () => card.state !== "pending";

export const openHomeCard = () => card.start();

/** Whether the card is open; re-renders when the intro opens it. */
export function useHomeCardOpen(): boolean {
  return useSyncExternalStore(card.onStart, isHomeCardOpen);
}
