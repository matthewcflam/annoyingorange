// Fonts first, before anything renders (spec §5.2).
import "@fontsource-variable/inter";
import "@fontsource/nunito/300.css"; // body text, Light (tokens.css --font-text)

import "./config/tokens.css";
import "./global.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { preloadSounds } from "./audio/engine";
import { setTransitionRunner } from "./lib/router";
import { pageTransition } from "./transition/pageTransition";
import { initScroll } from "./lib/scroll";
import { prefetchPages, prefetchRoute, registerRouteAssets } from "./lib/assets";
import { ROUTE_ASSETS } from "./pages/routeAssets";
import { registerRoundedFont } from "./lib/fonts";
import { reloadOnce } from "./lib/reload";

registerRoundedFont();

// A page chunk from an older deploy is gone after a new one: reload (once)
// to pick up the new build instead of failing (Vite's preload error event).
window.addEventListener("vite:preloadError", (e) => {
  if (reloadOnce()) e.preventDefault();
});

// The router owns scrolling (spec §4.3).
history.scrollRestoration = "manual";
initScroll();

// Fetch + decode every sound up front (spec §9.2). No AudioContext until the
// visitor turns sound on (every load starts muted).
void preloadSounds();

setTransitionRunner(pageTransition);

registerRouteAssets(ROUTE_ASSETS);

// A deep link's images (About photos, project heroes) start downloading at once.
prefetchRoute(location.pathname);
// The other pages' code (small chunks), so no transition waits on a fetch.
prefetchPages();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
