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
import { POSTER_SHEETS, SKY_SHEET, SKY_TAPE } from "./paper/sheets";
import "./home.css";

/** Dev only: /?spray-debug shows the sprayPace tuning overlay (never shipped). */
const SprayDebug =
  import.meta.env.DEV && new URLSearchParams(location.search).has("spray-debug")
    ? lazy(() => import("../spray/SprayDebug"))
    : null;

/**
 * Home (Figma "Home Page Final", 1767×1024): "Matthew Lam" over the centre
 * card (the Map card, pinned open: keychain/MapBox.tsx variant="home"), the
 * social glyphs and sound toggle beside an orange cat, the Vancouver skyline,
 * taped photos (HomePhotos.tsx), two faded project posters bleeding off the
 * corners (all paper: paper/PaperSheet.tsx), and "who?" sprayed in orange. The skyline and "who?" replay on click.
 *
 * The intro on load (chrome/intro.ts) reveals the pieces and opens the card;
 * every later visit shows them finished. Placement is home.css.
 */
export default function Home() {
  const [home, setHome] = useState<HTMLElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const skylineRef = useRef<HTMLDivElement>(null);
  const [cardOpen, setCardOpen] = useState(isHomeCardOpen);

  useEffect(() => onHomeCardOpen(() => setCardOpen(true)), []);

  useEffect(() => {
    const engine = new SprayEngine(canvasRef.current!);
    const detach = attachWho(engine);
    return () => {
      detach();
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
      <PaperSheet sheet={POSTER_SHEETS[0]} className="home__poster home__poster--top" />
      <PaperSheet sheet={POSTER_SHEETS[1]} className="home__poster home__poster--bottom" />

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
