import type { RefObject } from "react";

/** A ref callback that keeps `map.current[key]` pointing at the element while
 *  it is mounted (a list's items by id: scroll targets, poster texts). */
export const mapRef =
  <K, E>(map: RefObject<Map<K, E>>, key: K) =>
  (el: E | null) => {
    if (el) map.current.set(key, el);
    else map.current.delete(key);
  };
