import "./footer.css";
import { LAST_UPDATED } from "../content/contact";
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
        Let’s chat!
      </p>
      <Connections titleId="connections-title" reveal />
      <p className="site-footer__credits" data-reveal>
        Last Updated {LAST_UPDATED}
        <br />
        Designed and Built by Matthew Lam
      </p>
    </footer>
  );
}
