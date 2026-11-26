import { useState } from "react";
import { createPortal } from "react-dom";
import { loadFlag, saveFlag } from "../lib/prefs";
import { useShortcut } from "../lib/useShortcut";
import "./grid.css";

const KEY = "pref.grid";

/**
 * The layout grid from the Figma file (9 stretched columns, 15 margin, 15
 * gutter), drawn over the page. Shift+G toggles it, on every page; the choice
 * is remembered. It is drawn from the same tokens the project page lays out
 * on (tokens.css --grid-*), so the two can't disagree.
 */
export default function GridOverlay() {
  const [on, setOn] = useState(() => loadFlag(KEY));

  useShortcut(
    (e) => e.code === "KeyG" && e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey,
    () => {
      // Saved here, not in a state updater (StrictMode runs those twice).
      saveFlag(KEY, !on);
      setOn(!on);
    },
  );

  return on ? createPortal(<div className="grid-overlay" aria-hidden="true" />, document.body) : null;
}
