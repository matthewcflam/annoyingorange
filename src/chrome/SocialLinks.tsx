import { play } from "../audio/engine";
import { useCopyEmail } from "./useCopyEmail";
import { EMAIL, GITHUB, LINKEDIN } from "../content/contact";
import Icon from "./Icon";
import "./chrome.css";

/**
 * GitHub, LinkedIn and a mail button that copies the address, with its
 * "copied" toast, beside the cat on home (station pages have the footer's
 * Connections box instead). `children` join the row after the mail button
 * (home's sound toggle).
 */
export default function SocialLinks({ className, children }: { className?: string; children?: React.ReactNode }) {
  const { copyEmail, toastRef, copied } = useCopyEmail();

  const hover = (e: React.PointerEvent) => e.pointerType !== "touch" && play("link.hover");

  return (
    <div className={`social-links${className ? ` ${className}` : ""}`}>
      <a className="social-links__icon interactive" href={GITHUB} target="_blank" rel="noopener noreferrer" aria-label="GitHub" onPointerEnter={hover}>
        <Icon name="github" />
      </a>
      <a className="social-links__icon interactive" href={LINKEDIN} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" onPointerEnter={hover}>
        <Icon name="linkedin" />
      </a>
      <button type="button" className="social-links__icon social-links__icon--mail interactive" aria-label={`Copy email address (${EMAIL})`} onPointerEnter={hover} onClick={copyEmail}>
        <Icon name="mail" />
      </button>
      {children}
      <p ref={toastRef} className="social-links__toast" role="status">
        {copied ? "email copied to clipboard!" : ""}
      </p>
    </div>
  );
}
