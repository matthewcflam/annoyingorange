import { useEffect } from "react";
import { play, setMuted, getContext, isUnlocked, unlock } from "../audio/engine";
import { useMuted } from "../audio/useSound";
import { AUDIO } from "../config/timings";

/** Runs inside a click or keydown, so the first toggle-on can create the AudioContext. */
function toggle(muted: boolean) {
  const next = !muted;
  // MUST stay synchronous in the gesture, before any await (§6.4).
  if (!isUnlocked()) unlock({ muted: next });
  else setMuted(next);
  // Plays on unmute only, once the master ramp is up (§9.6).
  const ctx = getContext();
  if (!next && ctx) play("mute.toggle", { when: ctx.currentTime + AUDIO.MUTE_RAMP });
}

/**
 * Sound on/off, home only (spec §9.8), the last glyph in home's social row
 * (user decision, "Home Page Final"): a speaker, crossed out while muted.
 * Every load starts muted and the choice isn't saved (user decision).
 * Shortcut: M.
 */
export default function MuteToggle() {
  const muted = useMuted();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "m" && e.key !== "M") return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      toggle(muted);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [muted]);

  return (
    <button
      type="button"
      className="social-links__icon social-links__icon--sound interactive"
      aria-label="Sound"
      aria-pressed={!muted}
      data-cursor={muted ? "Sound On" : "Sound Off"}
      aria-keyshortcuts="M"
      title={`Sound ${muted ? "off" : "on"} (M). The iPhone silent switch mutes sound.`}
      onClick={() => toggle(muted)}
    >
      {/* Cropped to the ink of both states (speaker, cross, waves with their strokes). */}
      <svg viewBox="1.5 4.3 20.8 15.4" aria-hidden="true" focusable="false">
        <path fill="currentColor" d="M2.5 8.75h3.9l5.1-4.3a.6.6 0 0 1 1 .46v14.18a.6.6 0 0 1-1 .46l-5.1-4.3H2.5a1 1 0 0 1-1-1v-4.5a1 1 0 0 1 1-1z" />
        <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          {muted ? (
            <path d="M16 9.5l5 5M21 9.5l-5 5" />
          ) : (
            <>
              <path d="M15.6 8.6a4.8 4.8 0 0 1 0 6.8" />
              <path d="M18.6 5.6a9 9 0 0 1 0 12.8" />
            </>
          )}
        </g>
      </svg>
    </button>
  );
}
