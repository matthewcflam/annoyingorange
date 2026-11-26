/**
 * EVERY duration, delay, ease and motion constant lives here (CLAUDE.md rule).
 * Units: seconds for anything GSAP or Web Audio uses, unless the name ends in
 * `_MS` or `_PX`. Values come from docs/spec.md; section numbers are noted.
 */

/** Font readiness (§5.4). */
export const FONTS = {
  /** Never hang on a failed font. */
  TIMEOUT_MS: 2000,
} as const;

/** The app fades in once fonts are ready (App.tsx). */
export const APP = {
  FADE_IN: 0.3,
} as const;

/** Intro timeline on load (chrome/intro.ts). Positions are seconds from the
 *  moment fonts are ready (the app's fade-in starts then too). */
export const INTRO = {
  /** whenPageShown() resolves here. */
  PAGE_SHOWN: 0,
  // ---- Home (Figma "Home Page Final"; chrome/intro.ts) ----
  /** "Matthew Lam" fades up. */
  NAME_IN: 0.25,
  NAME_IN_DURATION: 0.5,
  NAME_IN_EASE: "power2.out",
  /** The centre card rushes open (its flow is MAP_BOX.OPEN / OPEN_EASE). */
  CARD_OPEN: 0.45,
  /** The social glyphs fade up. */
  ICONS_IN: 1.0,
  FADE_DURATION: 0.6,
  FADE_EASE: "power1.out",
  /** The cat draws itself (like the footer's). */
  CAT_IN: 0.9,
  CAT_DRAW: 1.6,
  CAT_DRAW_EASE: "power2.inOut",
  /** TODO(open-question #1): deep link — the requested page fades in
   *  instead of the home sequence. */
  DEEP_LINK_FADE: 0.4,
} as const;

/** Home's skyline redraws on click (pages/skylineDraw.ts, user request): from
 *  the peak down the ridges, then the city top to bottom. Distances are the
 *  SVG's own px (664×143 at the reference size). Seconds. */
export const SKYLINE = {
  /** Ridge lines start this much later per px their near end is from the peak. */
  MOUNTAIN_S_PER_PX: 0.003,
  /** The city starts this long after the peak… */
  CITY_START: 0.3,
  /** …then each path later per px its top is below the city's top… */
  CITY_S_PER_PX: 0.012,
  /** …and per px it is out to the side of the peak. */
  CITY_S_PER_PX_X: 0.0015,
  /** Each line's own draw: its length × this, clamped. */
  SEG_S_PER_PX: 0.006,
  SEG_MIN: 0.15,
  SEG_MAX: 0.7,
  SEG_EASE: "power1.inOut",
  /** The redraw plan is measured in idle time (at most this late, ms). */
  PLAN_IDLE_TIMEOUT_MS: 500,
  PLAN_IDLE_FALLBACK_MS: 50,
} as const;

/** The other pages' code is fetched once the browser is idle after load
 *  (lib/assets.ts prefetchPages), at most this late (ms). */
export const PREFETCH = {
  IDLE_TIMEOUT_MS: 3000,
  IDLE_FALLBACK_MS: 1000,
} as const;

/** "who?" spray engine (§7.2). Distances are mockup px (the 1767×1024 frame),
 *  which are also the units of who-spray.svg. Since "Home Page Final" the word
 *  is 213 wide with a 10px stroke (it was 910 wide, 30px), so every spread
 *  below is a third of its old value, the dots are ~0.6×, and the flow keeps
 *  about the same paint per area of stroke. */
