import { useLayoutEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { gsap } from "../lib/gsap";
import { play } from "../audio/engine";
import { onScroll } from "../lib/scroll";
import { isCompact, onCompactChange } from "../lib/frame";
import { prefersReducedMotion } from "../lib/motion";
import { EXPERIENCE_EXTRAS } from "../config/timings";
import type { IndexRow } from "../content/experience";

/**
 * The Experience index (Figma "Experience Final"): fixed top-left under
 * "Matthew Lam" (StationLayout's `nav` slot, like the Projects list), columns
 * 1–2, a row per job (logo, name, its year). The row of the job in
 * focus (`active`, lib/useScrollIndex.ts) is black, the others grey; a click
 * glides the page to that job. Compact: it sits under the name and scrolls
 * with the page (station.css).
 *
 * "Extras" (index-only rows, plain and grey) sits in the flow under the jobs,
 * but is translated down to the bottom-left corner of the window; once the
 * page is scrolled to its end it slides up into that place, and back down
 * when the page leaves the end (user request). Compact: always in place.
 */
export default function ExperienceList({
  rows,
  extras,
  active,
  onSelect,
}: {
  rows: IndexRow[];
  extras: IndexRow[];
  active: string;
  onSelect: (id: string) => void;
}) {
  const extrasRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = extrasRef.current!;
    const root = document.documentElement;
    let docked: boolean | null = null;
    let down = 0;

    // How far down the corner is from the in-flow place (a fixed header, so
    // it depends only on the window size), keeping the grid margin below.
    const measure = () => {
      const y = Number(gsap.getProperty(el, "y"));
      const top = el.getBoundingClientRect().top - y;
      const gap = parseFloat(getComputedStyle(el).marginBottom);
      down = isCompact() ? 0 : Math.max(0, window.innerHeight - gap - el.offsetHeight - top);
    };
    const atEnd = (scroll: number, limit: number) => limit <= 0 || scroll >= limit - EXPERIENCE_EXTRAS.END_PX;
    const update = (end: boolean, animate: boolean) => {
      if (end === docked && animate) return;
      docked = end;
      const y = end ? 0 : down;
      gsap.killTweensOf(el);
      if (animate && !prefersReducedMotion()) {
        gsap.to(el, { y, duration: EXPERIENCE_EXTRAS.SLIDE, ease: EXPERIENCE_EXTRAS.SLIDE_EASE });
      } else gsap.set(el, { y });
    };
    const now = () => atEnd(window.scrollY, root.scrollHeight - window.innerHeight);
    const relayout = () => {
      measure();
      update(now(), false);
    };

    relayout();
    const offScroll = onScroll(({ scroll, limit }) => update(atEnd(scroll, limit), true));
    const offCompact = onCompactChange(relayout);
    // The page's height (photos, fonts, the footer) changes where the end is.
    const ro = new ResizeObserver(() => {
      measure();
      update(now(), true);
    });
    ro.observe(document.body);
    window.addEventListener("resize", relayout);
    return () => {
      offScroll();
      offCompact();
      ro.disconnect();
      window.removeEventListener("resize", relayout);
      gsap.killTweensOf(el);
    };
  }, []);

  return (
    <nav className="experience-list" aria-label="Experience">
      <ul>
        {rows.map((row) => (
          <li key={row.id}>
            <a
              href={`#${row.id}`}
              className="experience-list__link"
              data-active={row.id === active || undefined}
              onClick={(e) => {
                if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                e.preventDefault();
                onSelect(row.id);
              }}
              onPointerEnter={(e) => e.pointerType !== "touch" && play("link.hover")}
            >
              <RowInner row={row} />
            </a>
          </li>
        ))}
      </ul>
      <div className="experience-list__extras" ref={extrasRef}>
        <h2 className="experience-list__heading">Extras</h2>
        <ul>
          {extras.map((row) => (
            <li key={row.id}>
              <span className="experience-list__link" data-static="">
                <RowInner row={row} />
              </span>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

function RowInner({ row }: { row: IndexRow }): ReactNode {
  return (
    <>
      <span className="experience-list__logo" aria-hidden="true">
        <span
          className="experience-list__mark"
          style={{ "--w": row.logo.w, "--h": row.logo.h, "--x": row.logo.x } as CSSProperties}
        >
          <img
            src={row.logo.src}
            alt=""
            data-crop={row.logo.crop ? "" : undefined}
            style={
              row.logo.crop &&
              ({ "--cw": row.logo.crop.w, "--ch": row.logo.crop.h, "--cx": row.logo.crop.x, "--cy": row.logo.crop.y } as CSSProperties)
            }
          />
        </span>
      </span>
      <span className="experience-list__name">{row.listName}</span>
      <span className="experience-list__date">{row.listDate}</span>
    </>
  );
}
