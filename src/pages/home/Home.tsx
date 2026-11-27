import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { SprayEngine, WHO_BOX } from "../../spray/sprayEngine";
import { attachWho, respray } from "../../spray/who";
import { SPRAY } from "../../config/timings";
import MapBox from "../../components/MapBox";
import SocialLinks from "../../components/SocialLinks";
import MuteToggle from "../../components/MuteToggle";
import HomePhotos from "./HomePhotos";
import { useHomeCardOpen } from "./homeCard";
import DrawnCat from "../../components/DrawnCat";
import { attachSkyline } from "./skylineDraw";
import { loadSkyline, skylineMarkup } from "./skyline";
import PaperSheet from "../../components/paper/PaperSheet";
import { SKY_SHEET, SKY_TAPE } from "./homeSheets";
import { navLinkProps } from "../../lib/navLink";
import { PATHS } from "../../config/routes";
import { SITE_NAME } from "../../content/site";
import { GLASS_LINES, NEXT_STOP, TECH_PAPERS } from "../../content/home";
import { attachNextStop } from "./nextStop";
import { CURSOR_LABEL } from "../../content/ui";

/** The glass card's WebGL (its own chunk, keeping main under budget):
 *  fetched as soon as this module runs, alongside the fonts the first render
 *  waits for, so it's normally ready when home mounts. */
const glassModule = import("./glass/glassRenderer");
import "./home.css";

/** Dev only: /?spray-debug shows the sprayPace tuning overlay (never shipped). */
const SprayDebug =
  import.meta.env.DEV && new URLSearchParams(location.search).has("spray-debug")
    ? lazy(() => import("../../spray/SprayDebug"))
    : null;


/**
 * Home (Figma "Home Page Final", 1767×1024): "Matthew Lam" over the centre
 * card (the Map card, pinned open: components/MapBox.tsx variant="home"), the
 * social glyphs and sound toggle beside an orange cat, the Vancouver skyline,
 * taped photos (HomePhotos.tsx, paper/PaperSheet.tsx), two faded tech papers
 * bleeding off the top, and "who?" sprayed in orange under a glass card that
 * lists the experiences and links to Experience. The skyline and "who?"
 * replay on click.
 *
 * The intro on load (intro.ts) reveals the pieces and opens the card;
 * every later visit shows them finished. Placement is home.css.
 */
