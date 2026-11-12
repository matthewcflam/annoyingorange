/**
 * Read a color/font token from config/tokens.css at runtime, for code that
 * can't use CSS directly (canvas, GSAP color tweens). Cache the result; don't
 * call this inside animation frames.
 */
export function readToken(name: `--${string}`): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/**
 * The project scale (tokens.css --ps): 2/3 on the full layout, 1 on compact.
 * Multiply fixed px distances on the project pages and the Map box by it.
 */
export function projectScale(): number {
  return parseFloat(readToken("--ps")) || 1;
}
