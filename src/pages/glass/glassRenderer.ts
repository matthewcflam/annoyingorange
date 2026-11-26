import { gsap } from "../../lib/gsap";
import { GLASS } from "../../config/timings";
import { readToken } from "../../lib/tokens";
import { bindQuad, cappedDpr, createGL, linkProgram, parseColor, uniforms, type Uniforms } from "../../lib/webgl";
import type { SprayEngine } from "../../spray/sprayEngine";

/**
 * Figma's Glass effect, drawn in WebGL1 from a canvas that lies under the
 * glass (home: the "who?" spray). CSS can't do it: backdrop-filter has no
 * refraction outside Chromium (url() filters), and never samples past the
 * element's edge. What's under home's card is the flat page plus our own
 * canvas, so the renderer rebuilds the backdrop from that canvas:
 *
 *   1. upload the source canvas (premultiplied);
 *   2. frost: a separable Gaussian blur into two framebuffers;
 *   3. the glass, per card pixel: a rounded-rect SDF `d` and its outward
 *      normal `n`; inside the bevel (DEPTH from the edge) the backdrop is
 *      read from further in, `p - n * shift`, so the rim magnifies what's
 *      behind it (shift = t^mix(2,1,splay) × DEPTH × REFRACTION × gain, t
 *      going 0 → 1 across the bevel); R, G and B read at slightly different
 *      shifts (dispersion); then over the page colour, the glass fill, and
 *      the light: across the same bevel the side facing LIGHT_ANGLE shades
 *      darker and the opposite side a touch brighter (measured off Figma's
 *      render: it is a signed edge shade, not a white glow).
 *
 * The maths follows the figma_glass recreation (MIT; Figma's own shader is
 * closed), calibrated against a 4x Figma render (GLASS in timings.ts).
 * It draws only when asked (`invalidate()`: new paint, a resize), at most once
 * per frame; nothing runs while nothing changes.
 */

export type GlassParams = { -readonly [K in keyof typeof GLASS]: number };

export interface GlassOptions {
  /** The glass's width in design px (its unit = CSS width / designWidth). */
  designWidth: number;
  /** Corner radius, design px. */
  radius: number;
  /** Page colour under the glass, and the glass fill, as [r, g, b, a] 0–1. */
  background: [number, number, number];
  fill: [number, number, number, number];
  /** Called once if WebGL goes away; the page shows its CSS fallback. */
  onLost?: () => void;
  params?: Partial<GlassParams>;
}

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

/** One axis of the Gaussian, 25 taps spread to cover ±3σ. */
const BLUR_FRAG = `
precision highp float;
uniform sampler2D uTex;
uniform vec2 uSize;
uniform vec2 uDir;
uniform float uSigma;
void main() {
  vec2 uv = gl_FragCoord.xy / uSize;
  if (uSigma < 0.3) { gl_FragColor = texture2D(uTex, uv); return; }
  float step = max(1.0, uSigma * 3.0 / 12.0);
  vec4 acc = vec4(0.0);
  float wsum = 0.0;
  for (int i = -12; i <= 12; i++) {
    float x = float(i) * step;
    float w = exp(-0.5 * x * x / (uSigma * uSigma));
    acc += texture2D(uTex, uv + uDir * x / uSize) * w;
    wsum += w;
  }
  gl_FragColor = acc / wsum;
}
`;

