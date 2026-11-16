/**
 * The projects on the Projects page (Figma "Project Redesign",
 * pages/projects/). Every project is one block on the same page: its tools,
 * name, tagline, awards, links, its media and a description.
 */
import type { Picture } from "../lib/assets";
import heroPlaceholder from "../../assets-src/images/project-hero-placeholder.png?hero";
import remindDemoAv1 from "../../assets-src/videos/remind-demo.webm";
import remindDemoH264 from "../../assets-src/videos/remind-demo.mp4";
import remindDemoPoster from "../../assets-src/images/remind-demo-poster.png?poster";
import { DEVPOST, GITHUB } from "./contact";

export type ProjectSlug = "remind" | "mango" | "oyster-news" | "portfolio";

/**
 * One item of a project's media (pages/projects/Media.tsx). The first is the
 * tile beside the project; the expanded view cycles through all of them.
 * `w` / `h` give the aspect ratio (the tile is always the first item's).
 * - placeholder: a labelled grey box (the Figma file's).
 * - video: a self-hosted, silent clip that autoplays muted and loops (no
 *   YouTube embed). Encode with no audio track; see CLAUDE.md for the command.
 */
export type Media =
  | { kind: "placeholder"; label: string; w: number; h: number }
  | { kind: "video"; label: string; sources: VideoSource[]; poster: string; w: number; h: number };

/** One encoding of a video, best first: the browser plays the first `type`
 *  it can decode (AV1 WebM, then the H.264 MP4 every browser plays). */
export interface VideoSource {
  src: string;
  type: string;
}

/** A tool; `dim` ones are grey (used a little), the rest black. */
export interface Tool {
  name: string;
  dim?: boolean;
}

export interface ProjectLink {
  kind: "github" | "devpost" | "site";
  href: string;
}

export interface Project {
  slug: ProjectSlug;
  /** Name in the project list. */
  listTitle: string;
  /** What it was, centred in the project list ("Project", "Hackathon"). */
  category: string;
  year: string;
  /** The block's heading. */
  name: string;
  tagline: string;
  /** One line each, under the tagline. */
  awards: string[];
  links: ProjectLink[];
  /** Groups of tools; a gap separates the groups. */
  tools: Tool[][];
  /** The poster beside the list while the row is hovered (Figma "… Hover"):
   *  its colour (a tokens.css custom property, also the TOOLS heading's) and
   *  paragraphs of lines. */
  poster: { color: string; text: string[][] };
  /** The first is the tile on the page; the expanded view cycles them all. */
  media: Media[];
  /** Paragraphs, bottom-aligned with the media. */
  description: string[];
}

/** The two tilted images above the first project: the lower-left one, then
 *  the upper-right one. TODO(open-question #13): placeholder art. */
export const HEROES: [{ picture: Picture; alt: string }, { picture: Picture; alt: string }] = [
  { picture: heroPlaceholder, alt: "" },
  { picture: heroPlaceholder, alt: "" },
];

const VIDEO: Media = { kind: "placeholder", label: "Video", w: 707, h: 495 };
const placeholder = (label: string): Media => ({ kind: "placeholder", label, w: 707, h: 495 });
const t = (name: string, dim = false): Tool => ({ name, dim });

// TODO(open-question #12): each project's own repo / Devpost / site URLs.
const GITHUB_TODO = GITHUB;
const DEVPOST_TODO = DEVPOST;

