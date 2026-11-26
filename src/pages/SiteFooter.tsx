import "./footer.css";
import { FOOTER_CHAT, FOOTER_CREDIT, LAST_UPDATED } from "../content/contact";
import { SITE_NAME } from "../content/site";
import DrawnCat from "../chrome/DrawnCat";
import Connections from "../chrome/Connections";

/**
 * The foot of every station page (About, Experience, the projects; Figma
 * "Experience Final", y 1449 on): the cat, "Let's chat!" by its foot, the
 * blue Connections box (chrome/Connections.tsx) and the credits. The cat
 * draws itself when it scrolls into view.
 */
export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <DrawnCat className="site-footer__cat" drawOnView />
      <p className="site-footer__chat" data-reveal>
        {FOOTER_CHAT}
      </p>
      <Connections titleId="connections-title" reveal />
      <p className="site-footer__credits" data-reveal>
        Last Updated {LAST_UPDATED}
        <br />
        {FOOTER_CREDIT} {SITE_NAME}
      </p>
    </footer>
  );
}
