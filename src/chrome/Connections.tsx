import type { CSSProperties } from "react";
import "./connections.css";
import { useCopyEmail } from "./useCopyEmail";
import Icon from "./Icon";
import type { ICONS } from "./icons";
import { DEVPOST, EMAIL, GITHUB, LINKEDIN } from "../content/contact";

/** The Connections rows, top to bottom (Figma). Email copies the address. */
const LINKS: { label: string; icon: keyof typeof ICONS; href: string | null }[] = [
  { label: "Email", icon: "mail", href: null },
  { label: "LinkedIn", icon: "linkedin", href: LINKEDIN },
  { label: "GitHub", icon: "github", href: GITHUB },
  { label: "Devpost", icon: "devpost", href: DEVPOST },
];

/**
 * The blue Connections card: each connection's logo on the left (where Figma
 * has dots, user decision) and its name on the right; Email copies the
 * address and shows "email copied!" beside the card. Styled in connections.css
 * (× --ft); the footer and About's collage (station.css) each place it.
 */
export default function Connections({
  titleId,
  className = "",
  reveal = false,
  style,
}: {
  /** The heading's id (aria-labelledby), unique per card on the page. */
  titleId: string;
  className?: string;
  /** Fade up on scroll ([data-reveal], lib/scrollReveal.ts). */
  reveal?: boolean;
  style?: CSSProperties;
}) {
  const { copyEmail, toastRef, copied } = useCopyEmail();

  return (
    <nav className={`connections ${className}`} aria-labelledby={titleId} data-reveal={reveal || undefined} style={style}>
      <h2 id={titleId} className="connections__title">
        Connections
      </h2>
      <p ref={toastRef} className="connections__toast" role="status">
        {copied ? "email copied!" : ""}
      </p>
      <ul>
        {LINKS.map(({ label, icon, href }) => {
          const inner = (
            <>
              <span className="connections__icon">
                <Icon name={icon} />
              </span>
              <span className="connections__label">{label}</span>
            </>
          );
          return (
            <li key={label}>
              {href ? (
                <a className="connections__row" href={href} target="_blank" rel="noopener noreferrer">
                  {inner}
                </a>
              ) : (
                <button type="button" className="connections__row" aria-label={`Copy email address (${EMAIL})`} onClick={copyEmail}>
                  {inner}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