const GLASS_FRAG = `
precision highp float;
uniform sampler2D uTex;      // the frosted source, premultiplied
uniform vec2 uSize;          // card, device px
uniform vec2 uSrcPos;        // source's top-left relative to the card, device px
uniform vec2 uSrcSize;       // source size, device px
uniform float uRadius;       // device px
uniform float uDepth;        // bevel width, device px
uniform float uShift;        // edge shift at t = 1, device px
uniform float uSplay;
uniform float uDisp;         // dispersion × gain
uniform vec3 uBg;
uniform vec4 uFill;
uniform vec2 uLight;         // light direction, y down
uniform float uShade;        // SHADE_GAIN × LIGHT_INTENSITY
uniform float uShadePow;
uniform float uGlow;         // GLOW_GAIN × LIGHT_INTENSITY
uniform float uGlowPow;

float sdRoundRect(vec2 p, vec2 h, float r) {
  vec2 q = abs(p) - h + r;
  return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
}

vec4 backdrop(vec2 p) {
  vec2 uv = (p - uSrcPos) / uSrcSize;
  if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) return vec4(0.0);
  return texture2D(uTex, uv);
}

void main() {
  // Top-left origin, like the DOM (and the uploaded texture's rows).
  vec2 p = vec2(gl_FragCoord.x, uSize.y - gl_FragCoord.y);
  vec2 c = p - uSize * 0.5;
  vec2 h = uSize * 0.5;
  float r = min(uRadius, min(h.x, h.y));
  float d = sdRoundRect(c, h, r);

  vec2 e = vec2(1.0, 0.0);
  vec2 g = vec2(
    sdRoundRect(c + e.xy, h, r) - sdRoundRect(c - e.xy, h, r),
    sdRoundRect(c + e.yx, h, r) - sdRoundRect(c - e.yx, h, r));
  vec2 n = g / max(length(g), 1e-5);

  // The bevel: t is 1 at the edge, 0 at uDepth inside.
  float t = clamp(1.0 + d / max(uDepth, 1.0), 0.0, 1.0);
  float lens = pow(t, mix(2.0, 1.0, uSplay));
  float shift = lens * uShift;

  vec4 sr = backdrop(p - n * shift * (1.0 - uDisp));
  vec4 sg = backdrop(p - n * shift);
  vec4 sb = backdrop(p - n * shift * (1.0 + uDisp));
  vec3 col = vec3(
    sr.r + uBg.r * (1.0 - sr.a),
    sg.g + uBg.g * (1.0 - sg.a),
    sb.b + uBg.b * (1.0 - sb.a));

  col = mix(col, uFill.rgb, uFill.a);

  // The light, over the bevel (t², as the refraction): the edge facing the
  // light shades, the one facing away brightens; side-on edges stay.
  float dt = dot(n, uLight);
  float tt = t * t;
  col += tt * (dt >= 0.0 ? -uShade * pow(dt, uShadePow) : uGlow * pow(-dt, uGlowPow));

  float aa = clamp(0.5 - d, 0.0, 1.0);
  gl_FragColor = vec4(col, aa);
}
`;

const GLASS_UNIFORMS = [
  "uTex", "uSize", "uSrcPos", "uSrcSize", "uRadius", "uDepth", "uShift", "uSplay", "uDisp",
  "uBg", "uFill", "uLight", "uShade", "uShadePow", "uGlow", "uGlowPow",
] as const;
const BLUR_UNIFORMS = ["uTex", "uSize", "uDir", "uSigma"] as const;

interface Target {
  tex: WebGLTexture;
  fb: WebGLFramebuffer;
}

export class GlassRenderer {
  readonly params: GlassParams;
  private gl: WebGLRenderingContext | null = null;
  private glassProg: WebGLProgram | null = null;
  private blurProg: WebGLProgram | null = null;
  private glassLoc = {} as Uniforms<typeof GLASS_UNIFORMS>;
  private blurLoc = {} as Uniforms<typeof BLUR_UNIFORMS>;
  private srcTex: WebGLTexture | null = null;
  private targets: Target[] = [];
  private targetSize: [number, number] = [0, 0];
  private pending = false;
  private destroyed = false;
  /** Layout, cached (measure()): CSS px. */
  private geo = { w: 0, h: 0, sx: 0, sy: 0, sw: 0, sh: 0, dpr: 1 };
  private readonly resizeObserver: ResizeObserver;
  /** Public so the lab can poke it (`__glass.canvas`) in dev. */
  readonly canvas: HTMLCanvasElement;
  private readonly source: HTMLCanvasElement;
  private readonly opts: GlassOptions;

  constructor(canvas: HTMLCanvasElement, source: HTMLCanvasElement, opts: GlassOptions) {
    this.canvas = canvas;
    this.source = source;
    this.opts = opts;
    this.params = { ...GLASS, ...opts.params };
    canvas.addEventListener("webglcontextlost", this.onLost);
    this.init();
    this.resizeObserver = new ResizeObserver(() => this.measure());
    this.resizeObserver.observe(canvas);
    this.resizeObserver.observe(source);
    window.addEventListener("resize", this.onResize);
  }

