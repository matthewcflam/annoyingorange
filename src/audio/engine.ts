/**
 * The sound engine (spec §9). Module-level singletons only, never created in
 * effects, so React StrictMode can't double them (§4.2).
 *
 *   sources ─┬─> ui bus ──────┬─> master gain ─> limiter ─> destination
 *            └─> ambient bus ─┘
 *
 * Lifecycle:
 * 1. preloadSounds() at app start: fetch + decode every discovered file on an
 *    OfflineAudioContext (exempt from autoplay policy).
 * 2. Sound starts muted on every load (user decision). unlock() runs inside
 *    the first toggle-on gesture (home's sound toggle), synchronously: it
 *    creates the one real AudioContext and resumes it. Creating it earlier
 *    makes Chrome warn. A visitor who never turns sound on never gets one.
 * 3. play() anywhere after that (a no-op before it).
 */
import { MASTER_GAIN, SOUNDS, SOUND_FILES, variantKeys, type Bus, type SoundDef, type SoundId } from "../config/sounds";
import { AUDIO } from "../config/timings";
import { SAMPLE_RATE, synthPlaceholder } from "./procedural";
import { onBrowserIdle } from "../lib/idle";

// ---------------------------------------------------------------------------
// Buffers
// ---------------------------------------------------------------------------

type Source = "file" | "placeholder";
interface Loaded {
  /** null while a file is still decoding, or a placeholder not yet made. */
  buffer: AudioBuffer | null;
  source: Source;
}

/** Keyed by file key: "mute.toggle", "paint.stroke.3". */
const buffers = new Map<string, Loaded>();
let preloadStarted = false;

function placeholderFor(id: SoundId, key: string): AudioBuffer {
  const variant = key === id ? 0 : Number(key.slice(id.length + 1)) - 1;
  return synthPlaceholder((SOUNDS[id] as SoundDef).placeholder, variant);
}

/** A placeholder's buffer, synthesized the first time it's needed (most
 *  visitors never turn sound on, so boot never pays for them). */
function bufferOf(id: SoundId, key: string): AudioBuffer | null {
  const entry = buffers.get(key);
  if (!entry) return null;
  if (!entry.buffer && entry.source === "placeholder") entry.buffer = placeholderFor(id, key);
  return entry.buffer;
}

/** Synthesize every placeholder not made yet (after unlock, when idle). */
function synthPlaceholders() {
  for (const id of Object.keys(SOUNDS) as SoundId[]) for (const key of variantKeys(id)) bufferOf(id, key);
}

/**
 * Decode every discovered sound file; the rest (and any that fail) fall back
 * to synthesized placeholders, made on first use. Idempotent. Resolves when
 * every file has decoded or fallen back.
 */
export function preloadSounds(): Promise<void> {
  if (preloadStarted) return Promise.resolve();
  preloadStarted = true;

  // Module-level decoder: an offline context never triggers autoplay rules,
  // and AudioBuffers are not tied to the context that decoded them.
  const decoder = new OfflineAudioContext(1, 1, SAMPLE_RATE);
  const missing: string[] = [];
  const jobs: Promise<void>[] = [];

  for (const id of Object.keys(SOUNDS) as SoundId[]) {
    for (const key of variantKeys(id)) {
      const url = SOUND_FILES.get(key);
      if (!url) {
        missing.push(key);
        buffers.set(key, { buffer: null, source: "placeholder" });
        continue;
      }
      buffers.set(key, { buffer: null, source: "file" });
      jobs.push(
        fetch(url)
          .then((r) => r.arrayBuffer())
          .then((data) => decoder.decodeAudioData(data))
          .then((buffer) => void buffers.set(key, { buffer, source: "file" }))
          .catch((err) => {
            if (import.meta.env.DEV) console.warn(`[audio] "${key}" failed to decode; using placeholder.`, err);
            buffers.set(key, { buffer: null, source: "placeholder" });
          }),
      );
    }
  }

  if (import.meta.env.DEV && missing.length) {
    console.info(`[audio] ${missing.length} sounds use synthesized placeholders (no file in assets-src/sounds/):`, missing.join(", "));
  }
  return Promise.all(jobs).then(() => undefined);
}

// ---------------------------------------------------------------------------
// Context + graph
// ---------------------------------------------------------------------------

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let buses: Record<Bus, GainNode> | null = null;
let muted = true; // every load starts muted
const listeners = new Set<() => void>();

function notify() {
  for (const l of listeners) l();
}

/** Subscribe to mute / unlock changes (for useSyncExternalStore). */
export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const isMuted = () => muted;
export const isUnlocked = () => ctx !== null;
/** For procedural graphs in later milestones. Null before unlock. */
export const getContext = () => ctx;
export const getBus = (bus: Bus) => buses?.[bus] ?? null;

type AudioSessionNavigator = Navigator & { audioSession?: { type: string } };

/**
 * Create and resume the AudioContext. MUST be called synchronously inside a
 * user gesture handler, before any await (Safari only honours the unlock in
 * the gesture's call stack). Called even when muted, so unmuting later has a
 * running context (§6.4).
 */
