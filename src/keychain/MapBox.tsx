import { useEffect, useLayoutEffect, useRef } from "react";
import { gsap } from "../lib/gsap";
import { prefersReducedMotion } from "../lib/motion";
import { useRoute } from "../lib/router";
import { navLinkProps } from "../lib/navLink";
import { routeFor, STATIONS } from "../config/routes";
import { MAP_BOX as M } from "../config/timings";
import { emptyShape, flowShape, runFlow, shapePath, snapShape } from "../lib/waterFlow";
import { useTimer } from "../lib/useTimer";
import "./mapbox.css";

/** The rows: Home, then the stations in line order. */
const ROWS = [
  { id: "home", label: "Home", path: "/" },
  ...STATIONS.map((s) => ({ id: s.id as string, label: s.label, path: s.path })),
];

/**
 * The Map box, top-right on station pages (Figma "Portfolio" and "Portfolio -
 * Map Expanded"): a blue box reading "Map" that opens into the site's
 * navigation, a card of stations with the current one's dot in orange.
 *
 * Opening (MAP_BOX): the blue rushes out from the corner like water in one go
 * and fills the card without passing its edges (`flowShape`); each row appears
 * as the water reaches it: the dot pops and the label fades in.
 * Hovering a row turns its dot and label orange (mapbox.css; no sound).
 * The blue is one SVG path redrawn from a tweened shape; the box's sizes come
 * from CSS (global.css --map-*), read back from the DOM.
 *
 * `variant="home"`: home's centre card (Figma "Home Page Final"), the same
 * card at its own size (mapbox.css). Home drives `open` (the intro opens it
 * and it stays open), so "Map" is a plain label and nothing closes it: no
 * hover, Escape or outside press.
 */
