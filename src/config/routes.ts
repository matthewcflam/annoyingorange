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
  /** Upper track (left of the diagonal) or lower track. */
  track: "upper" | "lower";
}

/** Line order, left to right: About → Experience → Projects. */
export const STATIONS: readonly Station[] = [
  { id: "about", label: "About", path: "/about", track: "upper" },
  { id: "experience", label: "Experience", path: "/experience", track: "lower" },
  { id: "projects", label: "Projects", path: "/projects/portfolio", track: "lower" },
];

export interface RouteDef {
  path: string;
  /** Page name for document.title. */
  title: string;
  /** The station this page belongs to (null: home). */
  station: StationId | null;
  /** Page colours (global.css): every page is light now (the dark theme is
   *  unused; the dark cover still uses its colour). */
  theme: "light" | "dark";
}

export const ROUTES: readonly RouteDef[] = [
  { path: "/", title: "Matthew Lam", station: null, theme: "light" },
  { path: "/about", title: "About", station: "about", theme: "light" },
  { path: "/experience", title: "Experience", station: "experience", theme: "light" },
  { path: "/projects/portfolio", title: "This Portfolio", station: "projects", theme: "light" },
  { path: "/projects/oyster-news", title: "Oyster News", station: "projects", theme: "light" },
  { path: "/projects/remind", title: "ReMind", station: "projects", theme: "light" },
  { path: "/projects/mango", title: "Mango", station: "projects", theme: "light" },
];

const REDIRECTS: Record<string, string> = {
  "/projects": "/projects/portfolio",
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