  /** WebGL is up (false: show the CSS fallback). */
  get ok(): boolean {
    return this.gl !== null;
  }

  /** Redraw on the next tick (coalesced). */
  invalidate = (): void => {
    if (this.pending || this.destroyed || !this.gl) return;
    this.pending = true;
    gsap.ticker.add(this.frame, true);
  };

  /** Re-read the layout (the card or the source moved or resized). */
  measure = (): void => {
    const a = this.canvas.getBoundingClientRect();
    const b = this.source.getBoundingClientRect();
    const dpr = cappedDpr(this.params.MAX_DPR);
    this.geo = { w: a.width, h: a.height, sx: b.left - a.left, sy: b.top - a.top, sw: b.width, sh: b.height, dpr };
    const cw = Math.max(1, Math.round(a.width * dpr));
    const ch = Math.max(1, Math.round(a.height * dpr));
    if (this.canvas.width !== cw || this.canvas.height !== ch) {
      this.canvas.width = cw;
      this.canvas.height = ch;
    }
    this.invalidate();
  };

  /** Dev (the lab): change parameters and redraw. */
  set(params: Partial<GlassParams>): void {
    Object.assign(this.params, params);
    this.invalidate();
  }

  /** Draw now (the lab reads the canvas straight after). */
  renderNow(): void {
    this.pending = false;
    this.render();
  }

  destroy(): void {
    this.destroyed = true;
    gsap.ticker.remove(this.frame);
    this.resizeObserver.disconnect();
    window.removeEventListener("resize", this.onResize);
    this.canvas.removeEventListener("webglcontextlost", this.onLost);
    const gl = this.gl;
    if (gl) {
      for (const t of this.targets) {
        gl.deleteTexture(t.tex);
        gl.deleteFramebuffer(t.fb);
      }
      gl.deleteTexture(this.srcTex);
      gl.deleteProgram(this.glassProg);
      gl.deleteProgram(this.blurProg);
    }
    this.gl = null;
  }

  // -------------------------------------------------------------------------

  private onResize = () => this.measure();

  private onLost = (e: Event) => {
    e.preventDefault();
    this.gl = null;
    this.opts.onLost?.();
  };

  private frame = () => {
    this.pending = false;
    this.render();
  };

  private init() {
    const gl = createGL(this.canvas);
    if (!gl) return;
    try {
      this.blurProg = linkProgram(gl, VERT, BLUR_FRAG);
      this.glassProg = linkProgram(gl, VERT, GLASS_FRAG);
    } catch (err) {
      if (import.meta.env.DEV) console.warn("Glass: WebGL setup failed; using the CSS blur.", err);
      return;
    }
    this.blurLoc = uniforms(gl, this.blurProg, BLUR_UNIFORMS);
    this.glassLoc = uniforms(gl, this.glassProg, GLASS_UNIFORMS);
    bindQuad(gl);

    this.srcTex = this.texture(gl);
    // The 2D canvas is premultiplied inside; keep it so, so the blur doesn't
    // darken the paint's soft edges.
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    this.gl = gl;
  }

  private texture(gl: WebGLRenderingContext): WebGLTexture {
    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return tex;
  }

  /** Two framebuffers the size of the source (the blur's ping-pong). */
  private ensureTargets(w: number, h: number) {
    const gl = this.gl!;
    if (this.targets.length && this.targetSize[0] === w && this.targetSize[1] === h) return;
    for (const t of this.targets) {
      gl.deleteTexture(t.tex);
      gl.deleteFramebuffer(t.fb);
    }
    this.targets = [0, 1].map(() => {
      const tex = this.texture(gl);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      const fb = gl.createFramebuffer()!;
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      return { tex, fb };
    });
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    this.targetSize = [w, h];
  }

  private render() {
    const gl = this.gl;
    const src = this.source;
    const { w, h, sx, sy, sw, sh, dpr } = this.geo;
    if (!gl || !w || !h || !sw || !sh || !src.width || !src.height) return;
    const P = this.params;
    const unit = w / this.opts.designWidth; // CSS px per design px

    // 1. The source, as it is now.
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.srcTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);