export default function MapBox({
  open,
  onOpenChange,
  variant = "corner",
}: {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  variant?: "corner" | "home";
}) {
  const pinned = variant === "home";
  const route = useRoute();
  // Home has no station: its own row is the current one there.
  const current = routeFor(route).station ?? "home";
  const boxRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const toggleRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const dotRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const labelRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const shape = useRef(emptyShape());
  const tl = useRef<gsap.core.Timeline | null>(null);
  const first = useRef(true);

  const draw = () => pathRef.current!.setAttribute("d", shapePath(shape.current));
  const closedSize = () => ({ w: toggleRef.current!.offsetWidth, h: toggleRef.current!.offsetHeight });
  const openSize = () => ({ w: panelRef.current!.offsetWidth, h: panelRef.current!.offsetHeight });

  const setRows = (shown: boolean) => {
    gsap.set(dotRefs.current, { scale: shown ? 1 : 0 });
    gsap.set(labelRefs.current, { opacity: shown ? 1 : 0 });
  };

  // Open / close.
  useLayoutEffect(() => {
    const s = shape.current;
    const target = open ? openSize() : closedSize();
    tl.current?.kill();
    if (first.current || prefersReducedMotion()) {
      first.current = false;
      snapShape(s, target);
      draw();
      setRows(open);
      return;
    }
    const duration = open ? M.OPEN : M.CLOSE;
    const flow = flowShape(s, target, gsap.parseEase(open ? M.OPEN_EASE : M.CLOSE_EASE));
    const t = gsap.timeline();
    tl.current = t;
    // The text cuts out on close; on open it waits for the water.
    setRows(false);
    t.add(runFlow(flow, duration, draw), 0);
    if (open) {
      // Each row starts as the front reaches it: the label (right, by the
      // corner) when the height passes the row's middle, the dot (left) once
      // the width has reached it too.
      const panel = panelRef.current!.getBoundingClientRect();
      let prevRow = -Infinity;
      let prevDot = -Infinity;
      labelRefs.current.forEach((el, i) => {
        const dot = dotRefs.current[i]!.getBoundingClientRect();
        const row = el!.parentElement!.getBoundingClientRect();
        const rowAt = Math.max(flow.reach("h", row.top + row.height / 2 - panel.top) * duration, prevRow + M.ROW_STAGGER);
        const dotAt = Math.max(rowAt, flow.reach("w", panel.right - (dot.left + dot.width / 2)) * duration, prevDot + M.ROW_STAGGER);
        prevRow = rowAt;
        prevDot = dotAt;
        t.to(el, { opacity: 1, duration: M.LABEL_FADE, ease: M.LABEL_FADE_EASE }, rowAt);
        t.to(dotRefs.current[i], { scale: 1, duration: M.DOT_POP, ease: M.DOT_POP_EASE }, dotAt);
      });
    }
    return () => void t.kill();
  }, [open]);

  // The sizes are CSS (they change on the compact layout): refit on resize.
  useEffect(() => {
    const fit = () => {
      tl.current?.progress(1);
      snapShape(shape.current, open ? openSize() : closedSize());
      draw();
    };
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [open]);

  const openNow = useRef(open);
  useLayoutEffect(() => {
    openNow.current = open;
  }, [open]);
  const setOpen = (v: boolean) => {
    if (pinned || v === openNow.current) return;
    openNow.current = v;
    onOpenChange?.(v);
  };

  // Mouse hover opens and closes it, each after a short delay (MAP_BOX.HOVER_*):
  // the open card covers the closed box, so the pointer can run straight from
  // "Map" down to a row without leaving it.
  const hoverTimer = useTimer();
  const hoverTo = (v: boolean) => hoverTimer.set(() => setOpen(v), v ? M.HOVER_OPEN_DELAY : M.HOVER_CLOSE_DELAY);

  // Escape or a press outside closes it.
  useEffect(() => {
    if (!open || pinned) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      hoverTimer.clear();
      setOpen(false);
      toggleRef.current?.focus();
    };
    const onDown = (e: PointerEvent) => {
      if (!boxRef.current!.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  });

  /** The last press's pointer type: a mouse click on "Map" never closes the
   *  card it hovered open; touch and keyboard (detail 0) toggle. */
  const pressType = useRef("");

  return (
    <div
      ref={boxRef}
      className="map-box interactive"
      data-open={open || undefined}
      data-variant={variant}
      onPointerEnter={pinned ? undefined : (e) => e.pointerType === "mouse" && hoverTo(true)}
      onPointerLeave={pinned ? undefined : (e) => e.pointerType === "mouse" && hoverTo(false)}
    >
      <svg className="map-box__shape" viewBox="0 0 1 1" aria-hidden="true">
        <path ref={pathRef} />
      </svg>
      {pinned ? (
        <span
          ref={(el) => {
            toggleRef.current = el;
          }}
          className="map-box__toggle"
          aria-hidden="true"
        >
          <span className="map-box__title">Map</span>
        </span>
      ) : (
        <button
          ref={(el) => {
            toggleRef.current = el;
          }}
          type="button"
          className="map-box__toggle"
          aria-expanded={open}
          aria-controls="map-box-nav"
          onPointerDown={(e) => (pressType.current = e.pointerType)}
          onClick={(e) => {
            hoverTimer.clear();
            setOpen(e.detail > 0 && pressType.current === "mouse" ? true : !open);
          }}
        >
          <span className="map-box__title">Map</span>
        </button>
      )}
      <nav
        ref={panelRef}
        id={pinned ? undefined : "map-box-nav"}
        className="map-box__panel"
        aria-label={pinned ? "Map" : "Stations"}
        inert={!open}
      >
        {ROWS.map((row, i) => {
          const isCurrent = row.id === current;
          // The current station's row goes nowhere; the others are silent page links.
          const link = isCurrent ? { href: row.path, onClick: (e: { preventDefault(): void }) => e.preventDefault() } : navLinkProps(row.path, { sound: false });
          return (
            <a
              key={row.id}
              className="map-box__row"
              aria-current={isCurrent ? "page" : undefined}
              aria-label={row.label}
              {...link}
            >
              <span
                ref={(el) => {
                  dotRefs.current[i] = el;
                }}
                className="map-box__dot"
                data-here={isCurrent || undefined}
              />
              <span
                ref={(el) => {
                  labelRefs.current[i] = el;
                }}
                className="map-box__label"
                aria-hidden="true"
              >
                {row.label}
              </span>
            </a>
          );
        })}
      </nav>
    </div>
  );
}
