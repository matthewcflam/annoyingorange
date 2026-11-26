/**
 * Route table and station metadata (spec §4.4). Page components are mapped in
 * pages/Outlet.tsx so this file stays free of React.
 */

export type StationId = "about" | "experience" | "projects";

export interface Station {
  id: StationId;
  label: string;
  /** Where clicking the station goes. */
  path: string;
}

/** Line order, left to right: About → Experience → Projects. */
export const STATIONS: readonly Station[] = [
  { id: "about", label: "About", path: "/about" },
  { id: "experience", label: "Experience", path: "/experience" },
  { id: "projects", label: "Projects", path: "/projects" },
];

export interface RouteDef {
  path: string;
  /** Page name for document.title. */
  title: string;
  /** The station this page belongs to (null: home). */
  station: StationId | null;
}

export const ROUTES: readonly RouteDef[] = [
  { path: "/", title: "Matthew Lam", station: null },
  { path: "/about", title: "About", station: "about" },
  { path: "/experience", title: "Experience", station: "experience" },
  { path: "/projects", title: "Projects", station: "projects" },
];

/** The old per-project pages: all on /projects now (the router remembers
 *  which one, and the page opens scrolled to it). */
const REDIRECTS: Record<string, string> = {
  "/projects/remind": "/projects",
  "/projects/mango": "/projects",
  "/projects/oyster-news": "/projects",
  "/projects/portfolio": "/projects",
};

const byPath = new Map(ROUTES.map((r) => [r.path, r]));

/** Canonical path for any URL path: trailing slash stripped, redirects
 *  applied, unknown paths sent home. */
export function resolvePath(path: string): string {
  const clean = path.length > 1 ? path.replace(/\/+$/, "") : path;
  const target = REDIRECTS[clean] ?? clean;
  return byPath.has(target) ? target : "/";
}

export function routeFor(path: string): RouteDef {
  return byPath.get(resolvePath(path))!;
}

export function documentTitle(route: RouteDef): string {
  return route.path === "/" ? route.title : `${route.title} · Matthew Lam`;
}
