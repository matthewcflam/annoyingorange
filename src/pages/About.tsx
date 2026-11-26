import type { CSSProperties } from "react";
import StationLayout from "./StationLayout";
import PaperSheet from "./paper/PaperSheet";
import Connections from "../chrome/Connections";
import { ABOUT_CARD, ABOUT_SHEETS } from "../content/aboutPhotos";
import { onNavClick } from "../lib/router";
import { prefetchRoute } from "../lib/assets";
import { play } from "../audio/engine";
import "./station.css";

/** A collage piece's box (Figma px) as the vars station.css places it by. */
const placeAt = (b: { cx: number; cy: number; w: number; h: number; rotate: number }) =>
  ({ "--cx": b.cx, "--cy": b.cy, "--w": b.w, "--h": b.h, "--r": `${b.rotate}deg` }) as CSSProperties;

/** An orange word that goes to another station (Experience, Projects). */
function StationLink({ to, children }: { to: string; children: string }) {
  return (
    <a
      className="about__link"
      href={to}
      data-cursor={`View ${children[0].toUpperCase()}${children.slice(1)}`}
      onClick={(e) => onNavClick(e, to)}
      onPointerEnter={(e) => {
        if (e.pointerType === "touch") return;
        play("link.hover");
        prefetchRoute(to);
      }}
      onFocus={() => prefetchRoute(to)}
    >
      {children}
    </a>
  );
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
          <Connections className="about__connections" titleId="about-connections-title" style={placeAt(ABOUT_CARD)} />
        </div>
        <div className="about__text">
          <h2 className="about__hello">
            Nice to meet you!
            <br />
            I’m Matthew
          </h2>
          <div className="about__copy">
            <p>
              I’m a curious, user-focused developer that loves to understand problems and use technology to solve them. I’m
              currently pursuing a degree in Computer Engineering at the{" "}
              <span className="about__accent">University of British Columbia</span>.
            </p>
            <p>I’m based in Vancouver, and open to summer / fall 2027 opportunities!</p>
            <p>
              Check out my <StationLink to="/experience">experience</StationLink> and{" "}
              <StationLink to="/projects">projects</StationLink> :)
            </p>
          </div>
        </div>
      </div>
    </StationLayout>
  );
}
