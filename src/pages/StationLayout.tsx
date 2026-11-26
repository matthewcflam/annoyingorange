import type { CSSProperties, ReactNode, Ref } from "react";
import { navLinkProps } from "../lib/navLink";
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
  nav,
  footer = true,
  children,
}: {
  className?: string;
  rootRef?: Ref<HTMLDivElement>;
  style?: CSSProperties;
  nav?: ReactNode;
  /** The site footer (About has none). */
  footer?: boolean;
  children: ReactNode;
}) {
  return (
    <div ref={rootRef} className={`page${className ? ` ${className}` : ""}`} style={style}>
      <header className="page__head">
        <h1 className="page__name">
          <a className="page__home" aria-label="Matthew Lam, home" data-cursor="Go Home" {...navLinkProps("/")}>
            Matthew Lam
          </a>
        </h1>
        {nav}
      </header>
      {children}
      {footer && <SiteFooter />}
    </div>
  );
}
