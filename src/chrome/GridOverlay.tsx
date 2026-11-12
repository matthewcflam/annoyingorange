import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { loadFlag, saveFlag } from "../lib/prefs";
import "./grid.css";

const KEY = "pref.grid";

const typing = (t: EventTarget | null) =>
  t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));

/**
 * The layout grid from the Figma file (9 stretched columns, 15 margin, 15
 * gutter), drawn over the page. Shift+G toggles it, on every page; the choice
 * is remembered. It is drawn from the same tokens the project page lays out
 * on (tokens.css --grid-*), so the two can't disagree.
 */
export default function GridOverlay() {
  const [on, setOn] = useState(() => loadFlag(KEY));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "KeyG" || !e.shiftKey || e.ctrlKey || e.metaKey || e.altKey || e.repeat || typing(e.target)) return;
      setOn((v) => {
        saveFlag(KEY, !v);
        return !v;
      });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return on ? createPortal(<div className="grid-overlay" aria-hidden="true" />, document.body) : null;
}
