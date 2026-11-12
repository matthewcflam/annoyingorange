// Fonts first, before anything renders (spec §5.2).
import "@fontsource/fragment-mono";
import "@fontsource-variable/inter";
import "@fontsource/jersey-25";

import "./config/tokens.css";
import "./global.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { preloadSounds } from "./audio/engine";
import { setTransitionRunner } from "./lib/router";
import { pageTransition } from "./transition/pageTransition";
import { GATE } from "./config/timings";
import { initScroll } from "./lib/scroll";
import { prefetchPages, prefetchRoute } from "./lib/assets";

// Page theme changes fade (only visible on a deep link's gate exit; elsewhere
// they happen under the transition cover).
document.documentElement.style.setProperty("--theme-fade", `${GATE.DEEP_LINK_FADE}s`);

// The router owns scrolling (spec §4.3).
history.scrollRestoration = "manual";
initScroll();

// Fetch + decode every sound up front (spec §9.2). No AudioContext until the
// visitor turns sound on (every load starts muted).
void preloadSounds();

setTransitionRunner(pageTransition);

// A deep link's images (About photos, project heroes) start downloading at once.
prefetchRoute(location.pathname);
// The other pages' code (small chunks), so no transition waits on a fetch.
prefetchPages();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
