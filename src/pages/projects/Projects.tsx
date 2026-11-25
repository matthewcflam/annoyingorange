import { useLayoutEffect, useRef, type CSSProperties } from "react";
import { gsap } from "../../lib/gsap";
import { onNavClick, takeProjectFocus } from "../../lib/router";
import { revealOnScroll } from "../../lib/scrollReveal";
import { useScrollIndex } from "../../lib/useScrollIndex";
import { play } from "../../audio/engine";
import { PROJECT } from "../../config/timings";
import { PROJECTS, type Project, type ProjectLink, type ProjectSlug } from "../../content/projects";
import Icon from "../../chrome/Icon";
import MediaCollage from "./Media";
import ProjectList from "./ProjectList";
import StationLayout from "../StationLayout";
import "./project.css";

const SLUGS = PROJECTS.map((p) => p.slug);

/**
 * /projects (Figma "Project Final"): every project on one light page on
 * the 9-column grid (tokens.css --grid-*).
 *
 * Fixed, in the two left columns: "Matthew Lam" (goes home) and the project
 * list, an index: a click glides the page until that project is mid-screen,
 * and the row of the project in focus (the block under the middle of the
 * window) is black. Below: one block per project: TOOLS (columns 1–2,
 * scrolling with the page, under the list's band), the text (4–5) and the
 * media collage (6–8), mirrored on every other block (collage 3–5, text 6–7). Then the footer. The
 * shell (the name, the footer) is ../StationLayout.tsx; the Map box top-right
 * is shared chrome (chrome/StationChrome.tsx).
 */
export default function Projects() {
  const rootRef = useRef<HTMLDivElement>(null);
  const blocks = useRef(new Map<ProjectSlug, HTMLElement>());
  const { active, select } = useScrollIndex(SLUGS, blocks, rootRef, {
    sound: "project.select",
    duration: PROJECT.SCROLL_TO,
    ease: PROJECT.SCROLL_TO_EASE,
    // An old /projects/<slug> link opens scrolled to its project.
    initial: takeProjectFocus,
  });
  // The first project's TOOLS and each group's lines: what must fit on the first screen.
  const first = PROJECTS[0];
  const toolLines = 1 + first.tools.reduce((n, g) => n + g.length, 0);

  // The footer pieces fade up as they scroll in (only the footer reveals).
  useLayoutEffect(() => revealOnScroll(gsap.utils.selector(rootRef)("[data-reveal]") as HTMLElement[]), []);

  return (
    <StationLayout
      className="project"
      rootRef={rootRef}
      style={{ "--tool-lines": toolLines, "--tool-groups": first.tools.length } as CSSProperties}
      nav={<ProjectList active={active} onSelect={select} />}
    >
      <div className="project__band" aria-hidden="true" />
      <div className="project__body">
        {PROJECTS.map((p, i) => (
          <ProjectBlock
            key={p.slug}
            project={p}
            flip={i % 2 === 1}
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

/** One project: TOOLS, its name, tagline, awards and links, then its
 *  description, and its media collage. Every other block is mirrored
 *  (`flip`: the collage in columns 3–5, the text in 6–7), so the projects
 *  zigzag down the page (user request, like Experience's jobs). */
function ProjectBlock({ project: p, flip, ref }: { project: Project; flip: boolean; ref: (el: HTMLElement | null) => void }) {
  return (
    <section
      ref={ref}
      id={p.slug}
      className="project-block"
      data-flip={flip || undefined}
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
        <div className="project-block__intro">
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
        {p.description.length > 0 && (
          <div className="project-block__desc">
            {p.description.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        )}
      </div>
      <MediaCollage project={p} />
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