export default function Home() {
  // Dev only (/?spray-debug): the overlay needs the "who?" box.
  const [whoBox, setWhoBox] = useState<HTMLElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glassRef = useRef<HTMLAnchorElement>(null);
  const glassCanvasRef = useRef<HTMLCanvasElement>(null);
  const glassBaseRef = useRef<HTMLCanvasElement>(null);
  const skylineRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const stripPathRef = useRef<SVGPathElement>(null);

  // The lightbox's "next stop" strip fills and drains on a loop (nextStop.ts).
  useEffect(() => {
    const strip = stripRef.current!;
    return attachNextStop(glassRef.current!, strip, stripPathRef.current!, [...strip.querySelectorAll<HTMLElement>(".home__strip-text span")]);
  }, []);
  const cardOpen = useHomeCardOpen();

  // Dev only: /?glass-lab, the glass card's calibration bench (glass/glassLab.ts).
  useEffect(() => {
    if (!import.meta.env.DEV || !new URLSearchParams(location.search).has("glass-lab")) return;
    let unmount: (() => void) | undefined;
    let alive = true;
    import("./glass/glassLab").then((m) => {
      if (alive) unmount = m.mountGlassLab();
    });
    return () => {
      alive = false;
      unmount?.();
    };
  }, []);

  useEffect(() => {
    const engine = new SprayEngine(canvasRef.current!);
    // The glass card refracts "who?" (glass/glassRenderer.ts); without WebGL
    // (or until the chunk lands) it keeps its CSS blur (home.css, no data-glass).
    const card = glassRef.current!;
    let alive = true;
    let teardown = () => {};
    glassModule.then((m) => {
      if (alive) teardown = m.attachHomeGlass(card, glassCanvasRef.current!, glassBaseRef.current!, engine);
    }, () => undefined);
    const detach = attachWho(engine);
    return () => {
      alive = false;
      detach();
      teardown();
      engine.destroy();
    };
  }, []);

  // The skyline: inject the SVG, drawn; a click draws it again
  // (skylineDraw.ts, user request).
  useEffect(() => {
    const box = skylineRef.current!;
    let alive = true;
    let sky: ReturnType<typeof attachSkyline> | null = null;
    const inject = (text: string) => {
      if (!alive) return;
      box.innerHTML = text;
      const svg = box.querySelector("svg");
      if (svg) sky = attachSkyline(svg);
    };
    const onClick = () => sky?.replay();
    box.addEventListener("click", onClick);
    // Fetched at boot on a landing here (lib/assets.ts), so usually ready.
    const text = skylineMarkup();
    if (text) inject(text);
    else loadSkyline().then(inject, () => undefined);
    return () => {
      alive = false;
      box.removeEventListener("click", onClick);
      sky?.detach();
    };
  }, []);

  return (
    <div className="home">
      {/* The tech papers (Figma "Group 123/124"), bleeding off the top edge. */}
      <div className="home__techs wall-solid">
        {TECH_PAPERS.map((lines, i) => (
          <div key={i} className={`home__tech home__tech--${i}`}>
            <ul className="home__tech-list">
              {lines.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <h1 className="home__name">{SITE_NAME}</h1>
      <div className="home__card">
        <MapBox variant="home" open={cardOpen} />
      </div>

      <HomePhotos />

      {/* A click sprays it again (spray/who.ts, user request): a mouse-only
          flourish, so it has no key handler or role. */}
      {/* oxlint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div ref={SprayDebug ? setWhoBox : undefined} className="home__who wall-solid" data-clickable data-cursor={CURSOR_LABEL.spray} onClick={respray}>
        <canvas
          ref={canvasRef}
          className="home__who-canvas"
          role="img"
          aria-label="who?"
          style={
            {
              "--who-w": WHO_BOX.width,
              "--who-h": WHO_BOX.height,
              "--who-pad": SPRAY.CANVAS_PAD_PX,
            }
          }
        />
        {whoBox && SprayDebug && (
          <Suspense>
            <SprayDebug glass={whoBox} />
          </Suspense>
        )}
      </div>

      {/* The glass card over "who?" (Figma "Rectangle 157"): goes to Experience. */}
      <a
        ref={glassRef}
        className="home__glass"
        data-cursor={CURSOR_LABEL.readMore}
        {...navLinkProps(PATHS.experience)}
      >
        <canvas ref={glassBaseRef} className="home__glass-base" aria-hidden="true" />
        {/* The tubes behind the diffuser: on the face under the text (opaque
            ink blocks the backlight) and under the blue film. */}
        <span className="home__lb home__lb-tubes" aria-hidden="true" />
        {GLASS_LINES.map((group, i) => (
          <p key={i}>
            {group.map((l, j) => (
              <span key={j}>{l}</span>
            ))}
          </p>
        ))}
        {/* The blue "next stop" strip: film over the face, its letters cut out. */}
        <div ref={stripRef} className="home__strip">
          <svg className="home__strip-shape" viewBox="0 0 1 1" aria-hidden="true">
            <path ref={stripPathRef} />
          </svg>
          <div className="home__strip-text">
            <span className="home__strip-label">{NEXT_STOP.label}</span>
            <span className="home__strip-name">{NEXT_STOP.name}</span>
            <span className="home__strip-place">{NEXT_STOP.place}</span>
          </div>
        </div>
        {/* Backlit acrylic over the face (user request): diffuser grain and
            glass sheen over the text and strip, under the paint. */}
        <span className="home__lb home__lb-grain" aria-hidden="true" />
        <span className="home__lb home__lb-sheen" aria-hidden="true" />
        {/* "who?" sprayed over the card, text and edge (user request). */}
        <canvas ref={glassCanvasRef} className="home__glass-canvas" aria-hidden="true" />
      </a>

      {/* The intro draws it the first time (intro.ts); a click redraws it. */}
      <DrawnCat className="home__cat" />
      <SocialLinks className="home__social">
        <MuteToggle />
      </SocialLinks>
      {/* The skyline drawn on its taped sheet (Figma "Rectangle 154"). */}
      <div className="home__sky">
        <PaperSheet sheet={SKY_SHEET} placed />
        {/* A click draws it again (skylineDraw.ts). */}
        <div ref={skylineRef} className="home__skyline" data-clickable data-cursor={CURSOR_LABEL.draw} aria-hidden="true" />
        <PaperSheet sheet={SKY_TAPE} className="wall-solid" placed />
      </div>
    </div>
  );
}
