const RELOADED = "reloaded-after-error";

/** Reload once: a failed page is almost always a chunk from an older deploy
 *  (the host answers a missing hashed file with index.html). A second
 *  failure in the same tab doesn't loop. */
export function reloadOnce(): boolean {
  try {
    if (sessionStorage.getItem(RELOADED)) return false;
    sessionStorage.setItem(RELOADED, "1");
  } catch {
    return false; // no storage: no way to know we've tried, so don't loop
  }
  location.reload();
  return true;
}
