import { useEffect, useLayoutEffect, useRef } from "react";
import { gsap } from "../lib/gsap";
import { prefersReducedMotion } from "../lib/motion";
import { onNavClick, useRoute } from "../lib/router";
import { prefetchRoute } from "../lib/assets";
import { routeFor, STATIONS } from "../config/routes";
import { MAP_BOX as M } from "../config/timings";
import { flowShape, shapePath, type Shape } from "../lib/waterFlow";
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
 */
export default function MapBox({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const route = useRoute();
  const current = routeFor(route).station;
  const boxRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const dotRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const labelRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const shape = useRef<Shape>({ w: 0, h: 0, bl: 0, bb: 0, r: 0 });
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
      Object.assign(s, target, { bl: 0, bb: 0, r: 0 });
      draw();
      setRows(open);
      return;
    }
    const duration = open ? M.OPEN : M.CLOSE;
    const flow = flowShape(s, target, gsap.parseEase(open ? M.OPEN_EASE : M.CLOSE_EASE));
    const drive = { p: 0 };
    const t = gsap.timeline();
    tl.current = t;
    // The text cuts out on close; on open it waits for the water.
    setRows(false);
    t.to(drive, {
      p: 1,
      duration,
      ease: "none",
      onUpdate: () => {
        flow(drive.p);
        draw();
      },
    }, 0);
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
      Object.assign(shape.current, open ? openSize() : closedSize());
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
    if (v === openNow.current) return;
    openNow.current = v;
    onOpenChange(v);
  };

  // Mouse hover opens and closes it, each after a short delay (MAP_BOX.HOVER_*):
  // the open card covers the closed box, so the pointer can run straight from
  // "Map" down to a row without leaving it.
  const hoverTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const hoverTo = (v: boolean) => {
    clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setOpen(v), (v ? M.HOVER_OPEN_DELAY : M.HOVER_CLOSE_DELAY) * 1000);
  };
  useEffect(() => () => clearTimeout(hoverTimer.current), []);

  // Escape or a press outside closes it.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      clearTimeout(hoverTimer.current);
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
      onPointerEnter={(e) => e.pointerType === "mouse" && hoverTo(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && hoverTo(false)}
    >
      <svg className="map-box__shape" viewBox="0 0 1 1" aria-hidden="true">
        <path ref={pathRef} />
      </svg>
      <button
        ref={toggleRef}
        type="button"
        className="map-box__toggle"
        aria-expanded={open}
        aria-controls="map-box-nav"
        onPointerDown={(e) => (pressType.current = e.pointerType)}
        onClick={(e) => {
          clearTimeout(hoverTimer.current);
          setOpen(e.detail > 0 && pressType.current === "mouse" ? true : !open);
        }}
      >
        <span className="map-box__title">Map</span>
      </button>
      <nav ref={panelRef} id="map-box-nav" className="map-box__panel" aria-label="Stations" inert={!open}>
        {ROWS.map((row, i) => {
          const isCurrent = row.id === current;
          const enter = () => !isCurrent && prefetchRoute(row.path);
          return (
            <a
              key={row.id}
              href={row.path}
              className="map-box__row"
              aria-current={isCurrent ? "page" : undefined}
              aria-label={row.label}
              onClick={(e) => (isCurrent ? e.preventDefault() : onNavClick(e, row.path))}
              onPointerEnter={(e) => e.pointerType !== "touch" && enter()}
              onFocus={enter}
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
