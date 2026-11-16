import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { gsap } from "../../lib/gsap";
import { onNavClick, takeProjectFocus } from "../../lib/router";
import { whenPageShown } from "../../lib/pageReveal";
import { prefersReducedMotion } from "../../lib/motion";
import { revealOnScroll } from "../../lib/scrollReveal";
import { onScroll, scrollToY } from "../../lib/scroll";
import { isCompact } from "../../lib/frame";
import { projectScale } from "../../lib/tokens";
import { play } from "../../audio/engine";
import { PROJECT } from "../../config/timings";
import { HEROES, PROJECTS, type Project, type ProjectLink, type ProjectSlug } from "../../content/projects";
import Icon from "../../chrome/Icon";
import ResponsivePicture from "../ResponsivePicture";
import MediaTile from "./Media";
import ProjectList from "./ProjectList";
import StationLayout from "../StationLayout";
import "./project.css";

/** The heroes' resting tilt in degrees (Figma: image 109, image 110). Their
 *  boxes and positions are in project.css. */
const HERO_TILT = [-10.4, 4.77];

/** Where the page must scroll to put a project mid-screen: the centre of its
 *  block without the gap below it (its media, or its text if taller). */
function centreOf(el: HTMLElement): number {
  const top = el.getBoundingClientRect().top + window.scrollY;
  const gap = parseFloat(getComputedStyle(el).paddingBottom);
  return top + (el.offsetHeight - gap) / 2 - window.innerHeight / 2;
}

/**
 * /projects (Figma "Project Redesign"): every project on one light page on
 * the 9-column grid (tokens.css --grid-*).
 *
 * Fixed, in the two left columns: "Matthew Lam" (goes home) and the project
 * list, an index: a click glides the page until that project is mid-screen,
 * and the row of the project in focus (the block under the middle of the
 * window) is black. Below: two tilted heroes, then one block per project:
 * TOOLS (columns 1–2, sticky under the list until the next project's TOOLS
 * pushes it out), the text (3–4) and the media (5–8). Then the footer. The
 * shell (the name, the footer) is ../StationLayout.tsx; the Map box top-right
 * is shared chrome (chrome/StationChrome.tsx).
 */
export default function Projects() {
  const rootRef = useRef<HTMLDivElement>(null);
  const blocks = useRef(new Map<ProjectSlug, HTMLElement>());
  const [active, setActive] = useState<ProjectSlug>(PROJECTS[0].slug);
  /** While a list click glides the page, the highlight stays on its target. */
  const pinned = useRef(false);
  // The first project's TOOLS and each group's lines: what must fit on the first screen.
  const first = PROJECTS[0];
  const toolLines = 1 + first.tools.reduce((n, g) => n + g.length, 0);

  // The heroes settle in once the page is on screen, then drift with the
  // scroll at their own rates.
  useLayoutEffect(() => {
    const q = gsap.utils.selector(rootRef);
    const heroes = q(".project-hero");
    const tilts = q(".project-hero__tilt");
    tilts.forEach((el, i) => gsap.set(el, { rotation: HERO_TILT[i] }));
    if (prefersReducedMotion()) return;

    gsap.set(tilts, { opacity: 0 });
    let alive = true;
    const tweens: gsap.core.Tween[] = [];
    void whenPageShown().then(() => {
      if (!alive) return;
      const rise = PROJECT.HERO_IN_Y_PX * projectScale();
      tilts.forEach((el, i) => {
        const turn = (i % 2 ? 1 : -1) * PROJECT.HERO_IN_TILT_DEG;
        tweens.push(
          gsap.fromTo(
            el,
            { opacity: 0, y: rise, rotation: HERO_TILT[i] + turn },
            { opacity: 1, y: 0, rotation: HERO_TILT[i], duration: PROJECT.HERO_IN, ease: PROJECT.HERO_IN_EASE, delay: i * PROJECT.HERO_STAGGER },
          ),
        );
      });
    });

    const setY = heroes.map((el) => gsap.quickSetter(el, "y", "px"));
    const offScroll = onScroll(({ scroll }) => {
      const on = !isCompact();
      setY.forEach((set, i) => set(on ? -scroll * PROJECT.HERO_PARALLAX[i] : 0));
    });
    return () => {
      alive = false;
      tweens.forEach((t) => t.kill());
      offScroll();
      gsap.set(heroes, { y: 0 });
    };
  }, []);

  // Which project is in focus: the block under the middle of the window
  // (before the first block, the first). An old /projects/<slug> link opens
  // scrolled to its project.
  useLayoutEffect(() => {
    let tops: { slug: ProjectSlug; top: number }[] = [];
    const measure = () => {
      tops = PROJECTS.map((p) => ({ slug: p.slug, top: blocks.current.get(p.slug)!.getBoundingClientRect().top + window.scrollY }));
    };
    const pick = (scroll: number) => {
      if (pinned.current) return;
      const mid = scroll + window.innerHeight / 2;
      let slug = tops[0].slug;
      for (const t of tops) if (mid >= t.top) slug = t.slug;
      setActive(slug);
    };

    const focus = takeProjectFocus();
    if (focus) scrollToY(centreOf(blocks.current.get(focus)!), { duration: 0, ease: "none", immediate: true });
    measure();
    pick(window.scrollY);

    const ro = new ResizeObserver(() => {
      measure();
      pick(window.scrollY);
    });
    ro.observe(rootRef.current!);
    const off = onScroll(({ scroll }) => pick(scroll));
    // A wheel, touch or key mid-glide takes over from it (and its onComplete
    // never comes): the highlight follows the scroll again.
    const unpin = () => {
      if (!pinned.current) return;
      pinned.current = false;
      pick(window.scrollY);
    };
    const opts = { passive: true } as const;
    window.addEventListener("wheel", unpin, opts);
    window.addEventListener("touchstart", unpin, opts);
    window.addEventListener("keydown", unpin);
    return () => {
      ro.disconnect();
      off();
      window.removeEventListener("wheel", unpin);
      window.removeEventListener("touchstart", unpin);
      window.removeEventListener("keydown", unpin);
    };
  }, []);

  const select = (slug: ProjectSlug) => {
    play("project.select");
    pinned.current = true;
    setActive(slug);
    scrollToY(centreOf(blocks.current.get(slug)!), {
      duration: PROJECT.SCROLL_TO,
      ease: PROJECT.SCROLL_TO_EASE,
      immediate: prefersReducedMotion(),
      onComplete: () => {
        pinned.current = false;
      },
    });
  };

  // Sections, media and the footer fade up as they scroll in.
  useLayoutEffect(() => revealOnScroll(gsap.utils.selector(rootRef)("[data-reveal]") as HTMLElement[]), []);

  return (
    <StationLayout
      className="project"
      rootRef={rootRef}
      style={{ "--tool-lines": toolLines, "--tool-groups": first.tools.length } as CSSProperties}
      nav={<ProjectList active={active} onSelect={select} />}
    >
      <div className="project__band" aria-hidden="true" />
      <div className="project__heroes" aria-hidden="true">
        {HEROES.map((hero, i) => (
          <div key={i} className={`project-hero project-hero--${i}`}>
            <div className="project-hero__tilt">
              <ResponsivePicture picture={hero.picture} alt={hero.alt} eager />
            </div>
          </div>
        ))}
      </div>

      <div className="project__body">
        {PROJECTS.map((p) => (
          <ProjectBlock
            key={p.slug}
            project={p}
            ref={(el) => {
              if (el) blocks.current.set(p.slug, el);
              else blocks.current.delete(p.slug);
            }}
          />
        ))}
      </div>
    </StationLayout>
  );
}

