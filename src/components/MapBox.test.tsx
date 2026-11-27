// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import MapBox from "./MapBox";

// The page's preloading and sounds play no part here.
vi.mock("../lib/assets", () => ({ prefetchRoute: vi.fn(), preloadRoute: vi.fn() }));
vi.mock("../audio/engine", () => ({ hoverSound: vi.fn(), play: vi.fn() }));

afterEach(cleanup);

/** StationChrome's part: it owns `open`. */
function Harness({ variant }: { variant?: "corner" | "home" }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <MapBox open={variant === "home" || open} onOpenChange={setOpen} variant={variant} />
      <p>outside</p>
    </>
  );
}

const toggle = () => screen.getByRole("button", { name: "Map" });
/** A keyboard press on a button is a click with detail 0. */
const keyClick = (el: HTMLElement) => fireEvent.click(el, { detail: 0 });

describe("MapBox", () => {
  it("opens and closes from the keyboard", () => {
    render(<Harness />);
    const button = toggle();
    expect(button.getAttribute("aria-expanded")).toBe("false");
    expect(screen.getByRole("navigation", { hidden: true }).inert).toBe(true);
    keyClick(button);
    expect(button.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByRole("navigation").inert).toBe(false);
    keyClick(button);
    expect(button.getAttribute("aria-expanded")).toBe("false");
  });

  it("names the card it controls", () => {
    render(<Harness />);
    const nav = screen.getByRole("navigation", { hidden: true });
    expect(toggle().getAttribute("aria-controls")).toBe(nav.id);
  });

  it("closes on Escape and gives focus back to Map", () => {
    render(<Harness />);
    keyClick(toggle());
    screen.getAllByRole("link")[1]!.focus();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(toggle().getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(toggle());
  });

  it("closes on a press outside, not inside", () => {
    render(<Harness />);
    keyClick(toggle());
    fireEvent.pointerDown(screen.getAllByRole("link")[0]!);
    expect(toggle().getAttribute("aria-expanded")).toBe("true");
    fireEvent.pointerDown(screen.getByText("outside"));
    expect(toggle().getAttribute("aria-expanded")).toBe("false");
  });

  it("only opens on a mouse click (a hover may have opened it already)", () => {
    render(<Harness />);
    const button = toggle();
    fireEvent.pointerDown(button, { pointerType: "mouse" });
    fireEvent.click(button, { detail: 1 });
    expect(button.getAttribute("aria-expanded")).toBe("true");
    fireEvent.pointerDown(button, { pointerType: "mouse" });
    fireEvent.click(button, { detail: 1 });
    expect(button.getAttribute("aria-expanded")).toBe("true");
  });

  it("opens on mouse hover and closes after the pointer leaves", () => {
    vi.useFakeTimers();
    try {
      const { container } = render(<Harness />);
      const box = container.querySelector(".map-box")!;
      fireEvent.pointerEnter(box, { pointerType: "mouse" });
      act(() => void vi.advanceTimersByTime(1000));
      expect(toggle().getAttribute("aria-expanded")).toBe("true");
      fireEvent.pointerLeave(box, { pointerType: "mouse" });
      act(() => void vi.advanceTimersByTime(2000));
      expect(toggle().getAttribute("aria-expanded")).toBe("false");
    } finally {
      vi.useRealTimers();
    }
  });

  it("lists Home and every station, the current one marked", () => {
    render(<Harness />);
    const links = screen.getAllByRole("link", { hidden: true });
    expect(links.map((a) => a.getAttribute("aria-label"))).toEqual(["Home", "About", "Experience", "Projects"]);
    expect(links.filter((a) => a.getAttribute("aria-current") === "page")).toHaveLength(1);
  });

  it("is a pinned card on home: no button, nothing closes it", () => {
    render(<Harness variant="home" />);
    expect(screen.queryByRole("button")).toBeNull();
    fireEvent.keyDown(window, { key: "Escape" });
    fireEvent.pointerDown(screen.getByText("outside"));
    expect(screen.getByRole("navigation", { name: "Map" }).inert).toBe(false);
  });
});
