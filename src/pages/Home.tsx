import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { SprayEngine, WHO_BOX } from "../spray/sprayEngine";
import { attachWho, respray } from "../spray/who";
import { SPRAY } from "../config/timings";
import MapBox from "../keychain/MapBox";
import SocialLinks from "../chrome/SocialLinks";
import MuteToggle from "../chrome/MuteToggle";
import HomePhotos from "./HomePhotos";
import { isHomeCardOpen, onHomeCardOpen } from "./homeIntro";
import DrawnCat from "../chrome/DrawnCat";
import { attachSkyline } from "./skylineDraw";
import { loadSkyline, skylineMarkup } from "../lib/assets";
import PaperSheet from "./paper/PaperSheet";
import { SKY_SHEET, SKY_TAPE } from "./paper/sheets";
import { onNavClick } from "../lib/router";
import { prefetchRoute } from "../lib/assets";
import { play } from "../audio/engine";

/** The glass card's WebGL (its own chunk, keeping main under budget):
 *  fetched as soon as this module runs, alongside the fonts the first render
 *  waits for, so it's normally ready when home mounts. */
const glassModule = import("./glass/glassRenderer");
import "./home.css";

/** Dev only: /?spray-debug shows the sprayPace tuning overlay (never shipped). */
const SprayDebug =
  import.meta.env.DEV && new URLSearchParams(location.search).has("spray-debug")
    ? lazy(() => import("../spray/SprayDebug"))
    : null;

/** The tech papers' lists, back to front (Figma "Group 123", "Group 124"). */
const TECH_PAPERS = [
  ["Python", "TypeScript", "C#", "SQL"],
  ["React", "Node.js", ".NET"],
];

/** The glass card's lines, in groups a blank line apart (Figma 517:34). */
const GLASS_LINES = [
  ["Computer Engineering @ UBC"],
  ["UBC Sailbot", "UBC Third Quadrant Design", "prev. @ EnerSys"],
  ["Open to summer/fall 2027 opportunities :)"],
];

/**
 * Home (Figma "Home Page Final", 1767×1024): "Matthew Lam" over the centre
 * card (the Map card, pinned open: keychain/MapBox.tsx variant="home"), the
 * social glyphs and sound toggle beside an orange cat, the Vancouver skyline,
 * taped photos (HomePhotos.tsx, paper/PaperSheet.tsx), two faded tech papers
 * bleeding off the top, and "who?" sprayed in orange under a glass card that
 * lists the experiences and links to Experience. The skyline and "who?"
 * replay on click.
 *
 * The intro on load (chrome/intro.ts) reveals the pieces and opens the card;
 * every later visit shows them finished. Placement is home.css.
 */
export default function Home() {
  const [home, setHome] = useState<HTMLElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glassRef = useRef<HTMLAnchorElement>(null);
  const glassCanvasRef = useRef<HTMLCanvasElement>(null);
  const skylineRef = useRef<HTMLDivElement>(null);
  const [cardOpen, setCardOpen] = useState(isHomeCardOpen);

  useEffect(() => onHomeCardOpen(() => setCardOpen(true)), []);

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
      if (alive) teardown = m.attachHomeGlass(card, glassCanvasRef.current!, engine);
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
    <div ref={setHome} className="home">
      {/* The tech papers (Figma "Group 123/124"), bleeding off the top edge. */}
      {TECH_PAPERS.map((lines, i) => (
        <div key={i} className={`home__tech home__tech--${i}`}>
          <ul className="home__tech-list">
            {lines.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </div>
      ))}

      <h1 className="home__name">Matthew Lam</h1>
      <div className="home__card">
        <MapBox variant="home" open={cardOpen} />
      </div>

      <HomePhotos />

      {/* A click sprays it again (spray/who.ts, user request). */}
      <div className="home__who" data-clickable data-cursor="Spray" onClick={respray}>
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
            } as React.CSSProperties
          }
        />
        {home && SprayDebug && (
          <Suspense>
            <SprayDebug glass={home.querySelector<HTMLElement>(".home__who")!} />
          </Suspense>
        )}
      </div>

      {/* The glass card over "who?" (Figma "Rectangle 157"): goes to Experience. */}
      <a
        ref={glassRef}
        className="home__glass"
        href="/experience"
        data-cursor="Read More"
        onClick={(e) => onNavClick(e, "/experience")}
        onPointerEnter={(e) => {
          if (e.pointerType === "touch") return;
          play("link.hover");
          prefetchRoute("/experience");
        }}
        onFocus={() => prefetchRoute("/experience")}
      >
        <canvas ref={glassCanvasRef} className="home__glass-canvas" aria-hidden="true" />
        {GLASS_LINES.map((group, i) => (
          <p key={i}>
            {group.map((l, j) => (
              <span key={j}>{l}</span>
            ))}
          </p>
        ))}
      </a>

      {/* The intro draws it the first time (chrome/intro.ts); a click redraws it. */}
      <DrawnCat className="home__cat" />
      <SocialLinks className="home__social">
        <MuteToggle />
      </SocialLinks>
      {/* The skyline drawn on its taped sheet (Figma "Rectangle 154"). */}
      <div className="home__sky">
        <PaperSheet sheet={SKY_SHEET} placed />
        {/* A click draws it again (skylineDraw.ts). */}
        <div ref={skylineRef} className="home__skyline" data-clickable data-cursor="Draw" aria-hidden="true" />
        <PaperSheet sheet={SKY_TAPE} placed />
      </div>
    </div>
  );
}
