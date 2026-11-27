/**
 * The projects on the Projects page (Figma "Project Final", node 437:3858;
 * pages/projects/). Every project is one block on the same page: its tools,
 * name, tagline, awards, links, a description and a collage of its media.
 */
import type { Picture } from "../lib/picture";
import remind1 from "../../assets-src/images/remind-1.jpg?collage";
import remind2 from "../../assets-src/images/remind-2.png?collage";
import remind3 from "../../assets-src/images/remind-3.jpg?collage";
import mango1 from "../../assets-src/images/mango-1.png?collage";
import mango2 from "../../assets-src/images/mango-2.png?collage";
import mango3 from "../../assets-src/images/mango-3.png?collage";
import oysterMap from "../../assets-src/images/oyster-news-map.png?collage";
import portfolio1 from "../../assets-src/images/portfolio-1.png?collage";
import refSkyline from "../../assets-src/images/portfolio-ref-skyline.png?collage";
import ref2xa from "../../assets-src/images/portfolio-ref-2xa.png?collage";
import refBleibtgleich from "../../assets-src/images/portfolio-ref-bleibtgleich.png?collage";
import smileySvg from "../../assets-src/svg/project-smiley.svg";
import heartSvg from "../../assets-src/svg/project-heart.svg";
import remindDemoAv1 from "../../assets-src/videos/remind-demo.webm";
import remindDemoH264 from "../../assets-src/videos/remind-demo.mp4";
import remindDemoPoster from "../../assets-src/images/remind-demo-poster.png?poster";

import type { ProjectSlug } from "../config/routes";
export type { ProjectSlug };

/**
 * One item of a project's media (pages/projects/Collage.tsx, Lightbox.tsx), as the expanded
 * view (the lightbox) shows it. `w` / `h` give its aspect ratio there.
 * - image: a photo (a `?collage` imagetools picture).
 * - placeholder: a labelled grey box (the Figma file's).
 * - video: a self-hosted, silent clip that autoplays muted and loops (no
 *   YouTube embed). Encode with no audio track; see CLAUDE.md for the command.
 */
export type Media =
  | { kind: "image"; label: string; picture: Picture; w: number; h: number }
  | { kind: "placeholder"; label: string; w: number; h: number }
  | { kind: "video"; label: string; sources: VideoSource[]; poster: string; w: number; h: number };

/** One encoding of a video, best first: the browser plays the first `type`
 *  it can decode (AV1 WebM, then the H.264 MP4 every browser plays). */
export interface VideoSource {
  src: string;
  type: string;
}

/**
 * One taped print in a project's collage (user request: "order, but
 * human"; styled like home's and Experience's prints, components/paper/). Pieces
 * are placed freely and overlap, each later one over those before. All
 * lengths are % of the collage's width (three columns), so the collage scales
 * with the columns. Its height is its media's aspect: the whole photo shows.
 * On a mirrored block (every other project) the text is on the right, so its
 * pieces lean right.
 */
export interface CollageItem {
  media: Media;
  /** Width. */
  w: number;
  /** Left edge, from the collage's. */
  x: number;
  /** Top edge, from the collage's. */
  y: number;
  /** Degrees, about its centre (the tape turns with it). */
  rotate: number;
  /** The strip holding it, centred `x`% across its top edge, turned `rotate`
   *  more; `long` is the longer strip. */
  tape: { x: number; rotate: number; long?: boolean };
  /** The print's width / height on the page, when it differs from the media's:
   *  the photo is cropped to it, centred (the lightbox shows it uncropped). */
  aspect?: number;
  /** An outside site: a click opens it in a new tab (cursor "Visit Site")
   *  instead of expanding the print; the lightbox's arrows still reach it. */
  href?: string;
  /** Text written on a placeholder, at this spot (% of the piece). */
  caption?: { text: string[]; x: number; y: number };
}

/** A hand-drawn mark (aria-hidden) on piece `item`: its top-left `x`, `y`
 *  from the piece's top-left and its width, in % of the collage's width. */
