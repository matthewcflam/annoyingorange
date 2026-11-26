import StationLayout from "../../components/StationLayout";
import PaperSheet from "../../components/paper/PaperSheet";
import { placeAt } from "../../components/paper/sheet";
import Connections from "../../components/Connections";
import { ABOUT_CARD, ABOUT_SHEETS } from "../../content/aboutPhotos";
import { navLinkProps } from "../../lib/navLink";
import { PATHS, type StationId } from "../../config/routes";
import { ABOUT_COPY, ABOUT_HELLO, type AboutSpan } from "../../content/about";
import { CURSOR_LABEL } from "../../content/ui";
import "../../components/station.css";
import "./about.css";

/** An orange word that goes to another station (Experience, Projects). */
function StationLink({ to, children }: { to: StationId; children: string }) {
  return (
    <a className="about__link" data-cursor={CURSOR_LABEL.view(`${children.charAt(0).toUpperCase()}${children.slice(1)}`)} {...navLinkProps(PATHS[to])}>
      {children}
    </a>
  );
}

function Span({ span }: { span: AboutSpan }) {
  if (typeof span === "string") return span;
  if ("accent" in span) return <span className="about__accent">{span.accent}</span>;
  return <StationLink to={span.link}>{span.text}</StationLink>;
}

/**
 * About (Figma "ABOUT FINAL"): one screen, no footer. A collage of prints
 * of me-final.png on the left (content/aboutPhotos.ts), placed in Figma px
 * from the frame's centre, and the greeting and copy starting at grid
 * column 6, centred vertically in the window (station.css).
 */
export default function About() {
  return (
    <StationLayout className="station-page about" footer={false}>
      <div className="about__stage">
        {/* Each print hides itself from assistive tech; the card stays in. */}
        <div className="about__collage">
          {ABOUT_SHEETS.map((s, i) => (
            <PaperSheet key={s.id} sheet={s} eager={i === ABOUT_SHEETS.length - 1} style={placeAt(s)} />
          ))}
          <Connections className="about__connections" style={placeAt(ABOUT_CARD)} />
        </div>
        <div className="about__text">
          <h2 className="about__hello">
            {ABOUT_HELLO[0]}
            <br />
            {ABOUT_HELLO[1]}
          </h2>
          <div className="about__copy">
            {ABOUT_COPY.map((spans, i) => (
              <p key={i}>
                {spans.map((s, j) => (
                  <Span key={j} span={s} />
                ))}
              </p>
            ))}
          </div>
        </div>
      </div>
    </StationLayout>
  );
}
