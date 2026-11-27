import type { ReactNode } from "react";
import { hoverSound } from "../../audio/engine";
import { isPlainClick } from "../../lib/router";
import type { IndexRow } from "../../content/experience";

/**
 * The Experience index (Figma "Experience Final"): fixed top-left under
 * "Matthew Lam" (StationLayout's `nav` slot, like the Projects list), columns
 * 1–2, a row per job (logo, name, its year). The row of the job in
 * focus (`active`, lib/useScrollIndex.ts) is black, the others grey; a click
 * glides the page to that job. Compact: it sits under the name and scrolls
 * with the page (experience.css).
 */
export default function ExperienceList({
  rows,
  active,
  onSelect,
}: {
  rows: IndexRow[];
  active: string;
  onSelect: (id: string) => void;
}) {
  return (
    <nav className="experience-list" aria-label="Experience">
      <ul>
        {rows.map((row) => (
          <li key={row.id}>
            <a
              href={`#${row.id}`}
              className="experience-list__link"
              data-active={row.id === active || undefined}
              aria-current={row.id === active ? "location" : undefined}
              onClick={(e) => {
                if (!isPlainClick(e)) return;
                e.preventDefault();
                onSelect(row.id);
              }}
              onPointerEnter={hoverSound}
            >
              <RowInner row={row} />
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function RowInner({ row }: { row: IndexRow }): ReactNode {
  return (
    <>
      <span className="experience-list__logo" aria-hidden="true">
        <span
          className="experience-list__mark"
          style={{ "--w": row.logo.w, "--h": row.logo.h, "--x": row.logo.x }}
        >
          <img
            src={row.logo.src}
            alt=""
            data-crop={row.logo.crop ? "" : undefined}
            style={
              row.logo.crop &&
              ({ "--cw": row.logo.crop.w, "--ch": row.logo.crop.h, "--cx": row.logo.crop.x, "--cy": row.logo.crop.y })
            }
          />
        </span>
      </span>
      <span className="experience-list__name">{row.listName}</span>
      <span className="experience-list__date">{row.listDate}</span>
    </>
  );
}