    // 2. Frost: H into target 0, V into target 1 (sigma in source texels).
    const [tw, th] = [src.width, src.height];
    this.ensureTargets(tw, th);
    const sigma = P.FROST * P.FROST_SCALE * unit * (tw / sw);
    gl.useProgram(this.blurProg);
    gl.uniform1i(this.blurLoc.uTex, 0);
    gl.uniform2f(this.blurLoc.uSize, tw, th);
    gl.uniform1f(this.blurLoc.uSigma, sigma);
    gl.viewport(0, 0, tw, th);
    const passes: [WebGLTexture, Target, [number, number]][] = [
      [this.srcTex!, this.targets[0], [1, 0]],
      [this.targets[0].tex, this.targets[1], [0, 1]],
    ];
    for (const [from, to, dir] of passes) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, to.fb);
      gl.bindTexture(gl.TEXTURE_2D, from);
      gl.uniform2f(this.blurLoc.uDir, dir[0], dir[1]);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    // 3. The glass, onto the card canvas.
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.useProgram(this.glassProg);
    gl.bindTexture(gl.TEXTURE_2D, this.targets[1].tex);
    const L = this.glassLoc;
    const k = unit * dpr; // device px per design px
    const a = (P.LIGHT_ANGLE * Math.PI) / 180;
    const { background: bg, fill } = this.opts;
    gl.uniform1i(L.uTex, 0);
    gl.uniform2f(L.uSize, this.canvas.width, this.canvas.height);
    gl.uniform2f(L.uSrcPos, sx * dpr, sy * dpr);
    gl.uniform2f(L.uSrcSize, sw * dpr, sh * dpr);
    gl.uniform1f(L.uRadius, this.opts.radius * k);
    gl.uniform1f(L.uDepth, P.DEPTH * k);
    gl.uniform1f(L.uShift, P.DEPTH * P.REFRACTION * P.SHIFT_GAIN * k);
    gl.uniform1f(L.uSplay, P.SPLAY);
    gl.uniform1f(L.uDisp, P.DISPERSION * P.DISPERSION_GAIN);
    gl.uniform3f(L.uBg, bg[0], bg[1], bg[2]);
    gl.uniform4f(L.uFill, fill[0], fill[1], fill[2], fill[3]);
    gl.uniform2f(L.uLight, Math.sin(a), -Math.cos(a));
    gl.uniform1f(L.uShade, P.SHADE_GAIN * P.LIGHT_INTENSITY);
    gl.uniform1f(L.uShadePow, P.SHADE_POWER);
    gl.uniform1f(L.uGlow, P.GLOW_GAIN * P.LIGHT_INTENSITY);
    gl.uniform1f(L.uGlowPow, P.GLOW_POWER);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
}

/** Home's card (Figma "Rectangle 157": 456 wide, radius 50) over the page
 *  colour, with the --glass-fill tint. The lab (glassLab.ts) uses it too. */
export function homeGlassOptions(): GlassOptions {
  const bg = parseColor(readToken("--color-home-bg"));
  return {
    designWidth: 456,
    radius: 50,
    background: [bg[0], bg[1], bg[2]],
    fill: parseColor(readToken("--glass-fill")),
  };
}

/** Home's card over the "who?" spray: draws the glass on `canvas` from the
 *  spray's canvas, redrawing as it paints. Sets data-glass="gl" on the card
 *  while WebGL is up (home.css drops the CSS blur then). Returns the teardown. */
export function attachHomeGlass(card: HTMLElement, canvas: HTMLCanvasElement, engine: SprayEngine): () => void {
  const glass = new GlassRenderer(canvas, engine.canvas, {
    ...homeGlassOptions(),
    onLost: () => delete card.dataset.glass,
  });
  if (glass.ok) card.dataset.glass = "gl";
  const unsubscribe = engine.onDraw(glass.invalidate);
  if (import.meta.env.DEV) Object.assign(window, { __glass: glass });
  return () => {
    unsubscribe();
    glass.destroy();
    delete card.dataset.glass;
  };
}