export const SPRAY = {
  // The nozzle's speed, the lifts and the lead (so the spray's length) are
  // set per segment in config/sprayPace.ts, shaped by spray/paceModel.ts.
  /** Max distance between stamps so fast moves don't leave gaps. */
  STEP_PX: 2,
  /** Paint the can emits, in dots per second of stroke. Flow is constant, so
   *  slow parts of a stroke get heavier paint per px (density ∝ 1/speed), and
   *  a slower sprayPace means more paint overall. (18000 before the pace
   *  table; 21000 kept the same total paint at its starting values; 6000
   *  for the smaller "Home Page Final" word.) */
  FLOW_DOTS_PER_S: 6000,
  /** Dots per stamp are clamped to this range. */
  DOTS_MIN: 30,
  DOTS_MAX: 80,
  /** Core σ ≈ 2.5px so ±2σ ≈ the 10px guide stroke. */
  CORE_SIGMA_PX: 2.5,
  CORE_DOT_RADIUS_PX: [0.4, 1.1],
  CORE_ALPHA: [0.45, 0.9],
  OVERSPRAY_SIGMA_PX: 6,
  /** Share of each stamp's dots that are overspray. */
  OVERSPRAY_SHARE: 0.2,
  OVERSPRAY_DOT_RADIUS_PX: [0.3, 0.7],
  OVERSPRAY_ALPHA: [0.08, 0.3],
  /** 1 in N stamps spits a larger droplet. */
  SPIT_CHANCE: 1 / 40,
  SPIT_SIGMA_PX: 4,
  SPIT_RADIUS_PX: [0.9, 1.6],
  /** Chance that a stroke end grows a drip (the nozzle lingers there). */
  DRIP_CHANCE: 0.35,
  /** At most this many drips per spray. */
  DRIP_MAX: 2,
  DRIP_DURATION: 1.0,
  DRIP_EASE: "power2.out",
  DRIP_LENGTH_PX: [5, 13],
  DRIP_WIDTH_PX: [0.9, 1.3],
  /** Canvas margin around the 221×99 guide box, for overspray and drips. */
  CANVAS_PAD_PX: 20,
  /** Hiss gain smoothing (setTargetAtTime time constant). */
  HISS_TIME_CONSTANT: 0.015,
  /** Hiss level (0–1 of its max) at zero nozzle speed; full at peak speed. */
  HISS_FLOOR: 0.4,
} as const;

/** The "email copied" toasts (home's glyphs, the Connections card;
 *  chrome/useToast.ts): rise and fade in, hold, fade out. */
export const TOAST = {
  IN: 0.25,
  EASE: "power2.out",
  RISE_PX: 6,
  HOLD: 1.6,
  OUT: 0.4,
} as const;

/**
 * Page transition between pages (transition/pageTransition.ts), copied from
 * 2xa.studio: a cover dithers in over everything, "Now arriving at: <name>"
 * scramble-types on it, the page swaps underneath, then the cover dithers away
 * bottom to top. Every page is light, so the cover is always dark.
 * Defaults are 2xa's own values.
 */
