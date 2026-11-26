/**
 * Route table and station metadata (spec §4.4). Page components are mapped in
 * pages/Outlet.tsx so this file stays free of React. Every path in the site
 * comes from here: write PATHS.about, not "/about".
 */
import { SITE_NAME } from "../content/site";

export type StationId = "about" | "experience" | "projects";
export type RouteId = "home" | StationId;

/** Canonical path per route. */
export const PATHS = {
  home: "/",
  about: "/about",
  experience: "/experience",
  projects: "/projects",
} as const satisfies Record<RouteId, string>;

export type RoutePath = (typeof PATHS)[RouteId];

export interface Station {
  id: StationId;
  label: string;
  /** Where clicking the station goes. */
  path: RoutePath;
}

/** Line order, left to right: About → Experience → Projects. */
export const STATIONS: readonly Station[] = [
  { id: "about", label: "About", path: PATHS.about },
  { id: "experience", label: "Experience", path: PATHS.experience },
  { id: "projects", label: "Projects", path: PATHS.projects },
];

export interface RouteDef {
  path: RoutePath;
  /** Page name for document.title. */
  title: string;
  /** The station this page belongs to (null: home). */
  station: StationId | null;
}

export const ROUTES: readonly RouteDef[] = [
  { path: PATHS.home, title: SITE_NAME, station: null },
  ...STATIONS.map((s) => ({ path: s.path, title: s.label, station: s.id })),
];

/** The projects, in page order (content/projects.ts holds their content). */
export const PROJECT_SLUGS = ["remind", "mango", "oyster-news", "portfolio"] as const;
export type ProjectSlug = (typeof PROJECT_SLUGS)[number];

/** A project's old per-project path (still linked from the list rows, so a
 *  new tab opens /projects scrolled to it). */
export const projectPath = (slug: ProjectSlug) => `${PATHS.projects}/${slug}`;

/** The old per-project pages: all on /projects now (the router remembers
 *  which one, and the page opens scrolled to it). */
const REDIRECTS: Record<string, RoutePath> = Object.fromEntries(PROJECT_SLUGS.map((slug) => [projectPath(slug), PATHS.projects]));

const byPath = new Map<string, RouteDef>(ROUTES.map((r) => [r.path, r]));

/** Canonical path for any URL path: trailing slash stripped, redirects
 *  applied, unknown paths sent home. */
export function resolvePath(path: string): RoutePath {
  const clean = path.length > 1 ? path.replace(/\/+$/, "") : path;
  const target = REDIRECTS[clean] ?? clean;
  return byPath.get(target)?.path ?? PATHS.home;
}

export function routeFor(path: string): RouteDef {
  return byPath.get(resolvePath(path))!;
}

/** The project a `/projects/<slug>` path names, if any (old per-project
 *  links: they open /projects scrolled to it). */
export function projectSlugFromPath(path: string): ProjectSlug | null {
  const prefix = `${PATHS.projects}/`;
  if (!path.startsWith(prefix)) return null;
  const slug = path.slice(prefix.length).replace(/\/$/, "");
  return (PROJECT_SLUGS as readonly string[]).includes(slug) ? (slug as ProjectSlug) : null;
}

export function documentTitle(route: RouteDef): string {
  return route.path === PATHS.home ? route.title : `${route.title} · ${SITE_NAME}`;
}
