import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useTimer } from "../../lib/useTimer";
import { mapRef } from "../../lib/mapRef";
import { gsap } from "../../lib/gsap";
import { prefersReducedMotion } from "../../lib/motion";
import { isCompact } from "../../lib/frame";
import { emptyShape, flowShape, runFlow, shapePath, snapShape } from "../../lib/waterFlow";
import { hoverSound } from "../../audio/engine";
import { isPlainClick } from "../../lib/router";
import { MAP_BOX as M, PROJECT_POSTER as P } from "../../config/timings";
import { PROJECTS, type ProjectSlug } from "../../content/projects";
import { projectPath } from "../../config/routes";
import "./project-list.css";

/**
 * The project list (fixed in columns 1–2), an index of the page: the row of
 * the project in focus (`active`, Projects.tsx) is black, and a click calls
 * `onSelect`, which glides the page to that project. Its poster (Figma
 * "Portfolio Hover", "ReMind Hover", …): while a row is hovered (mouse) or
 * focused (keyboard), that row is black, the others grey, and a box in the
 * project's colour with its tagline hangs right of the list.
 *
 * The poster flows like the Map card (lib/waterFlow.ts, MAP_BOX): out from
 * its top-left corner, right then down; the text fades in as the water
 * reaches it. Row to row, the new colour floods over the old poster (the
 * back path) from the same corner. Leaving the list drains it back to the
 * corner after PROJECT_POSTER.HOVER_CLOSE_DELAY. Silent; no poster on touch
 * or the compact layout (project.css hides it).
 */