export interface CollageMark {
  src: string;
  item: number;
  x: number;
  y: number;
  w: number;
}

/** A project's media, taped prints in columns 6–8 (3–5 when mirrored). */
export interface Collage {
  items: CollageItem[];
  /** The collage's share of columns 6–8 (3–5 mirrored), instead of the usual
   *  --collage-scale (0.75); at most 0.92, so it still ends inside them. */
  scale?: number;
  marks?: CollageMark[];
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
  /** Optional (This Portfolio has none). */
  tagline?: string;
  /** One line each, under the tagline. */
  awards: string[];
  links: ProjectLink[];
  /** Groups of tools; a gap separates the groups. */
  tools: Tool[][];
  /** The poster beside the list while the row is hovered (Figma "… Hover"):
   *  its colour (a tokens.css custom property, also the TOOLS heading's) and paragraphs of lines. */
  poster: { color: string; text: string[][] };
  /** The pictures beside the text; a click expands one into the lightbox,
   *  which cycles through them and then `extraMedia`. */
  collage: Collage;
  /** Shown only in the lightbox, after the collage's pieces. */
  extraMedia?: Media[];
  /** Paragraphs under the links (no heading); empty for none. */
  description: string[];
  /** Centre the text block on the collage's centre line instead of its top
   *  (This Portfolio; user request). Full layout only. */
  centerText?: boolean;
}

/** A photo; its lightbox aspect is the picture's own. */
const photo = (label: string, picture: Picture): Media => ({ kind: "image", label, picture, w: picture.img.w, h: picture.img.h });
const t = (name: string, dim = false): Tool => ({ name, dim });
/** This Portfolio's references: the shape of Figma's grey boxes. */
const REF_ASPECT = 219 / 153;


