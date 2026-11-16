import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap, useGSAP } from "./lib/gsap";
import { waitForFonts } from "./lib/fonts";
import { GATE_UI } from "./config/timings";
import { introTimeline } from "./chrome/intro";
import Outlet from "./pages/Outlet";
import { useRoute } from "./lib/router";
import { prefersReducedMotion } from "./lib/motion";
import TransitionLayer from "./transition/TransitionLayer";
import StationChrome from "./chrome/StationChrome";
import Cursor from "./chrome/Cursor";
import ScrollBar from "./chrome/ScrollBar";
import GridOverlay from "./chrome/GridOverlay";
import { routeFor } from "./config/routes";

/**
 * Layer stack (spec §4.1), bottom to top:
 *   z0  page layer        — swaps per route (home holds its own card,
 *                           glyphs, sound toggle and "who?")
 *   z10 shared chrome     — the Map box (station pages)
 *   z50 transition        — the dither cover and its title, over everything
 *
 * There is no sound gate (user change): once fonts are ready everything
 * mounts and the intro timeline (chrome/intro.ts) reveals it. Sound starts
 * muted; home's toggle turns it on.
 */
export default function App() {
  const [fontsReady, setFontsReady] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const route = useRoute();
  const home = route === "/";
  // A route commits under the transition cover, so the colours swap unseen.
  const theme = routeFor(route).theme;

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    let cancelled = false;
    waitForFonts().then(() => !cancelled && setFontsReady(true));
    return () => {
      cancelled = true;
    };
  }, []);

  useGSAP(
    () => {
      if (!fontsReady) return;
      gsap.fromTo(rootRef.current, { opacity: 0 }, { opacity: 1, duration: GATE_UI.FADE_IN });
      // The intro (§6.5). Runs once, for the route the visitor landed on.
      const tl = introTimeline({
        root: rootRef.current!,
        home: route === "/",
        reduced: prefersReducedMotion(),
      });
      if (import.meta.env.DEV) Object.assign(window, { __intro: tl });
    },
    // Only fontsReady: the intro must not rebuild on a route change.
    { dependencies: [fontsReady], scope: rootRef },
  );

  // Nothing renders until fonts are ready, so no swap can land mid-animation (§5.4).
  return (
    <div ref={rootRef} style={{ opacity: 0 }}>
      {/* Portals into <body>, outside this fading root. */}
      <Cursor />
      <ScrollBar />
      <GridOverlay />
      {fontsReady && (
        <>
          <main className="layer--page">
            <Outlet />
          </main>

          <div className="layer layer--chrome">{!home && <StationChrome />}</div>

          <TransitionLayer />
        </>
      )}
    </div>
  );
}
