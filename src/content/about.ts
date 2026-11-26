/** About's copy (pages/About.tsx; Figma "ABOUT FINAL"). */
import type { StationId } from "../config/routes";

/** A run of text: plain, orange (`accent`), or an orange link to a station. */
export type AboutSpan = string | { accent: string } | { link: StationId; text: string };

/** The greeting's lines (one line break between them). */
export const ABOUT_HELLO = ["Nice to meet you!", "I’m Matthew"] as const;

/** The paragraphs, a blank line apart. */
export const ABOUT_COPY: readonly (readonly AboutSpan[])[] = [
  [
    "I’m a curious, user-focused developer that loves to understand problems and use technology to solve them. I’m currently pursuing a degree in Computer Engineering at the ",
    { accent: "University of British Columbia" },
    ".",
  ],
  ["I’m based in Vancouver, and open to summer / fall 2027 opportunities!"],
  ["Check out my ", { link: "experience", text: "experience" }, " and ", { link: "projects", text: "projects" }, " :)"],
];
