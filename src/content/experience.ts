/**
 * Experience page copy (Figma "Experience Final", node 460:182). Each job
 * has a section (company, role, date, points) and a row in the index
 * (`listName`, `listDate`, its logo); the extras are index rows only. Logo boxes are Figma px at a 16px body
 * (× --cp in station.css), centred on the row; `crop` is Figma's image
 * placement inside the box, in % (the TQD logo is a sprite).
 */
import enersysLogo from "../../assets-src/images/enersys-logo.png?logo";
import sailbotLogo from "../../assets-src/images/sailbot-logo.png?logo";
import tqdLogo from "../../assets-src/images/tqd-logo.png?logo";
import aquaticLogo from "../../assets-src/images/aquatic-logo.png?logo";
import geeringUpLogo from "../../assets-src/images/geering-up-logo.png?logo";

export interface Logo {
  src: string;
  w: number;
  h: number;
  /** Left offset from the row's start (Figma px). */
  x: number;
  crop?: { w: number; h: number; x: number; y: number };
}

/** A row in the index. */
export interface IndexRow {
  id: string;
  /** The index row's name; "\n" breaks the line. */
  listName: string;
  listDate: string;
  logo: Logo;
}

/** A job with a section on the page. Figma staggers them across the grid:
 *  `col` is the first of its three columns, `row` the grid row it sits in,
 *  and `drop` how far its cap top sits below that row's top (Figma px). */
export interface Job extends IndexRow {
  company: string;
  role: string;
  date: string;
  body: string[];
  col: number;
  row: number;
  drop: number;
}

export const JOBS: Job[] = [
  {
    id: "enersys",
    company: "EnerSys",
    role: "Software Engineering Co-op",
    date: "Summer 2026",
    listName: "EnerSys",
    listDate: "2026",
    logo: { src: enersysLogo, w: 39, h: 39, x: -9 },
    col: 4,
    row: 1,
    drop: 0,
    body: [
      "Built a battery diagnostic tool in C# and XAML detecting incorrect protocol configurations, accelerating troubleshooting",
      "Led cross-team technical demonstrations of the tool, aligning Tech Support and Controller teams on product capabilities",
      "Resolved 10+ controller defects through root-cause analysis and targeted fixes, improving stability on 800+ sites",
      "Executed physical tests on battery systems, validating 90% of targeted functionality for the upcoming release",
    ],
  },
  {
    id: "sailbot",
    company: "UBC Sailbot",
    role: "Software Developer",
    date: "January 2026 - Present",
    listName: "UBC Sailbot",
    listDate: "2026",
    logo: { src: sailbotLogo, w: 21, h: 21, x: 0 },
    // Cap top 580: 88.4 below the foot of EnerSys's photos (491.6), which
    // its row reaches (station.css; content/experiencePhotos.ts), or below
    // its text if that runs longer.
    col: 6,
    row: 2,
    drop: 88.4,
    body: [
      "Developed an interactive React dashboard featuring real-time telemetry, sensor data visualization, and animated UI for autonomous sailboat testing operations",
      "Collaborated in a team of 6 to develop a custom AIS data pipeline to replace a $25K/year commercial service",
      "Split a combined sensor feed into three using MongoDB, TypeScript, and Redux, improving data organization and supporting sensor-specific updates on the dashboard",
    ],
  },
  {
    id: "tqd",
    company: "UBC Third Quadrant Design",
    role: "Software and Operations Lead",
    date: "April 2026 - Present",
    listName: "UBC Third\nQuadrant Design",
    listDate: "2024",
    logo: { src: tqdLogo, w: 21, h: 27, x: 0, crop: { w: 314.93, h: 245.35, x: -8.96, y: -66.28 } },
    // Column 4 (under EnerSys; its text runs into Sailbot's columns, but
    // well below it). Cap top 979: 487.4 below EnerSys's photos.
    col: 4,
    row: 2,
    drop: 487.4,
    body: [
      "Shipped a full-stack hiring portal and reviewer board using React, Next.js, and Supabase, enabling real-time sync, reviewer authentication, and schema validation for 100+ applications",
      "Led the design system for the team’s web product and brand, standardizing UI and visual guidelines across 10+ pages and physical assets to speed up development and keep every touchpoint on-brand",
    ],
  },
];

/** Index rows only, under "Extras": no sections on the page. They wait in the
 *  bottom-left corner and slide up under the jobs at the end of the page. */
export const EXTRAS: IndexRow[] = [
  {
    id: "aquatics",
    listName: "UBC Aquatic Centre",
    listDate: "2025",
    logo: { src: aquaticLogo, w: 21, h: 19, x: 0 },
  },
  {
    id: "geering-up",
    listName: "UBC Geering Up",
    listDate: "2025",
    logo: { src: geeringUpLogo, w: 19, h: 19, x: 1 },
  },
];

export const LOGO_URLS = [...JOBS, ...EXTRAS].map((j) => j.logo.src);

