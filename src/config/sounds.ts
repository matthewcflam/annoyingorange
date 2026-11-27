/**
 * Sound manifest (spec §9.6). IDs, variant counts, bus and voice limits only;
 * never file paths. Files are discovered at build time from
 * assets-src/sounds/<id>.m4a (variants: <id>.<n>.m4a). Any ID without a file
 * plays the synthesized `placeholder` below, so adding a real sound needs no
 * code change (spec §9.5).
 */

export type Bus = "ui" | "ambient";

export type Placeholder =
  /** Pitched blip: oscillator shape, frequency, length, decay. */
  | { type: "tone"; wave: "sine" | "triangle" | "square"; freq: number; dur: number }
  /** Filtered white-noise burst. `cutoff` is a one-pole lowpass in Hz. */
  | { type: "noise"; cutoff: number; dur: number };

/** How audio/procedural.ts voices the placeholders (the user keeps them as
 *  the real sounds: CLAUDE.md #10, so don't retune them unasked). */
export const PLACEHOLDER_SYNTH = {
  /** Each round-robin variant is detuned by this fraction per step. */
  TONE_DETUNE: 0.06,
  /** A tone decays by e^-TONE_DECAY over its length. */
  TONE_DECAY: 5,
  TONE_AMP: 0.8,
  /** The square wave's peak (the others peak at 1). */
  SQUARE_PEAK: 0.5,
  /** Each noise variant's cutoff rises by this fraction per step. */
  NOISE_CUTOFF_STEP: 0.15,
  NOISE_AMP: 2.5,
  /** Every buffer fades in and out over this long, so it never clicks. */
  EDGE_FADE: 0.004,
} as const;

export interface SoundDef {
  bus: Bus;
  /** Round-robin variants, played as <id>.1 … <id>.n. Omit for a single file. */
  variants?: number;
  /** Max simultaneous voices; the oldest is faded out when exceeded. */
  voices?: number;
  /** Base gain before per-play variation. */
  gain?: number;
  placeholder: Placeholder;
}

export const SOUNDS = {
  // New noise sounds start quiet (≈0.05–0.1; overlapping bursts stack up); raise to taste.
  "station.hover":     { bus: "ui", gain: 0.25, placeholder: { type: "tone", wave: "sine", freq: 880, dur: 0.06 } },
  "station.click":     { bus: "ui", gain: 0.6, placeholder: { type: "tone", wave: "triangle", freq: 1320, dur: 0.4 } },
  "project.select":    { bus: "ui", gain: 0.5, placeholder: { type: "tone", wave: "triangle", freq: 990, dur: 0.18 } },
  "link.hover":        { bus: "ui", gain: 0.2, placeholder: { type: "tone", wave: "sine", freq: 1760, dur: 0.05 } },
  "mute.toggle":       { bus: "ui", gain: 0.5, placeholder: { type: "tone", wave: "triangle", freq: 520, dur: 0.12 } },
} satisfies Record<string, SoundDef>;

export type SoundId = keyof typeof SOUNDS;

/** Volume of the whole site: the master gain when unmuted (every sound and
 *  bus passes through it). 0.5 = the user asked for everything 50% quieter. */
export const MASTER_GAIN = 0.5;

/** spray.hiss (§9.4): looping white noise → highpass → bandpass → gain. The
 *  gain follows nozzle speed every frame (audio/sprayHiss.ts). Started quiet,
 *  like every noise sound here. */
export const SPRAY_HISS = {
  bus: "ambient",
  /** Gain at full nozzle speed (0.08, then 35% and another 25% quieter at the
   *  user's request). */
  gain: 0.020,
  highpassHz: 1500,
  bandpassHz: 4500,
  bandpassQ: 0.8,
} as const satisfies { bus: Bus; gain: number; highpassHz: number; bandpassHz: number; bandpassQ: number };

/** Build-time discovery: "/assets-src/sounds/mute.toggle.m4a" → hashed URL. */
const files = import.meta.glob("/assets-src/sounds/*.m4a", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

/** Map a file key ("mute.toggle", "paint.stroke.2") to its URL. */
export const SOUND_FILES: ReadonlyMap<string, string> = new Map(
  Object.entries(files).map(([path, url]) => [path.slice(path.lastIndexOf("/") + 1, -".m4a".length), url]),
);

/** Every file key a sound can play: ["paint.stroke.1", …] or ["mute.toggle"]. */
export function variantKeys(id: SoundId): string[] {
  const n = (SOUNDS[id] as SoundDef).variants;
  return n ? Array.from({ length: n }, (_, i) => `${id}.${i + 1}`) : [id];
}
