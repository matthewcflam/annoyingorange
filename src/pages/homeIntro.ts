/**
 * Home's centre card opens once, during the intro (chrome/intro.ts calls
 * openHomeCard() at INTRO.CARD_OPEN), then stays open on every visit (user
 * decision). A deep link opens it at once, so it's open when home first
 * mounts.
 */
import { introPart } from "../lib/introPart";

const card = introPart();

export const isHomeCardOpen = () => card.state !== "pending";

export const openHomeCard = () => card.start();

/** Calls `fn` when the card opens. Returns the unsubscribe. */
export const onHomeCardOpen = (fn: () => void) => card.onStart(fn);
