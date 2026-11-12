import { useLayoutEffect, useRef, type CSSProperties } from "react";
import { gsap } from "../../lib/gsap";
import { useRoute } from "../../lib/router";
import { whenPageShown } from "../../lib/pageReveal";
import { prefersReducedMotion } from "../../lib/motion";
import { revealOnScroll } from "../../lib/scrollReveal";
import { onScroll } from "../../lib/scroll";
import { isCompact } from "../../lib/frame";
import { projectScale } from "../../lib/tokens";
import { PROJECT } from "../../config/timings";
import { projectByPath, type Block, type Project, type Row } from "../../content/projects";
import ResponsivePicture from "../ResponsivePicture";
import MediaTile from "./Media";
import ProjectList from "./ProjectList";
import StationLayout from "../StationLayout";
import "./project.css";

/** The heroes' resting tilt in degrees (Figma: image 109, image 110). Their
 *  boxes and positions are in project.css. */
const HERO_TILT = [-10.4, 4.77];

/**
 * Every /projects/* route (Figma "Portfolio"): a light page on the 9-column
 * grid (tokens.css --grid-*).
 *
 * Fixed, in the two left columns: "Matthew Lam" (goes home) and the project
 * list. Scrolling: TOOLS (the same two columns) starts in line with
 * DESCRIPTION and scrolls with it until it reaches the list, then stays
 * there; the text sections (columns 3–4) and their media (5–8); the footer.
 * The shell (the name, the footer) is ../StationLayout.tsx; the Map box
 * top-right is shared chrome (chrome/StationChrome.tsx).
 *
 * The shell stays mounted while projects switch; what belongs to one project
 * sits in the `.project__swap` elements, which the transition crossfades
 * (transition/pageTransition.ts).
 */
export default function Projects() {
  const project = projectByPath(useRoute())!;
  const rootRef = useRef<HTMLDivElement>(null);
  // TOOLS and each group's lines, plus the gaps: what must fit on the first screen.
  const toolLines = 1 + project.tools.reduce((n, g) => n + g.length, 0);

  // The heroes settle in once the page is on screen (straight away on a
  // project switch), then drift with the scroll at their own rates.
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
  }, [project.slug]);

  // Sections, media and the footer fade up as they scroll in.
  useLayoutEffect(() => revealOnScroll(gsap.utils.selector(rootRef)("[data-reveal]") as HTMLElement[]), [project.slug]);

  return (
    <StationLayout
      className="project"
      rootRef={rootRef}
      style={{ "--tool-lines": toolLines, "--tool-groups": project.tools.length } as CSSProperties}
      nav={
        <ProjectList current={project} />
      }
    >
      <div className="project__heroes project__swap" aria-hidden="true">
        {project.heroes.map((hero, i) => (
          <div key={`${project.slug}-${i}`} className={`project-hero project-hero--${i}`}>
            <div className="project-hero__tilt">
              <ResponsivePicture picture={hero.picture} alt={hero.alt} eager />
            </div>
          </div>
        ))}
      </div>

      <div className="project__body">
        <aside className="project__tools project__swap" aria-labelledby="project-tools">
          <h2 id="project-tools">TOOLS</h2>
          {project.tools.map((group, i) => (
            <ul key={`${project.slug}-${i}`}>
              {group.map((tool, t) => (
                <li key={t}>{tool}</li>
              ))}
            </ul>
          ))}
        </aside>
        <div className="project__main project__swap">
          <Rows key={project.slug} project={project} />
        </div>
      </div>
    </StationLayout>
  );
}

/**
 * A tight row joins the row above it: its media stacks 16px under that row's
 * media, and its sections continue that row's text column at the normal
 * section gap (so taller copy never crowds the next heading).
 */
function Rows({ project }: { project: Project }) {
  const groups: Row[][] = [];
  for (const row of project.rows) {
    if (row.tight && groups.length) groups[groups.length - 1].push(row);
    else groups.push([row]);
  }
  return groups.map((group, g) => (
    <div key={g} className="project-row">
      <div className="project-row__text">
        {group.flatMap((row) => row.sections).map((section) => (
          <section key={section.heading} className="project-section" data-reveal>
            <h2>{section.heading}</h2>
            {section.blocks.map((block, b) => (
              <BlockView key={b} block={block} />
            ))}
          </section>
        ))}
      </div>
      <div className="project-row__media">
        {group.map((row, r) => row.media && <MediaTile key={r} media={row.media} />)}
      </div>
    </div>
  ));
}

function BlockView({ block }: { block: Block }) {
  if (block.kind === "p") return <p>{block.text}</p>;
  if (block.kind === "sub") return <h3>{block.text}</h3>;
  return (
    <ol>
      {block.items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ol>
  );
}
