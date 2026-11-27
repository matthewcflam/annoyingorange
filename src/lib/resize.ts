/**
 * A window resize listener that runs `fn` at most once per frame (a drag of
 * the window edge fires many resize events per frame). Returns the
 * unsubscribe.
 */
export function onWindowResize(fn: () => void): () => void {
  let raf = 0;
  const onResize = () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(fn);
  };
  window.addEventListener("resize", onResize);
  return () => {
    window.removeEventListener("resize", onResize);
    cancelAnimationFrame(raf);
  };
}
