import { useId, type CSSProperties } from "react";
import "./connections.css";
import { useCopyEmail } from "./useCopyEmail";
import Icon from "./Icon";
import { CONTACT_LINKS, EMAIL } from "../content/contact";
import { trackClick } from "../lib/track";

/**
 * The blue Connections card: each connection's logo on the left (where Figma
 * has dots, user decision) and its name on the right; Email copies the
 * address and shows "email copied!" beside the card. Styled in connections.css
 * (× --ft); the footer and About's collage (about.css) each place it.
 */
export default function Connections({
  className = "",
  reveal = false,
  style,
  source,
}: {
  className?: string;
  /** Fade up on scroll ([data-reveal], lib/scrollReveal.ts). */
  reveal?: boolean;
  style?: CSSProperties;
  /** Where the card is, for the click counts (lib/track.ts). */
  source: "Footer" | "About";
}) {
  const { copyEmail, toastRef, copied } = useCopyEmail();
  const titleId = useId();

  return (
    <nav className={`connections ${className}`} aria-labelledby={titleId} data-reveal={reveal || undefined} style={style}>
      <h2 id={titleId} className="connections__title">
        Connections
      </h2>
      <p ref={toastRef} className="connections__toast" role="status">
        {copied ? "email copied!" : ""}
      </p>
      <ul>
        {CONTACT_LINKS.map(({ id, label, icon, href }) => {
          const track = () => trackClick(`click/${href ? id : "email-copy"}`, source);
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
                <a className="connections__row" href={href} target="_blank" rel="noopener noreferrer" onClick={track} onAuxClick={track}>
                  {inner}
                </a>
              ) : (
                <button type="button" className="connections__row" aria-label={`Copy email address (${EMAIL})`} onClick={() => {
                    track();
                    copyEmail();
                  }}
                >
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
