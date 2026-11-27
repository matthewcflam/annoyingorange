/** Persisted preferences. Storage can throw (private mode, blocked). Sound is
 *  deliberately not persisted: every load starts muted (user decision). */

/** A persisted on/off switch (the layout grid overlay). */
export function loadFlag(key: string): boolean {
  try {
    return localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

export function saveFlag(key: string, on: boolean): void {
  try {
    localStorage.setItem(key, on ? "1" : "0");
  } catch {
    /* it just won't persist */
  }
}
