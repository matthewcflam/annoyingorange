import type { FocusEvent, MouseEvent, PointerEvent } from "react";
import { onNavClick } from "./router";
import { prefetchRoute } from "./assets";
import { hoverSound } from "../audio/engine";

/**
 * Props for an <a> to another page: a real href (new tabs work), the page
 * transition on a plain click, and the next page's code and images fetched as
 * soon as the pointer or focus lands on it. `sound`: the link.hover tick
 * (off for the Map box rows, which are silent: user request).
 */
export function navLinkProps(path: string, { sound = true }: { sound?: boolean } = {}) {
  return {
    href: path,
    onClick: (e: MouseEvent) => onNavClick(e, path),
    onPointerEnter: (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      if (sound) hoverSound(e);
      prefetchRoute(path);
    },
    onFocus: (_e: FocusEvent) => prefetchRoute(path),
  };
}
