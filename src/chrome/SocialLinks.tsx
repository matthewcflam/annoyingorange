import { hoverSound } from "../audio/engine";
import { useCopyEmail } from "./useCopyEmail";
import { EMAIL, contactLink, type ContactId } from "../content/contact";
import Icon from "./Icon";
import "./chrome.css";

/** Home's row order (Figma "Home Page Final"), and the glyphs chrome.css nudges. */
const ORDER: ContactId[] = ["github", "linkedin", "email", "devpost"];
const MODIFIER: Partial<Record<ContactId, string>> = { email: "mail", devpost: "devpost" };

/**
 * GitHub, LinkedIn, a mail button that copies the address (with its
 * "copied" toast) and Devpost, beside the cat on home (station pages have the footer's
 * Connections box instead). `children` join the row after Devpost
 * (home's sound toggle).
 */
export default function SocialLinks({ className, children }: { className?: string; children?: React.ReactNode }) {
  const { copyEmail, toastRef, copied } = useCopyEmail();

  return (
    <div className={`social-links${className ? ` ${className}` : ""}`}>
      {ORDER.map((id) => {
        const { label, icon, href, cursor } = contactLink(id);
        const cls = `social-links__icon${MODIFIER[id] ? ` social-links__icon--${MODIFIER[id]}` : ""} interactive`;
        return href ? (
          <a key={id} className={cls} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} data-cursor={cursor} onPointerEnter={hoverSound}>
            <Icon name={icon} tight />
          </a>
        ) : (
          <button key={id} type="button" className={cls} aria-label={`Copy email address (${EMAIL})`} data-cursor={cursor} onPointerEnter={hoverSound} onClick={copyEmail}>
            <Icon name={icon} tight />
          </button>
        );
      })}
      {children}
      <p ref={toastRef} className="social-links__toast" role="status">
        {copied ? "email copied to clipboard!" : ""}
      </p>
    </div>
  );
}