export const TRANSITION = {
  /** Cover fills in (progress 0 → 1). expo.out: ~90% covered by ~0.2s. Was 1 (2xa). */
  SHOW: 0.6,
  SHOW_EASE: "expo.out",
  /** Cover stays solid after the page swap, before clearing. */
  HOLD: 0.5,
  /** The cover's WebGL is set up once the browser is idle after load (or
   *  after this long at the latest; at once if a transition starts first). */
  INIT_IDLE_TIMEOUT_MS: 2000,
  /** Without requestIdleCallback (Safari before 18). */
  INIT_IDLE_FALLBACK_MS: 500,
  /** Cover clears (progress 1 → 0). expo.out: mostly gone by ~0.4s. Was 3 (2xa). */
  HIDE: 1.5,
  HIDE_EASE: "expo.out",
  /** Input unlocks once the clearing cover's progress drops below this. */
  UNLOCK_PROGRESS: 0.05,

  // ---- Dither shader (2xa's uniforms) ----
  /** Simplex noise frequency of the wipe edge (aspect-corrected). */
  NOISE_FREQ: 0.5,
  /** How far the noise pushes the edge, in screen heights. */
  NOISE_STRENGTH: 0.8,
  /** Half-width of the dithered band, in screen heights. Wider = more dots. */
  EDGE_SMOOTH: 1.0,
  /** Bayer dither cell, device px. The cover canvas renders one pixel per cell. */
  DITHER_PX: 3,
  /** No WebGL (or the context was lost): the cover fades in over SHOW × this
   *  and out over HIDE × FALLBACK_HIDE_SHARE instead of dithering. */
  FALLBACK_SHOW_SHARE: 0.3,
  FALLBACK_HIDE_SHARE: 0.15,
  /** Optional chunky pixelation of the whole field, CSS px (0 = off). */
  PIXEL_SIZE: 0,
  MAX_DPR: 2,

  // ---- Title scramble (2xa's typer) ----
  TITLE_FPS: 30,
  /** Seconds to type the title in (and again out), before the per-char 1% stretch. Was 1 (2xa). */
  TITLE_SECONDS: 0.6,
  /** Scramble variants each character passes through on its way in/out. */
  TITLE_CYCLES: 3,
  /** Fraction of the type-in spent scrambling (the rest is staggered starts). */
  TITLE_CYCLE_LENGTH: 0.5,
  /** Each character adds this fraction to the type-in's length (2xa's). */
  TITLE_STRETCH_PER_CHAR: 0.01,
  /** Characters start along this CSS cubic-bezier (2xa's), snapped to
   *  START_SNAP; each one's progress per frame snaps to PROGRESS_SNAP. */
  TITLE_START_CURVE: [0, 0.75, 0.75, 0] as const,
  TITLE_START_SNAP: 0.05,
  TITLE_PROGRESS_SNAP: 0.1,

  /** Reduced motion: the cover just fades in and out. */
  REDUCED_FADE: 0.2,

  // ---- Under the cover ----
  /** The page swap waits up to this long for the next page's images (§10.3). */
  PRELOAD_MAX_MS: 800,
} as const;

/** Scroll reveals on the station pages (lib/scrollReveal.ts). Seconds unless noted. */
/** Scroll reveal (lib/scrollReveal.ts; only the station footer uses it):
 *  each element fades up once as it enters the window. Rise in mockup px. */
export const REVEAL = {
  Y: 24,
  DURATION: 0.8,
  EASE: "power3.out",
  /** Between elements that enter together (the first screen cascades). */
  STAGGER: 0.06,
  /** After the page starts to appear, before the first screen reveals. */
  DELAY: 0.2,
  /** Reveal once this fraction of an element is in the window. (A fraction,
   *  not a margin above the bottom edge: elements at the page's foot, like
   *  the footer, could never scroll past such a line.) */
  THRESHOLD: 0.25,
} as const;

/**
 * The Map box, top-right on station pages (keychain/MapBox.tsx; Figma
 * "Portfolio" → "Portfolio - Map Expanded"). Opening, the blue box flows out
 * like poured liquid (soft corners, the moving edges bowed outward, width
 * leading height), then hardens into the square-cornered card, and only then
 * its rows appear. Sizes are in tokens (global.css --map-*).
 */
export const MAP_BOX = {
  // ---- Flow (one rush, like water: no overshoot, never outside the new box) ----
  /** The fill runs out from the top-right corner in one tween. */
  OPEN: 0.55,
  OPEN_EASE: "expo.out",
  /** Height starts this fraction of the tween after width, so the front runs
   *  diagonally down and left. */
  H_LAG: 0.12,
  /** Each moving edge bows toward where it is going by this fraction of the
   *  distance it has left (0 on arrival; above 2 it would cross the edge). */
  FRONT_BOW: 0.7,
  /** The leading corners round up to this while moving, square on arrival. */
  FRONT_RADIUS_PX: 26,
  // ---- Text ----
  /** Each row starts as the water reaches it, at least this far apart. */
  ROW_STAGGER: 0.04,
  DOT_POP: 0.3,
  DOT_POP_EASE: "power3.out",
  /** Each label fades in as its row is reached (user request: was typed). */
  LABEL_FADE: 0.3,
  LABEL_FADE_EASE: "power3.out",
  // ---- Close (drains back to the corner, same rule, edges bow inward) ----
  CLOSE: 0.32,
  CLOSE_EASE: "power3.inOut",
  // ---- Hover (mouse: the box opens on hover; touch and keyboard still click) ----
  /** How long the pointer rests on "Map" before it opens (skips fly-overs). */
  HOVER_OPEN_DELAY: 0.06,
  /** How long the pointer can be off the card before it closes. */
  HOVER_CLOSE_DELAY: 0.25,
} as const;

