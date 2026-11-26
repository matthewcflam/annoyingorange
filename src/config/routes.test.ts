import { describe, expect, it } from "vitest";
import { documentTitle, PATHS, PROJECT_SLUGS, projectPath, projectSlugFromPath, resolvePath, routeFor, ROUTES, STATIONS } from "./routes";
import { SITE_NAME } from "../content/site";

describe("resolvePath", () => {
  it("keeps every canonical path", () => {
    for (const path of Object.values(PATHS)) expect(resolvePath(path)).toBe(path);
  });

  it("strips trailing slashes", () => {
    expect(resolvePath("/about/")).toBe(PATHS.about);
    expect(resolvePath("/experience//")).toBe(PATHS.experience);
    expect(resolvePath("/")).toBe(PATHS.home);
  });

  it("sends the old per-project pages to /projects", () => {
    for (const slug of PROJECT_SLUGS) {
      expect(resolvePath(projectPath(slug))).toBe(PATHS.projects);
      expect(resolvePath(`${projectPath(slug)}/`)).toBe(PATHS.projects);
    }
  });

  it("sends unknown paths home", () => {
    expect(resolvePath("/nope")).toBe(PATHS.home);
    expect(resolvePath("/projects/nope")).toBe(PATHS.home);
    expect(resolvePath("/ABOUT")).toBe(PATHS.home);
    expect(resolvePath("")).toBe(PATHS.home);
  });
});

describe("projectSlugFromPath", () => {
  it("reads the slug of an old project link", () => {
    expect(projectSlugFromPath("/projects/mango")).toBe("mango");
    expect(projectSlugFromPath("/projects/oyster-news/")).toBe("oyster-news");
  });

  it("is null for anything else", () => {
    expect(projectSlugFromPath("/projects")).toBeNull();
    expect(projectSlugFromPath("/projects/")).toBeNull();
    expect(projectSlugFromPath("/projects/nope")).toBeNull();
    expect(projectSlugFromPath("/about")).toBeNull();
  });
});

describe("route table", () => {
  it("has one route per path and one per station", () => {
    expect(new Set(ROUTES.map((r) => r.path)).size).toBe(ROUTES.length);
    expect(ROUTES.filter((r) => r.station).map((r) => r.station)).toEqual(STATIONS.map((s) => s.id));
  });

  it("titles home with the site name alone, stations with both", () => {
    expect(documentTitle(routeFor("/"))).toBe(SITE_NAME);
    expect(documentTitle(routeFor("/about"))).toBe(`About · ${SITE_NAME}`);
    expect(documentTitle(routeFor("/projects/mango"))).toBe(`Projects · ${SITE_NAME}`);
    expect(documentTitle(routeFor("/nope"))).toBe(SITE_NAME);
  });
});