export function unlock({ muted: startMuted }: { muted: boolean }): void {
  muted = startMuted;

  if (ctx) {
    void ctx.resume();
    applyMute();
    notify();
    return;
  }

  // Safari: mix with the user's music; the silent switch mutes us. Never
  // "playback", which would pause their music (§9.7).
  const session = (navigator as AudioSessionNavigator).audioSession;
  if (session) {
    try {
      session.type = "ambient";
    } catch {
      /* unsupported value */
    }
  }

  ctx = new AudioContext({ latencyHint: "interactive" });
  void ctx.resume();

  const limiter = new DynamicsCompressorNode(ctx, AUDIO.LIMITER);
  limiter.knee.value = 0;
  limiter.connect(ctx.destination);

  master = new GainNode(ctx, { gain: muted ? 0 : MASTER_GAIN });
  master.connect(limiter);

  buses = {
    ui: new GainNode(ctx),
    ambient: new GainNode(ctx),
  };
  for (const bus of Object.values(buses)) bus.connect(master);

  installLifecycle(ctx);
  notify();
  // Sound is on: make the rest of the placeholders before they're asked for.
  onBrowserIdle(synthPlaceholders, { timeoutMs: AUDIO.SYNTH_IDLE_TIMEOUT_MS, fallbackMs: AUDIO.SYNTH_IDLE_FALLBACK_MS });
}

function applyMute() {
  if (!ctx || !master) return;
  // setTargetAtTime reaches ~95% in 3 time constants: a 50ms ramp, no click.
  master.gain.setTargetAtTime(muted ? 0 : MASTER_GAIN, ctx.currentTime, AUDIO.MUTE_RAMP / 3);
}

/** Mute or unmute with a short ramp. The caller persists the preference. */
export function setMuted(next: boolean): void {
  if (next === muted) return;
  muted = next;
  applyMute();
  notify();
}

function installLifecycle(context: AudioContext) {
  const tryResume = () => {
    if (context.state !== "running" && document.visibilityState === "visible") void context.resume();
  };

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") void context.suspend();
    else tryResume();
  });

  // iOS can leave the context "interrupted" (calls, app switches) and refuse
  // a resume without a gesture, so resume on the next one (§9.3).
  window.addEventListener("pointerdown", tryResume, { capture: true });
  window.addEventListener("keydown", tryResume, { capture: true });
}

if (import.meta.hot) {
  // Dev only: a hot-reloaded engine module must not leave a second context running.
  import.meta.hot.dispose(() => void ctx?.close());
}

// ---------------------------------------------------------------------------
// Playback
// ---------------------------------------------------------------------------

export interface PlayOptions {
  /** AudioContext time to start at. Schedule rhythmic sounds up front (§9.3). */
  when?: number;
}

interface Voice {
  stopped: boolean;
  /** Fade out and stop. Safe to call more than once. */
  stop(fade?: number): void;
}

const voices = new Map<SoundId, Voice[]>();
const roundRobin = new Map<SoundId, number>();

const spread = (amount: number) => 1 + (Math.random() * 2 - 1) * amount;

/** Next decoded variant in round-robin order, skipping any still decoding. */
function nextBuffer(id: SoundId): AudioBuffer | null {
  const keys = variantKeys(id);
  const start = roundRobin.get(id) ?? 0;
  for (let k = 0; k < keys.length; k++) {
    const i = (start + k) % keys.length;
    const buffer = bufferOf(id, keys[i]!);
    if (buffer) {
      roundRobin.set(id, i + 1);
      return buffer;
    }
  }
  return null;
}

/**
 * Play a sound, with a little random gain and rate variation. A no-op until
 * the engine is unlocked or while the buffer isn't ready. Muted plays still
 * run (master gain is 0).
 */
export function play(id: SoundId, opts: PlayOptions = {}): void {
  if (!ctx || !buses) return;
  const buffer = nextBuffer(id);
  if (!buffer) return;

  const context = ctx;
  const def: SoundDef = SOUNDS[id];
  const src = new AudioBufferSourceNode(context, {
    buffer,
    playbackRate: spread(AUDIO.RATE_VARIATION),
  });
  const gain = new GainNode(context, { gain: (def.gain ?? 1) * spread(AUDIO.GAIN_VARIATION) });
  src.connect(gain);
  gain.connect(buses[def.bus]);

  // Voice limit: fade out the oldest before adding a new one.
  const list = voices.get(id) ?? [];
  voices.set(id, list);
  const limit = def.voices ?? AUDIO.DEFAULT_VOICE_LIMIT;
  while (list.length >= limit) list[0]!.stop(AUDIO.VOICE_STEAL_FADE);

  const voice: Voice = {
    stopped: false,
    stop(fade = AUDIO.VOICE_STEAL_FADE) {
      if (voice.stopped) return;
      voice.stopped = true;
      const i = list.indexOf(voice);
      if (i >= 0) list.splice(i, 1);
      const t = context.currentTime;
      gain.gain.cancelScheduledValues(t);
      gain.gain.setValueAtTime(gain.gain.value, t);
      gain.gain.linearRampToValueAtTime(0, t + fade);
      src.stop(t + fade + AUDIO.STOP_TAIL);
    },
  };
  list.push(voice);

  src.onended = () => {
    voice.stopped = true;
    const i = list.indexOf(voice);
    if (i >= 0) list.splice(i, 1);
    gain.disconnect();
  };

  src.start(Math.max(opts.when ?? 0, context.currentTime));
}

/** The link.hover tick for a pointer entering a link or button; touch has no
 *  hover, so it stays silent there. */
export function hoverSound(e: { pointerType: string }): void {
  if (e.pointerType !== "touch") play("link.hover");
}
