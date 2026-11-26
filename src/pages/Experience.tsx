import { useLayoutEffect, useRef, type CSSProperties } from "react";
import PaperSheet from "./paper/PaperSheet";
import StationLayout from "./StationLayout";
import ExperienceList from "./ExperienceList";
import { JOBS, type Job } from "../content/experience";
import { JOB_PHOTOS } from "../content/experiencePhotos";
import { revealOnScroll } from "../lib/scrollReveal";
import { useScrollIndex } from "../lib/useScrollIndex";
import { PROJECT } from "../config/timings";
import "./station.css";

const IDS = JOBS.map((j) => j.id);

/** A job's taped photos (content/experiencePhotos.ts): a box anchored to column `col` (`--k` columns
 *  right of the job's own), the prints and tape placed by their centres. */
function JobPhotos({ job }: { job: Job }) {
  const p = JOB_PHOTOS[job.id];
  const shifted = Array.isArray(p.fit) ? p.fit : [];
  return (
    <div
      className="experience-photos"
      aria-hidden="true"
      style={{ "--pfit": p.fit === "cluster" ? 1 : 0, "--dy": p.dy, "--w": p.w, "--h": p.h } as CSSProperties}
    >
      {p.sheets.map((s) => (
        <PaperSheet
          key={s.id}
          sheet={s}
          style={{
            "--cx": s.cx, "--cy": s.cy, "--w": s.w, "--h": s.h, "--r": `${s.rotate}deg`,
            "--shift": shifted.includes(s.id) ? 1 : 0,
          } as CSSProperties}
        />
      ))}
    </div>
  );
}

/** One job, placed on the 9-column grid where Figma staggers it (three
 *  columns from `col`, `drop` below its row's top): the company, the role
 *  and date in grey, then the points, and its taped photos (placed from
 *  their own column, station.css). */
function JobSection({ job, ref }: { job: Job; ref: (el: HTMLElement | null) => void }) {
  const p = JOB_PHOTOS[job.id];
  return (
    <section
      ref={ref}
      id={job.id}
      className="experience-job"
      aria-labelledby={`job-${job.id}`}
      data-wrap={p.fit === "cluster" ? "" : undefined}
      style={{
        "--col": job.col, "--row": job.row, "--drop": job.drop, "--ph": p.dy + p.h,
        "--pk": p.col - job.col, "--pdx": p.dx, "--pw": p.w,
      } as CSSProperties}
    >
      <div className="experience-job__head">
        <h2 id={`job-${job.id}`} className="experience-job__company">
          {job.company}
        </h2>
        <p className="experience-job__role">
          {job.role}
          <br />
          {job.date}
        </p>
      </div>
      <div className="experience-job__points">
        {job.body.map((para) => (
          <p key={para}>{para}</p>
        ))}
      </div>
      <JobPhotos job={job} />
    </section>
  );
}

/**
 * Experience (Figma "Experience Final"): three jobs staggered across the
 * grid, then the site footer. The index (ExperienceList.tsx) sits fixed
 * under "Matthew Lam" in the page header, like the Projects list. Only the
 * footer fades up as it's scrolled into view (lib/scrollReveal.ts).
 */
export default function Experience() {
  const rootRef = useRef<HTMLDivElement>(null);
  const blocks = useRef(new Map<string, HTMLElement>());
  const { active, select } = useScrollIndex(IDS, blocks, rootRef, {
    sound: "project.select",
    duration: PROJECT.SCROLL_TO,
    ease: PROJECT.SCROLL_TO_EASE,
  });

  useLayoutEffect(() => revealOnScroll([...rootRef.current!.querySelectorAll<HTMLElement>("[data-reveal]")]), []);

  return (
    <StationLayout
      className="station-page experience"
      rootRef={rootRef}
      nav={<ExperienceList rows={JOBS} active={active} onSelect={select} />}
    >
      <div className="experience__jobs">
        {JOBS.map((job) => (
          <JobSection
            key={job.id}
            job={job}
            ref={(el) => {
              if (el) blocks.current.set(job.id, el);
              else blocks.current.delete(job.id);
            }}
          />
        ))}
      </div>
    </StationLayout>
  );
}
