/** Cursor labels (chrome/Cursor.tsx reads them from `data-cursor`): what a
 *  click does. The contact links' own labels live in content/contact.ts. */
import type { ProjectLink } from "./projects";

export const CURSOR_LABEL = {
  home: "Go Home",
  readMore: "Read More",
  spray: "Spray",
  draw: "Draw",
  redraw: "Redraw",
  close: "Close",
  previous: "Previous",
  next: "Next",
  soundOn: "Sound On",
  soundOff: "Sound Off",
  viewPhoto: "View Photo",
  playVideo: "Play Video",
  expand: "Expand",
  /** "View Experience", "View Projects": a station link. */
  view: (what: string) => `View ${what}`,
} as const;

/** A project's links (pages/projects/Projects.tsx): where each goes (for its
 *  aria-label) and what the cursor says over it. */
export const PROJECT_LINK_LABEL: Record<ProjectLink["kind"], string> = { github: "GitHub", devpost: "Devpost", site: "Website" };
export const PROJECT_LINK_CURSOR: Record<ProjectLink["kind"], string> = { github: "View GitHub", devpost: "View Devpost", site: "Visit Site" };
