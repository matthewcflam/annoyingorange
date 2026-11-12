/**
 * Per-project copy and media for the Projects station (Figma "Portfolio",
 * pages/projects/). Every project uses the same template: a tools list, two
 * tilted heroes, rows of text sections beside a piece of media.
 */
import type { Picture } from "../lib/assets";
import heroPlaceholder from "../../assets-src/images/project-hero-placeholder.png?hero";

export type ProjectSlug = "portfolio" | "oyster-news" | "remind" | "mango";

/** A block of copy in a section. */
export type Block =
  | { kind: "p"; text: string }
  /** A sub-heading inside a section ("Design Decisions"). */
  | { kind: "sub"; text: string }
  | { kind: "ol"; items: string[] };

export interface Section {
  heading: string;
  blocks: Block[];
}

/**
 * Media beside a row. Only placeholders for now (the labelled grey boxes in
 * the Figma file); real kinds (video, image, embed) slot in here and in
 * pages/projects/Media.tsx. `w` / `h` are the box in the 1640 frame: its
 * aspect ratio.
 */
export type Media = { kind: "placeholder"; label: string; w: number; h: number };

/** Text sections stacked in the text columns, beside one piece of media. */
export interface Row {
  sections: Section[];
  media: Media | null;
  /** Sits right under the row above (16px), like the Figma board and timeline. */
  tight?: boolean;
}

/** One of the two tilted images above the copy. */
export interface Hero {
  picture: Picture;
  alt: string;
}

export interface Project {
  slug: ProjectSlug;
  /** Name in the project list. */
  listTitle: string;
  /** What it was, centred in the project list ("Project", "Hackathon"). */
  category: string;
  year: string;
  path: string;
  /** Groups of tools; a blank line separates the groups. */
  tools: string[][];
  /** The poster beside the list while the row is hovered (Figma "… Hover"):
   *  its colour (a tokens.css custom property) and paragraphs of lines. */
  poster: { color: string; text: string[][] };
  /** Exactly two: the lower-left one, then the upper-right one. */
  heroes: [Hero, Hero];
  rows: Row[];
}

/** TODO(heroes): placeholder art from the Figma file, for every project. */
const HEROES: [Hero, Hero] = [
  { picture: heroPlaceholder, alt: "" },
  { picture: heroPlaceholder, alt: "" },
];

const para = (text: string): Block => ({ kind: "p", text });

/** TODO(open-question #12/#14): real copy, tools and media for this project. */
const PLACEHOLDER_ROWS: Row[] = [
  {
    sections: [
      { heading: "DESCRIPTION", blocks: [para("PLACEHOLDER PLACEHOLDER PLACEHOLDER PLACEHOLDER PLACEHOLDER PLACEHOLDER PLACEHOLDER PLACEHOLDER PLACEHOLDER")] },
      { heading: "FEATURES", blocks: [para("PLACEHOLDER PLACEHOLDER PLACEHOLDER PLACEHOLDER PLACEHOLDER PLACEHOLDER")] },
    ],
    media: { kind: "placeholder", label: "Video", w: 707, h: 495 },
  },
  {
    sections: [{ heading: "HOW I BUILT IT", blocks: [para("PLACEHOLDER PLACEHOLDER PLACEHOLDER PLACEHOLDER PLACEHOLDER PLACEHOLDER")] }],
    media: { kind: "placeholder", label: "Figma Board", w: 710, h: 327 },
  },
  {
    sections: [{ heading: "USE OF AI", blocks: [para("PLACEHOLDER PLACEHOLDER PLACEHOLDER PLACEHOLDER")] }],
    media: { kind: "placeholder", label: "Timeline", w: 711, h: 173 },
    tight: true,
  },
];
const PLACEHOLDER_TOOLS = [["Placeholder", "Placeholder", "Placeholder"]];

/** List order (Figma): This Portfolio, Oyster News, ReMind, Mango. */
export const PROJECTS: readonly Project[] = [
  {
    slug: "portfolio",
    listTitle: "This Portfolio",
    category: "Project",
    year: "2026",
    path: "/projects/portfolio",
    // "Seven" … "Ten" are the Figma file's own placeholders.
    tools: [
      ["React.js", "TypeScript", "WebGL", "Seven", "Eight", "Nine", "Ten"],
      ["Claude Code", "Figma"],
    ],
    poster: { color: "--color-poster-portfolio", text: [[":)"]] },
    heroes: HEROES,
    rows: [
      {
        sections: [
          {
            heading: "DESCRIPTION",
            blocks: [
              para(
                "One day I thought to myself... I want something of my own to represent who I am. So I sat for a ridiculous amount of time on my Figma Board and got to cooking. The result is this transit and Studio Ghibli inspired website.",
              ),
              para("I hope you enjoy!"),
            ],
          },
          {
            heading: "FEATURES",
            blocks: [
              para(
                "I chose transit because I love the peace that comes with taking transit. You have the freedom to look out the window and focus on what’s around you.",
              ),
              // Unfinished in the Figma file.
              para("transition screen: a modified version of 2XA Studio’s wonderful transition, intended to make"),
              para("who? spray"),
              para("defrosting photos"),
              para("sound"),
            ],
          },
        ],
        media: { kind: "placeholder", label: "Video", w: 707, h: 495 },
      },
      {
        sections: [
          {
            heading: "HOW I BUILT IT",
            blocks: [
              { kind: "sub", text: "Design Decisions" },
              { kind: "ol", items: ["Optimizing for speed", "Custom everything"] },
              { kind: "sub", text: "Technical Challenges" },
              { kind: "ol", items: ["Making the who? spray look human", "Recreating 2XA Studio’s Transition"] },
            ],
          },
        ],
        media: { kind: "placeholder", label: "Figma Board", w: 710, h: 327 },
      },
      {
        sections: [
          {
            heading: "USE OF AI",
            blocks: [para("I used AI to evaluate tech stack, system design, implementation, and testing.")],
          },
        ],
        media: { kind: "placeholder", label: "Timeline", w: 711, h: 173 },
        tight: true,
      },
    ],
  },
  {
    slug: "remind",
    listTitle: "ReMind",
    category: "Hackathon",
    year: "2026",
    path: "/projects/remind",
    tools: PLACEHOLDER_TOOLS,
    poster: { color: "--color-poster-remind", text: [["Conversational", "AI for Dementia"], ["DubHacks 2x", "Winner"]] },
    heroes: HEROES,
    rows: PLACEHOLDER_ROWS,
  },
  {
    slug: "oyster-news",
    listTitle: "Oyster News",
    category: "Project",
    year: "2026",
    path: "/projects/oyster-news",
    tools: PLACEHOLDER_TOOLS,
    poster: { color: "--color-poster-oyster-news", text: [["Worldwide News,", "Mapped"]] },
    heroes: HEROES,
    rows: PLACEHOLDER_ROWS,
  },
  {
    slug: "mango",
    listTitle: "Mango",
    category: "Hackathon",
    year: "2025",
    path: "/projects/mango",
    tools: PLACEHOLDER_TOOLS,
    poster: { color: "--color-poster-mango", text: [["Gesture Controlled", "Minecraft"], ["HelloHacks Winner"]] },
    heroes: HEROES,
    rows: PLACEHOLDER_ROWS,
  },
];

export const projectBySlug = (slug: ProjectSlug) => PROJECTS.find((p) => p.slug === slug)!;
export const projectByPath = (path: string) => PROJECTS.find((p) => p.path === path);
