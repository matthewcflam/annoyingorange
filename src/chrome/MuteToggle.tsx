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
 * Sound on/off, home only (spec §9.8). Every load starts muted and the choice
 * isn't saved (user decision). Placeholder look: TODO(open-question #6).
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
      className="mute-toggle interactive"
      aria-label="Sound"
      aria-pressed={!muted}
      aria-keyshortcuts="M"
      title="Sound (M). The iPhone silent switch mutes sound."
      onClick={() => toggle(muted)}
    >
      sound {muted ? "off" : "on"}
    </button>
  );
}