/** The project poster beside the project list (pages/projects/ProjectList.tsx).
 *  It flows like the Map card: the flow durations and eases are MAP_BOX's. */
export const PROJECT_POSTER = {
  /** How long the pointer can be off the list before the poster drains. */
  HOVER_CLOSE_DELAY: 0.25,
  /** The fill (user request: nearly instant; the Map card's is MAP_BOX.OPEN). */
  OPEN: 0.25,
  /** The text fades in as the water reaches its first line. */
  TEXT_FADE: 0.12,
  TEXT_FADE_EASE: "power3.out",
} as const;

/** Project pages (pages/projects/). */
export const PROJECT = {
  /** A click in the project list glides the page until that project sits
   *  mid-screen. */
  SCROLL_TO: 1.1,
  SCROLL_TO_EASE: "expo.inOut",
} as const;

/** The footer cat (chrome/DrawnCat.tsx) draws itself when it scrolls into
 *  view, and again on a click. */
export const CAT = {
  DRAW: 2.2,
  DRAW_EASE: "power2.inOut",
  /** Draws once this fraction of it is in the window. */
  VIEW_THRESHOLD: 0.3,
} as const;

/** Project media (pages/projects/Media.tsx): a collage piece expands to a
 *  centred player over the dimmed page. */
export const MEDIA = {
  /** The player's width, as a fraction of the window's (at the tile's aspect
   *  ratio; never smaller than the tile, and shrunk if it would reach Close or
   *  the carousel arrows). */
  PLAYER_WIDTH: 0.6,
  /** Space kept between the player and Close / the arrows, in project px
   *  (× projectScale()). */
  PLAYER_GAP_PX: 24,
  OPEN: 0.7,
  OPEN_EASE: "expo.out",
  CLOSE: 0.5,
  CLOSE_EASE: "expo.out",
  /** The page-coloured backdrop behind the growing tile. */
  BACKDROP: 0.3,
  /** Expanded: switching items with the arrows (←/→). The old item slides
   *  out and fades as the new one slides in from the side it came from. */
  SLIDE: 0.45,
  SLIDE_EASE: "expo.out",
  /** How far an item slides, in project px (× projectScale()). */
  SLIDE_OFFSET_PX: 80,
} as const;

/** Sound engine (§9). */
export const AUDIO = {
  /** After sound is first turned on, the remaining placeholder sounds are
   *  synthesized when the browser is idle, or after this long at the latest. */
  SYNTH_IDLE_TIMEOUT_MS: 1000,
  /** Without requestIdleCallback (Safari before 18). */
  SYNTH_IDLE_FALLBACK_MS: 200,
  /** ± playbackRate variation per play. */
  RATE_VARIATION: 0.05,
  /** ± gain variation per play. */
  GAIN_VARIATION: 0.1,
  DEFAULT_VOICE_LIMIT: 4,
  VOICE_STEAL_FADE: 0.01,
  /** A stopped source runs this long past its fade, so it ends at silence. */
  STOP_TAIL: 0.005,
  MUTE_RAMP: 0.05,
  LIMITER: { threshold: -6, ratio: 20, attack: 0.003, release: 0.1 },
} as const;

/** Smooth wheel scrolling (Lenis, lib/scroll.ts). Touch stays native. */
export const SCROLL = {
  /** Fraction of the remaining distance covered per frame: lower = floatier. */
  LERP: 0.2,
  WHEEL_MULTIPLIER: 1,
  /** Lenis stops ticking this many frames after its glide ends. */
  IDLE_FRAMES: 2,
} as const;

/** The cursor (chrome/Cursor.tsx): a dot that opens into a ring over
 *  anything clickable. Sizes in screen px (it doesn't scale with the frame). */