/** Page and list order: the sections of Figma "Project Final" (its list is in
 *  another order; user decision: the sections' order for both). */
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
      { kind: "github", href: "https://github.com/remind-dubhacks/dubhacks-2026" },
      { kind: "devpost", href: "https://devpost.com/software/remind-y8kg9s" },
    ],
    tools: [
      [t("Next.js"), t("TypeScript"), t("Python", true), t("Gemini Live API"), t("Backboard", true), t("MongoDB", true), t("Photon", true), t("SO-101 Robot Arm", true)],
      [t("Claude Code"), t("Grokbot", true), t("Figma", true)],
    ],
    poster: { color: "--color-poster-remind", text: [["Conversational", "AI for Dementia"], ["DubHacks 2x", "Winner"]] },
    collage: {
      items: [
        { media: photo("The ReMind team with the robot arm at DubHacks", remind1), w: 50, x: 2, y: 2, rotate: -1.6, tape: { x: 50, rotate: -3 } },
        { media: photo("A selfie on the train", remind2), w: 44, x: 48, y: 11, rotate: 2.27, tape: { x: 40, rotate: 6, long: true } },
        { media: photo("The ReMind demo table: laptops and the SO-101 robot arm", remind3), w: 70, x: 14, y: 61, rotate: -3.1, tape: { x: 62, rotate: -2 } },
      ],
      marks: [{ src: smileySvg, item: 2, x: 52, y: 20, w: 13 }],
    },
    // The demo from YouTube (g9GPV6Mq0zw) from 0:05, re-encoded silent:
    // AV1 (~6 MB), with H.264 (~10 MB) for browsers without AV1.
    extraMedia: [
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
    ],
    description: [
      "My grandma has dementia. 10M more people are diagnosed each year, and the population pyramid is shifting upwards.",
      "ReMind is a conversational AI assistant that closes the gap; it can play cognitive stimulation therapy games based on research, one of which is a memory game with an SO-101 Robot Arm trained on Perceptron AI’s Isaac 0.5 Model.",
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
      { kind: "github", href: "https://github.com/minjunminji/minecraftCVcontroller" },
      { kind: "devpost", href: "https://devpost.com/software/mango-full-body-gesture-control-for-any-game" },
    ],
    tools: [
      [t("Python"), t("MediaPipe Holistic")],
      [t("GitHub Copilot"), t("Cursor"), t("Figma", true)],
    ],
    poster: { color: "--color-poster-mango", text: [["Gesture Controlled", "Minecraft"], ["HelloHacks Winner"]] },
    collage: {
      items: [
        { media: photo("The Mango team with their HelloHacks prizes", mango1), w: 72, x: 26, y: 3, rotate: -2.2, tape: { x: 46, rotate: 4, long: true } },
        { media: photo("Mango tracking a player’s pose", mango2), w: 52, x: 2, y: 40, rotate: 1.8, tape: { x: 34, rotate: -5 } },
        { media: photo("The Mango team at HelloHacks", mango3), w: 54, x: 42, y: 57, rotate: -1, tape: { x: 58, rotate: 2 } },
      ],
    },
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
      { kind: "github", href: "https://github.com/matthewcflam/oysternews" },
      { kind: "site", href: "https://oysternews.xyz/" },
    ],
    tools: [
      [t("Next.js"), t("TypeScript"), t("MapLibre GL JS", true), t("Cloudflare R2", true), t("GitHub Actions", true)],
      [t("Claude Code"), t("Figma", true)],
    ],
    poster: { color: "--color-poster-oyster-news", text: [["Worldwide News,", "Mapped"]] },
    collage: {
      scale: 0.92,
      items: [
        { media: photo("Oyster News, the live map", oysterMap), aspect: 1.55, w: 97, x: 1.5, y: 4, rotate: 1.6, tape: { x: 50, rotate: -3, long: true } },
      ],
    },
    description: [
      "I’ve ALWAYS wanted to combine the two things I waste time on: maps, and the news.",
      "Oyster News pulls geolocated articles from the GDELT GKG API, so users can discover stories based on where they happen.",
    ],
  },
  {
    slug: "portfolio",
    listTitle: "This Portfolio",
    category: "Project",
    year: "2026",
    name: "This Portfolio",
    centerText: true,
    awards: ["#1 in never actually being finished"],
    links: [
      { kind: "github", href: "https://github.com/matthewcflam/annoyingorange" },
      { kind: "site", href: "https://www.matthewlam.ca/" },
    ],
    // Figma lists Next.js; the site is React (user decision: keep React.js).
    tools: [
      [t("React.js"), t("TypeScript"), t("WebGL")],
      [t("Claude Code"), t("Grokbot", true), t("Figma", true)],
    ],
    poster: { color: "--color-poster-portfolio", text: [[":)"]] },
    collage: {
      items: [
        { media: photo("This portfolio’s Figma board", portfolio1), w: 70, x: 28, y: 4, rotate: 1.4, tape: { x: 52, rotate: -4, long: true } },
        // The references keep the grey boxes' shape (219 × 153); the skyline is cropped to it.
        { media: photo("Reference: the Burnaby skyline under Mount Baker", refSkyline), aspect: REF_ASPECT, w: 40, x: 2, y: 12, rotate: -3, tape: { x: 46, rotate: 3 } },
        { media: photo("Reference: the 2xA Studio home page", ref2xa), aspect: REF_ASPECT, href: "https://2xa.studio/", w: 44, x: 8, y: 45, rotate: 2, tape: { x: 60, rotate: -6, long: true } },
        { media: photo("Reference: the Maksym Bleibtgleich home page", refBleibtgleich), aspect: REF_ASPECT, href: "https://bleibtgleich.dev/", w: 46, x: 50, y: 51, rotate: -1.6, tape: { x: 50, rotate: 2 } },
      ],
      marks: [{ src: heartSvg, item: 3, x: -9, y: 20, w: 16 }],
    },
    description: ["Check out some of my references :)"],
  },
];

/** Every item a project's lightbox cycles through: the collage, then the extras. */
export function lightboxMedia(p: Project): Media[] {
  return [...p.collage.items.map((i) => i.media), ...(p.extraMedia ?? [])];
}

