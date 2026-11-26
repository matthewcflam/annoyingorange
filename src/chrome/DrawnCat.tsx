import { useEffect, useRef } from "react";
import { gsap } from "../lib/gsap";
import { prefersReducedMotion } from "../lib/motion";
import { whenPageShown } from "../lib/pageReveal";
import { CAT } from "../config/timings";
import catSvg from "../../assets-src/svg/chat-cat.svg?raw";

/**
 * The orange cat (chat-cat.svg), on home and in every station page's footer.
 * A click inside it (the area its strokes enclose: its paths take
 * pointer-events, the box around it stays click-through; home.css,
 * footer.css) draws it again. Its first draw is either the home intro's
 * (chrome/intro.ts, which selects `.home__cat path`) or, with `drawOnView`,
 * the first time it scrolls into view once the page shows (the footer).
 */
export default function DrawnCat({ className, drawOnView = false }: { className: string; drawOnView?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cat = ref.current!;
    const paths = cat.querySelectorAll("path");
    let alive = true;
    let tween: gsap.core.Tween | null = null;
    let io: IntersectionObserver | null = null;

    const draw = () => {
      if (prefersReducedMotion()) return;
      tween?.kill();
      tween = gsap.fromTo(paths, { drawSVG: "0%" }, { drawSVG: "100%", duration: CAT.DRAW, ease: CAT.DRAW_EASE });
    };

    if (drawOnView && !prefersReducedMotion()) {
      gsap.set(paths, { drawSVG: "0%" });
      void whenPageShown().then(() => {
        if (!alive) return;
        io = new IntersectionObserver(
          ([entry]) => {
            if (!entry.isIntersecting) return;
            io!.disconnect();
            draw();
          },
          { threshold: 0.3 },
        );
        io.observe(cat);
      });
    }

    const replay = () => {
      io?.disconnect();
      draw();
    };
    cat.addEventListener("click", replay);
    return () => {
      alive = false;
      io?.disconnect();
      tween?.kill();
      cat.removeEventListener("click", replay);
    };
  }, [drawOnView]);

  return <div ref={ref} className={className} data-clickable data-cursor="Redraw" aria-hidden="true" dangerouslySetInnerHTML={{ __html: catSvg }} />;
}