export const CURSOR = {
  DOT_PX: 14,
  /** The dot grows into this ring over anything clickable (user request). */
  RING_PX: 24,
  RING_STROKE_PX: 2,
  /** Dot ↔ ring. */
  GROW: 0.2,
  GROW_EASE: "power3.out",
  /** The action label (data-cursor): its corner sits this far right/below
   *  the pointer (flipped left/up near the window's edges). Screen px. */
  LABEL_OFFSET_X: 18,
  LABEL_OFFSET_Y: 18,
  /** Kept this far from the window's edges before it flips. */
  EDGE_PAD: 8,
  /** Dot → label pop, and back. */
  LABEL_IN: 0.22,
  LABEL_OUT: 0.15,
  LABEL_EASE: "power3.out",
  /** The label grows from this scale at the pointer corner. */
  LABEL_FROM_SCALE: 0.6,
} as const;

/** The scroll thumb (chrome/ScrollBar.tsx) that replaces the native scrollbar
 *  on mouse devices. Display only; shows while scrolling. Sizes in screen px. */
export const SCROLLBAR = {
  WIDTH_PX: 4,
  /** Gap from the right and top/bottom edges. */
  INSET_PX: 3,
  MIN_THUMB_PX: 40,
  OPACITY: 0.5,
  FADE_IN: 0.15,
  FADE_IN_EASE: "power2.out",
  FADE_OUT: 0.4,
  FADE_OUT_EASE: "power2.in",
  /** Seconds after the last scroll frame before it fades out. */
  IDLE: 0.8,
} as const;

/** Home's paper texture, baked into the tape and skyline-sheet images
 *  at build time (scripts/paperBake.ts, the `paper*` directives in
 *  vite.config.ts): flat, matte paper (user request: no glass, no blur, no
 *  lighting). Restart the dev server after changing these. The drop shadows
 *  are CSS (--paper-shadow* in tokens.css). */
export const PAPER = {
  /** Paper fibre: luminance wobble (± fraction), on the tape and the
   *  skyline's sheet. */
  FIBRE: 0.035,
} as const;

/**
 * Home's glass card over "who?" (pages/glass/glassRenderer.ts). The first
 * seven are Figma's Glass effect on "Rectangle 157" as set in the file (Plugin
 * API: radius 4, refraction 0.8, depth 20, light -45° at 0.8, dispersion 0.5,
 * splay 0); lengths are frame px. Figma's shader isn't public: the gains below
 * map them onto the figma_glass recreation (MIT) and were calibrated against a
 * 4x Figma render (design/figma-glass/, /?glass-lab, scripts/glassDiff.mjs).
 */
export const GLASS = {
  FROST: 4,
  REFRACTION: 0.8,
  DEPTH: 20,
  LIGHT_ANGLE: -45,
  LIGHT_INTENSITY: 0.8,
  DISPERSION: 0.5,
  SPLAY: 0,
  /** Edge shift = lens × DEPTH × REFRACTION × SHIFT_GAIN (frame px). */
  SHIFT_GAIN: 0.65,
  /** R / B sample at shift × (1 ∓ DISPERSION × DISPERSION_GAIN). */
  DISPERSION_GAIN: 0.15,
  /** Gaussian sigma = FROST × FROST_SCALE (frame px). */
  FROST_SCALE: 0.42,
  /** The light, measured off Figma's render: over the bevel (t²) the edge
   *  facing LIGHT_ANGLE darkens by SHADE_GAIN × LIGHT_INTENSITY × (n·L)^SHADE_POWER
   *  (−8/255 at the top-left corner), the edge facing away brightens by
   *  GLOW_GAIN × LIGHT_INTENSITY × (−n·L)^GLOW_POWER (+2/255); side-on, nothing. */
  SHADE_GAIN: 0.044,
  SHADE_POWER: 1.36,
  GLOW_GAIN: 0.011,
  GLOW_POWER: 0.5,
  /** Device pixel ratio cap for the card canvas. */
  MAX_DPR: 2,
} as const;
