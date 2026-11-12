import type { CSSProperties, ReactNode, Ref } from "react";
import { onNavClick } from "../lib/router";
import { play } from "../audio/engine";
import SiteFooter from "./SiteFooter";
import "./page.css";

/**
 * Shell of every station page (About, Experience, the projects; page.css): a
 * light page on the 9-column grid with the orange "Matthew Lam" fixed
 * top-left (it goes home), anything else the header holds (`nav`: the
 * project list), the page, then the site footer (cat, "Let's chat!",
 * Connections, credits). The Map box top-right is shared chrome
 * (chrome/StationChrome.tsx), so it persists between stations.
 */
export default function StationLayout({
  className,
  rootRef,
  style,
  bar,
  nav,
  children,
}: {
  className?: string;
  rootRef?: Ref<HTMLDivElement>;
  style?: CSSProperties;
  /** A page-coloured band under the header that content scrolls under. */
  bar?: boolean;
  nav?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div ref={rootRef} className={`page${className ? ` ${className}` : ""}`} style={style}>
      {bar && <div className="page__bar" aria-hidden="true" />}
      <header className="page__head">
        <h1 className="page__name">
          <a
            href="/"
            className="page__home"
            aria-label="Matthew Lam, home"
            onPointerEnter={(e) => e.pointerType !== "touch" && play("link.hover")}
            onClick={(e) => onNavClick(e, "/")}
          >
            Matthew Lam
          </a>
        </h1>
        {nav}
      </header>
      {children}
      <SiteFooter />
    </div>
  );
}