/** Page and list order (Figma "Project Redesign"). */
export const PROJECTS: readonly Project[] = [
  {
    slug: "remind",
    listTitle: "ReMind",
    category: "Hackathon",
    year: "2026",
    name: "ReMind",
    tagline: "Conversational AI for Dementia",
    awards: ["DubHacks ‘26 MLH Best Use of Backboard", "DubHacks ‘26 Perceptron Robotics 2nd Place"],
    links: [
      { kind: "github", href: GITHUB_TODO },
      { kind: "devpost", href: DEVPOST_TODO },
    ],
    tools: [
      [t("Next.js"), t("TypeScript"), t("Python", true), t("Gemini Live API"), t("Backboard", true), t("MongoDB", true), t("Photon", true), t("SO-101 Robot Arm", true)],
      [t("Claude Code"), t("Grokbot", true), t("Figma", true)],
    ],
    poster: { color: "--color-poster-remind", text: [["Conversational", "AI for Dementia"], ["DubHacks 2x", "Winner"]] },
    // The demo from YouTube (g9GPV6Mq0zw) from 0:05, re-encoded silent:
    // AV1 (~6 MB), with H.264 (~10 MB) for browsers without AV1.
    // TODO(open-question #13): placeholders after it.
    media: [
      {
        kind: "video",
        label: "ReMind demo",
        sources: [
          { src: remindDemoAv1, type: 'video/webm; codecs="av01.0.04M.08"' },
          { src: remindDemoH264, type: "video/mp4" },
        ],
        poster: remindDemoPoster,
        w: 707,
        h: 495,
      },
      placeholder("Screenshot"),
      placeholder("Robot arm"),
    ],
    description: [
      "My grandma has dementia. 10M more people are diagnosed each year, and the population pyramid is shifting upwards.",
      "ReMind is a conversational AI assistant that closes the gap; it can play cognitive stimulation therapy games based on research, one of which is a memory game with an SO-101 Robot Arm trained of Perceptron AI’s Isaac 0.5 Model.",
    ],
  },
  {
    slug: "mango",
    listTitle: "Mango",
    category: "Hackathon",
    year: "2025",
    name: "Mango",
    tagline: "Gesture Controlled Minecraft",
    awards: ["HelloHacks ‘25 1st Place"],
    links: [
      { kind: "github", href: GITHUB_TODO },
      { kind: "devpost", href: DEVPOST_TODO },
    ],
    tools: [
      [t("Python"), t("MediaPipe Holistic")],
      [t("GitHub Copilot"), t("Cursor"), t("Figma", true)],
    ],
    poster: { color: "--color-poster-mango", text: [["Gesture Controlled", "Minecraft"], ["HelloHacks Winner"]] },
    media: [VIDEO],
    description: [
      "Minecraft is the most sold video game of all time. But what if you could actually be Steve?",
      "Mango is a computer vision application that allows players to interact with Minecraft using human gestures.",
    ],
  },
  {
    slug: "oyster-news",
    listTitle: "Oyster News",
    category: "Project",
    year: "2026",
    name: "Oyster News",
    tagline: "Worldwide News, Mapped",
    awards: [],
    links: [
      { kind: "github", href: GITHUB_TODO },
      { kind: "site", href: GITHUB_TODO },
    ],
    tools: [
      [t("Next.js"), t("TypeScript"), t("MapLibre GL JS", true), t("Cloudflare R2", true), t("GitHub Actions", true)],
      [t("Claude Code"), t("Figma", true)],
    ],
    poster: { color: "--color-poster-oyster-news", text: [["Worldwide News,", "Mapped"]] },
    media: [VIDEO],
    // TODO(open-question #12): the Figma frame repeats Mango's copy here.
    description: ["PLACEHOLDER PLACEHOLDER PLACEHOLDER PLACEHOLDER PLACEHOLDER PLACEHOLDER PLACEHOLDER PLACEHOLDER"],
  },
  {
    slug: "portfolio",
    listTitle: "This Portfolio",
    category: "Project",
    year: "2026",
    name: "This Portfolio",
    tagline: "The greatest website ever!!!!",
    awards: [],
    links: [
      { kind: "github", href: GITHUB_TODO },
      { kind: "site", href: "/" },
    ],
    tools: [
      [t("React.js"), t("TypeScript"), t("WebGL")],
      [t("Claude Code"), t("Grokbot", true), t("Figma", true)],
    ],
    poster: { color: "--color-poster-portfolio", text: [[":)"]] },
    media: [VIDEO],
    description: [
      "One day I thought to myself... I want something of my own to represent who I am. So I sat for a ridiculous amount of time on my Figma Board and got to cooking. The result is this transit and Studio Ghibli inspired website.",
      "I hope you enjoy!",
    ],
  },
];

/** The project a `/projects/<slug>` path names, if any (old per-project
 *  links: they open /projects scrolled to it). */
export function projectSlugFromPath(path: string): ProjectSlug | null {
  const m = /^\/projects\/([^/]+)\/?$/.exec(path);
  return (m && PROJECTS.find((p) => p.slug === m[1])?.slug) || null;
}
