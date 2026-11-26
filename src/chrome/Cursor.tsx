import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { gsap } from "../lib/gsap";
import { CURSOR } from "../config/timings";
import { prefersReducedMotion } from "../lib/motion";
import { useRoute } from "../lib/router";
import { whenPageShown } from "../lib/pageReveal";
import "./cursor.css";

/** What counts as clickable: the ring shows over these (when they have no label). */
const CLICKABLE = 'a[href]:not([aria-current]), button:not(:disabled), [role="button"], [data-clickable]';
/** Elements that say what a click does (user request): `data-cursor="View Projects"`. */
const LABELLED = "[data-cursor]";

type Mode = "dot" | "ring" | "label";

/**
 * Replaces the native cursor with a dot. Over an element with a
 * `data-cursor` label, the dot gives way to an orange box saying what a click
 * will do ("View Projects", "Copy Email"); over other clickable things (the
 * Map card, the Projects and Experience indexes) it hollows into a ring.
 * Mouse only: touch devices keep the native behaviour. Follows the pointer
 * exactly, with no lag.
 *
 * The dot and the label are separate elements in <body>: the dot is
 * difference-blended, and a shared moving parent would be its own stacking
 * context, isolating the blend from the page.
 */
export default function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const onRouteRef = useRef<() => void>(() => {});
  const route = useRoute();

  useEffect(() => onRouteRef.current(), [route]);

  useEffect(() => {
    const dot = dotRef.current;
    const label = labelRef.current;
    if (!dot || !label || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const dotScale = CURSOR.DOT_PX / CURSOR.RING_PX;
    gsap.set(dot, { scale: dotScale });
    gsap.set(label, { scale: CURSOR.LABEL_FROM_SCALE, autoAlpha: 0 });
    const setDotX = gsap.quickSetter(dot, "x", "px");
    const setDotY = gsap.quickSetter(dot, "y", "px");
    const setLabelX = gsap.quickSetter(label, "x", "px");
    const setLabelY = gsap.quickSetter(label, "y", "px");
    const root = document.documentElement;
    const dur = (s: number) => (prefersReducedMotion() ? 0 : s);

    let mode: Mode = "dot";
    let text = "";
    let shown = false;
    let px = -1;
    let py = -1;
    // The label's size, read once per text change (scale doesn't affect it).
    let lw = 0;
    let lh = 0;
    let flipX = false;
    let flipY = false;
    // A click on a page link: no label until the new page starts to show (it
    // would otherwise ride the transition cover).
    let navigating = false;

    const placeLabel = () => {
      const fx = px + CURSOR.LABEL_OFFSET_X + lw > window.innerWidth - CURSOR.EDGE_PAD;
      const fy = py + CURSOR.LABEL_OFFSET_Y + lh > window.innerHeight - CURSOR.EDGE_PAD;
      if (fx !== flipX || fy !== flipY) {
        flipX = fx;
        flipY = fy;
        label.style.transformOrigin = `${fx ? "100%" : "0"} ${fy ? "100%" : "0"}`;
      }
      setLabelX(fx ? px - CURSOR.LABEL_OFFSET_X - lw : px + CURSOR.LABEL_OFFSET_X);
      setLabelY(fy ? py - CURSOR.LABEL_OFFSET_Y - lh : py + CURSOR.LABEL_OFFSET_Y);
    };

    const setMode = (next: Mode, nextText = "") => {
      if (next === "label" && nextText !== text) {
        text = nextText;
        label.textContent = nextText;
        lw = label.offsetWidth;
        lh = label.offsetHeight;
        placeLabel();
      }
      if (next === mode) return;
      const was = mode;
      mode = next;
      // The dot grows into the hollow ring on every hover, labelled or not
      // (user request); the label sits beside the ring.
      const ring = next !== "dot";
      if (ring !== (was !== "dot")) {
        gsap.to(dot, {
          scale: ring ? 1 : dotScale,
          backgroundColor: ring ? "rgba(255,255,255,0)" : "rgba(255,255,255,1)",
          duration: dur(CURSOR.GROW),
          ease: CURSOR.GROW_EASE,
          overwrite: true,
        });
      }
      if (next === "label" || was === "label") {
        const on = next === "label";
        gsap.to(label, {
          scale: on ? 1 : CURSOR.LABEL_FROM_SCALE,
          autoAlpha: on ? 1 : 0,
          duration: dur(on ? CURSOR.LABEL_IN : CURSOR.LABEL_OUT),
          ease: CURSOR.LABEL_EASE,
          overwrite: true,
        });
      }
    };

    const evaluate = (target: EventTarget | null) => {
      if (!(target instanceof Element)) return setMode("dot");
      const labelled = navigating ? null : target.closest(LABELLED);
      const t = labelled?.getAttribute("data-cursor");
      if (t) return setMode("label", t);
      setMode(target.closest(CLICKABLE) ? "ring" : "dot");
    };
    // Re-read what's under a still pointer (after a click changed it, or a page change).
    const reevaluate = () => {
      if (shown) evaluate(document.elementFromPoint(px, py));
    };

    // Follow the pointer, and show the cursor on the first event that says
    // where it is. pointerover counts: it can arrive before any pointermove
    // (a page loads or changes under a resting mouse), and the label must
    // never show before it has been placed.
    const track = (e: PointerEvent) => {
      px = e.clientX;
      py = e.clientY;
      setDotX(px);
      setDotY(py);
      placeLabel();
      if (!shown) {
        shown = true;
        dot.style.visibility = "visible";
        label.style.visibility = "";
        root.classList.add("has-cursor");
      }
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "mouse") track(e);
    };
    const onOver = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      track(e);
      evaluate(e.target);
    };
    // Left the window: hide until the next move.
    const onOut = (e: PointerEvent) => {
      if (e.relatedTarget) return;
      shown = false;
      dot.style.visibility = "hidden";
      label.style.visibility = "hidden";
    };
    const onClick = (e: MouseEvent) => {
      const link = e.target instanceof Element ? e.target.closest("a[href]") : null;
      if (link && link.getAttribute("href")?.startsWith("/") && !link.hasAttribute("target")) {
        navigating = true;
        setMode("dot");
        return;
      }
      // Labels can change on click (Sound On ↔ Off), and the lightbox opens or closes.
      requestAnimationFrame(reevaluate);
    };
    let alive = true;
    onRouteRef.current = () => {
      if (!navigating) return;
      void whenPageShown().then(() => {
        if (!alive) return;
        navigating = false;
        reevaluate();
      });
    };

    document.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver, { passive: true });
    document.addEventListener("pointerout", onOut, { passive: true });
    document.addEventListener("click", onClick, { passive: true });
    return () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerout", onOut);
      document.removeEventListener("click", onClick);
      alive = false;
      onRouteRef.current = () => {};
      root.classList.remove("has-cursor");
      gsap.killTweensOf([dot, label]);
    };
  }, []);

  return createPortal(
    <>
      <div
        ref={dotRef}
        className="cursor"
        aria-hidden="true"
        style={{ "--cursor-ring": CURSOR.RING_PX, "--cursor-stroke": CURSOR.RING_STROKE_PX } as React.CSSProperties}
      />
      <div ref={labelRef} className="cursor-label" aria-hidden="true" />
    </>,
    document.body,
  );
}
