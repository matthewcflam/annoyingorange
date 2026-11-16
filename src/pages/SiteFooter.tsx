import "./footer.css";
import { useCopyEmail } from "../chrome/useCopyEmail";
import Icon from "../chrome/Icon";
import type { ICONS } from "../chrome/icons";
import { DEVPOST, EMAIL, GITHUB, LINKEDIN, LAST_UPDATED } from "../content/contact";
import DrawnCat from "../chrome/DrawnCat";

/** The Connections rows, top to bottom (Figma). Email copies the address. */
const LINKS: { label: string; icon: keyof typeof ICONS; href: string | null }[] = [
  { label: "Email", icon: "mail", href: null },
  { label: "LinkedIn", icon: "linkedin", href: LINKEDIN },
  { label: "GitHub", icon: "github", href: GITHUB },
  { label: "Devpost", icon: "devpost", href: DEVPOST },
];

/**
 * The foot of every station page (About, Experience, the projects; Figma
 * "Portfolio", y 2295 on): the cat,
 * "Let's chat!", the blue Connections box (each connection's logo on the
 * left, its name on the right) and the credits. The cat draws itself when it
 * scrolls into view.
 */
export default function SiteFooter() {
  const { copyEmail, toastRef, copied } = useCopyEmail();

  return (
    <footer className="site-footer">
      <DrawnCat className="site-footer__cat" drawOnView />
      <p className="site-footer__chat" data-reveal>
        Let’s chat!
      </p>
      <nav className="connections" aria-labelledby="connections-title" data-reveal>
        <h2 id="connections-title" className="connections__title">
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
      <p className="site-footer__credits" data-reveal>
        LAST UPDATED {LAST_UPDATED}
        <br />
        DESIGNED AND BUILT BY MATTHEW LAM
      </p>
    </footer>
  );
}