export default function ProjectList({ active, onSelect }: { active: ProjectSlug; onSelect: (slug: ProjectSlug) => void }) {
  const [peek, setPeek] = useState<ProjectSlug | null>(null);
  const posterRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<SVGPathElement>(null);
  const frontRef = useRef<SVGPathElement>(null);
  const textRefs = useRef(new Map<ProjectSlug, HTMLDivElement>());
  const back = useRef(emptyShape());
  const front = useRef(emptyShape());
  /** Whose colour the front path holds. */
  const frontSlug = useRef<ProjectSlug | null>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);

  const drawBack = () => backRef.current!.setAttribute("d", shapePath(back.current));
  const drawFront = () => frontRef.current!.setAttribute("d", shapePath(front.current));
  const fill = (path: SVGPathElement, slug: ProjectSlug) => {
    path.style.fill = `var(${PROJECTS.find((p) => p.slug === slug)!.poster.color})`;
  };
  /** A project's poster: the box's CSS size, bigger if its text needs it. */
  const sizeFor = (slug: ProjectSlug) => {
    const box = posterRef.current!;
    const text = textRefs.current.get(slug)!;
    return { w: Math.max(box.offsetWidth, text.offsetWidth), h: Math.max(box.offsetHeight, text.offsetHeight) };
  };
  const texts = () => [...textRefs.current.values()];

  // Hover in / out, with a short grace period off the list.
  const timer = useTimer();
  const show = (slug: ProjectSlug) => {
    timer.clear();
    setPeek(slug);
  };
  const hide = () => timer.set(() => setPeek(null), P.HOVER_CLOSE_DELAY);

  useLayoutEffect(() => {
    tl.current?.kill();
    const s = front.current;
    const text = peek && textRefs.current.get(peek)!;

    if (!peek) {
      // Drain the front back to the corner; the text cuts out.
      gsap.set(texts(), { opacity: 0 });
      snapShape(back.current, { w: 0, h: 0 });
      drawBack();
      if (s.w === 0 && s.h === 0) return;
      if (prefersReducedMotion()) {
        snapShape(s, { w: 0, h: 0 });
        drawFront();
        return;
      }
      const flow = flowShape(s, { w: 0, h: 0 }, gsap.parseEase(M.CLOSE_EASE));
      const drain = gsap.timeline().add(runFlow(flow, M.CLOSE, drawFront));
      tl.current = drain;
      // An unmount mid-drain must not draw into a path that's gone.
      return () => void drain.kill();
    }

    if (isCompact()) return;
    const target = sizeFor(peek);

    if (prefersReducedMotion()) {
      fill(frontRef.current!, peek);
      frontSlug.current = peek;
      snapShape(s, target);
      drawFront();
      gsap.set(texts(), { opacity: 0 });
      gsap.set(text, { opacity: 1 });
      return;
    }

    // A different colour floods over what is there: the front becomes the
    // back, frozen, and the front restarts from the corner. The same colour
    // (back on the row while it drains) carries on from where it is.
    if (frontSlug.current !== peek) {
      if (frontSlug.current && (s.w > 0 || s.h > 0)) {
        fill(backRef.current!, frontSlug.current);
        Object.assign(back.current, s);
      } else {
        snapShape(back.current, { w: 0, h: 0 });
      }
      drawBack();
      snapShape(s, { w: 0, h: 0 });
      fill(frontRef.current!, peek);
      frontSlug.current = peek;
    }

    const flow = flowShape(s, target, gsap.parseEase(M.OPEN_EASE));
    const t = gsap.timeline();
    tl.current = t;
    t.add(
      runFlow(flow, P.OPEN, drawFront, () => {
        snapShape(back.current, { w: 0, h: 0 });
        drawBack();
      }),
      0,
    );

    // The text swaps as the water reaches its first line (cap height ≈ 0.72em).
    const first = text!.firstElementChild as HTMLElement;
    const capBottom = text!.offsetTop + first.offsetTop + 0.72 * parseFloat(getComputedStyle(first).fontSize);
    const textIn = flow.reach("h", capBottom) * P.OPEN;
    const others = texts().filter((el) => el !== text);
    if (Number(gsap.getProperty(text, "opacity")) < 1) {
      t.set(others, { opacity: 0 }, textIn);
      t.fromTo(text, { opacity: 0 }, { opacity: 1, duration: P.TEXT_FADE, ease: P.TEXT_FADE_EASE }, textIn);
    } else {
      gsap.set(others, { opacity: 0 });
    }
    return () => void t.kill();
  }, [peek]);

  // The sizes are CSS: refit on resize.
  useEffect(() => {
    const fit = () => {
      tl.current?.progress(1);
      snapShape(back.current, { w: 0, h: 0 });
      drawBack();
      snapShape(front.current, peek && !isCompact() ? sizeFor(peek) : { w: 0, h: 0 });
      drawFront();
    };
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [peek]);

  return (
    <nav className="project-list" aria-label="Projects" data-peek={peek || undefined}>
      <ul onPointerLeave={(e) => e.pointerType === "mouse" && hide()}>
        {PROJECTS.map((p) => {
          return (
            <li key={p.slug} data-peek={p.slug === peek || undefined}>
              <a
                // A real link (old per-project URL) for a new tab; a plain click scrolls.
                href={projectPath(p.slug)}
                className="project-list__link"
                data-active={p.slug === active || undefined}
                onClick={(e) => {
                  if (!isPlainClick(e)) return;
                  e.preventDefault();
                  onSelect(p.slug);
                }}
                onPointerEnter={(e) => {
                  if (e.pointerType === "touch") return;
                  hoverSound(e);
                  if (e.pointerType === "mouse") show(p.slug);
                }}
                // Keyboard only: a tap or click also focuses the link.
                onFocus={(e) => e.currentTarget.matches(":focus-visible") && show(p.slug)}
                onBlur={hide}
              >
                <span>{p.listTitle}</span>
                <span>{p.category}</span>
                <span>{p.year}</span>
              </a>
            </li>
          );
        })}
      </ul>
      <div ref={posterRef} className="project-poster" aria-hidden="true">
        <svg className="project-poster__shape" viewBox="0 0 1 1">
          <path ref={backRef} />
          <path ref={frontRef} />
        </svg>
        {PROJECTS.map((p) => (
          <div
            key={p.slug}
            ref={mapRef(textRefs, p.slug)}
            className="project-poster__text"
          >
            {p.poster.text.map((lines, i) => (
              <p key={i}>
                {lines.map((line, l) => (
                  <span key={l}>{line}</span>
                ))}
              </p>
            ))}
          </div>
        ))}
      </div>
    </nav>
  );
}
