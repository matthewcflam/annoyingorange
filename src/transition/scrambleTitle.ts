/**
 * The transition title, "Now arriving at: <name>", scramble-typed on the
 * cover. It is set as groups (the lead and the name), each placed by CSS.
 * A port of 2xa.studio's typer (`typer-*.js`), "inout" mode: it types in,
 * then straight back out, at TITLE_FPS. Each character starts at its own
 * point on a cubic-bezier stagger and, while it is in motion, shows one of the
 * box variants (filled, inverse, accent, border…; styled in transition.css).
 *
 * Frames come from elapsed time on the GSAP ticker instead of 2xa's
 * setInterval, so the title stays in step with the cover.
 */
import { gsap } from "../lib/gsap";
import { TRANSITION } from "../config/timings";
import { clamp } from "../lib/math";

const T = TRANSITION;

export const VARIATIONS = ["charFill", "charInverse", "charAccent", "charAccentInverse", "charAccentFill", "charBorder"];

export const snap = (v: number, step: number) => Math.round(v / step) * step;
const mapRange = (v: number, inMin: number, inMax: number, outMin: number, outMax: number) =>
  ((v - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;

/** CSS cubic-bezier(x1, y1, x2, y2) evaluated at x (2xa's helper). */
export function cubicBezierAt(x: number, x1: number, y1: number, x2: number, y2: number, eps = 1e-6): number {
  const bx = (u: number) => 3 * (1 - u) ** 2 * u * x1 + 3 * (1 - u) * u ** 2 * x2 + u ** 3;
  const by = (u: number) => 3 * (1 - u) ** 2 * u * y1 + 3 * (1 - u) * u ** 2 * y2 + u ** 3;
  const dx = (u: number) => 3 * (1 - u) ** 2 * x1 + 6 * (1 - u) * u * (x2 - x1) + 3 * u ** 2 * (1 - x2);
  let u = x;
  for (let i = 0; i < 8; i++) {
    const err = bx(u) - x;
    if (Math.abs(err) < eps) return by(u);
    const d = dx(u);
    if (Math.abs(d) < 1e-6) break;
    u -= err / d;
  }
  let lo = 0;
  let hi = 1;
  u = x;
  while (lo < hi) {
    const v = bx(u);
    if (Math.abs(v - x) < eps) break;
    if (x > v) lo = u;
    else hi = u;
    u = (lo + hi) / 2;
  }
  return by(u);
}

/** Frames to type `length` characters in (typing out takes as many again). */
export function titleFrames(length: number): number {
  return length ? Math.round(T.TITLE_FPS * T.TITLE_SECONDS * (1 + length * T.TITLE_STRETCH_PER_CHAR)) : 0;
}

/** When character `i` of `length` starts, as a fraction of the type-in. */
export function charStart(i: number, length: number): number {
  return snap(cubicBezierAt(i / (length > 1 ? length - 1 : 1), ...T.TITLE_START_CURVE), T.TITLE_START_SNAP);
}

/** A character's class at `frame` (0 → 2 × frames: in, then out), given its
 *  start `cp` and the shuffled box `variations`. */
export function charClass(frame: number, frames: number, cp: number, variations: readonly string[]): string {
  const denominator = frames - frames * T.TITLE_CYCLE_LENGTH || 1;
  const out = frame > frames;
  const h = (out ? frame - frames : frame) / denominator;
  const e = clamp(snap(h - cp, T.TITLE_PROGRESS_SNAP), 0, 1);
  let variant = "charInit";
  if (e > 0) variant = variations[Math.round(mapRange(e, 0, 1, 0, T.TITLE_CYCLES)) % variations.length]!;
  if (e >= 1) variant = "";
  const moving = variant ? `char ${variant}` : "char";
  return out
    ? e <= 0 ? "char" : e >= 1 ? "char charInit" : moving
    : e <= 0 ? "char charInit" : e >= 1 ? "char" : moving;
}

interface CharNode {
  el: HTMLSpanElement;
  /** When this character starts, as a fraction of the type-in. */
  cp: number;
  cls: string;
}

class ScrambleTitle {
  readonly el = document.createElement("span");

  private chars: CharNode[] = [];
  private frames = 0;
  private variations = [...VARIATIONS];
  private start = 0;
  private done: (() => void) | null = null;

  constructor() {
    this.el.className = "transition__title";
    this.el.dataset.state = "initial";
  }

  /** Type `groups` in and back out. Resolves when it has typed out (or is replaced). */
  run(groups: string[]): Promise<void> {
    this.stop();
    this.build(groups);
    if (!this.chars.length) return Promise.resolve();
    this.variations.sort(() => 0.5 - Math.random());
    this.el.dataset.state = "running";
    this.start = gsap.ticker.time;
    this.apply(0);
    gsap.ticker.add(this.tick);
    return new Promise((resolve) => (this.done = resolve));
  }

  /** Reduced motion: the name, plainly, until hidden. */
  showStatic(groups: string[]): void {
    this.stop();
    this.build(groups);
    for (const c of this.chars) this.setClass(c, "char");
    this.el.dataset.state = "static";
  }

  hide(): void {
    this.stop();
    this.el.dataset.state = "initial";
  }

  private stop() {
    gsap.ticker.remove(this.tick);
    this.done?.();
    this.done = null;
  }

  /** One stagger runs across all groups, so the name types after the lead. */
  private build(groups: string[]) {
    this.el.textContent = "";
    this.chars = [];
    const length = groups.join("").replace(/\s/g, "").length;
    this.frames = titleFrames(length);
    let i = 0;
    groups.forEach((text, g) => {
      const group = document.createElement("span");
      group.className = `transition__group transition__group--${g}`;
      for (const part of text.split(/(\s+)/)) {
        if (part.trim() === "") {
          if (part) group.append(part);
          continue;
        }
        const word = document.createElement("span");
        word.className = "word";
        for (const ch of part) {
          const el = document.createElement("span");
          el.className = "char charInit";
          el.textContent = ch;
          const cp = charStart(i, length);
          this.chars.push({ el, cp, cls: el.className });
          word.append(el);
          i += 1;
        }
        group.append(word);
      }
      this.el.append(group);
    });
  }

  private tick = () => {
    const total = this.frames * 2;
    const frame = clamp(Math.floor((gsap.ticker.time - this.start) * T.TITLE_FPS), 0, total);
    this.apply(frame);
    if (frame >= total) {
      this.stop();
      this.el.dataset.state = "initial";
    }
  };

  private apply(frame: number) {
    for (const c of this.chars) this.setClass(c, charClass(frame, this.frames, c.cp, this.variations));
  }

  private setClass(c: CharNode, cls: string) {
    if (cls === c.cls) return;
    c.cls = cls;
    c.el.className = cls;
  }
}

export const title = new ScrambleTitle();