const LINK_LABEL: Record<ProjectLink["kind"], string> = { github: "GitHub", devpost: "Devpost", site: "Website" };

/** One project: TOOLS, its name, tagline, awards and links over its
 *  description (level with the media's foot), and its media. */
function ProjectBlock({ project: p, ref }: { project: Project; ref: (el: HTMLElement | null) => void }) {
  return (
    <section
      ref={ref}
      id={p.slug}
      className="project-block"
      aria-labelledby={`project-${p.slug}`}
      style={{ "--project-color": `var(${p.poster.color})` } as CSSProperties}
    >
      <aside className="project-block__tools" aria-label={`${p.name} tools`}>
        <h3>TOOLS</h3>
        {p.tools.map((group, i) => (
          <ul key={i}>
            {group.map((tool) => (
              <li key={tool.name} data-dim={tool.dim || undefined}>
                {tool.name}
              </li>
            ))}
          </ul>
        ))}
      </aside>
      <div className="project-block__text">
        <div className="project-block__intro" data-reveal>
          <h2 id={`project-${p.slug}`}>{p.name}</h2>
          <p className="project-block__tagline">{p.tagline}</p>
          {p.awards.length > 0 && (
            <p className="project-block__awards">
              {p.awards.map((a) => (
                <span key={a}>{a}</span>
              ))}
            </p>
          )}
          <ul className="project-block__links">
            {p.links.map((link) => (
              <li key={link.kind}>
                <a
                  href={link.href}
                  aria-label={`${p.name} on ${LINK_LABEL[link.kind]}`}
                  {...(link.href.startsWith("/")
                    ? { onClick: (e: React.MouseEvent) => onNavClick(e, link.href) }
                    : { target: "_blank", rel: "noreferrer" })}
                  onPointerEnter={(e) => e.pointerType !== "touch" && play("link.hover")}
                >
                  {link.kind === "site" ? <Globe /> : <Icon name={link.kind} />}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className="project-block__desc" data-reveal>
          {p.description.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      </div>
      <MediaTile items={p.media} />
    </section>
  );
}

/** A plain globe for "website" links (Font Awesome's is Pro-only). */
function Globe() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="10.1" />
      <ellipse cx="12" cy="12" rx="4.4" ry="10.1" />
      <path d="M1.9 12h20.2M3.4 6.8h17.2M3.4 17.2h17.2" />
    </svg>
  );
}
