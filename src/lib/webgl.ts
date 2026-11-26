/**
 * The WebGL1 setup the page transition's dither cover (transition/ditherCover.ts)
 * and home's glass card (pages/glass/glassRenderer.ts) share: a transparent,
 * non-antialiased context, a full-screen quad on attribute 0 (`aPos`), and
 * programs that throw on a compile or link error (each caller falls back to
 * CSS then).
 */

export type Uniforms<U extends readonly string[]> = Record<U[number], WebGLUniformLocation | null>;

/** A transparent, straight-alpha WebGL1 context, or null (no WebGL). */
export function createGL(canvas: HTMLCanvasElement): WebGLRenderingContext | null {
  return canvas.getContext("webgl", { alpha: true, antialias: false, premultipliedAlpha: false });
}

function compile(gl: WebGLRenderingContext, type: number, src: string): WebGLShader {
  const s = gl.createShader(type);
  if (!s) throw new Error("createShader failed");
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "shader");
  return s;
}

/** Compile and link a program; its `aPos` attribute is bound to 0 (bindQuad).
 *  Throws on any compile or link error. */
export function linkProgram(gl: WebGLRenderingContext, vert: string, frag: string): WebGLProgram {
  const p = gl.createProgram();
  if (!p) throw new Error("createProgram failed");
  gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vert));
  gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, frag));
  gl.bindAttribLocation(p, 0, "aPos");
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) ?? "link");
  return p;
}

/** A clip-space quad (draw it as a 4-vertex TRIANGLE_STRIP) on attribute 0. */
export function bindQuad(gl: WebGLRenderingContext): void {
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
}

/** Every named uniform's location. */
export function uniforms<U extends readonly string[]>(gl: WebGLRenderingContext, prog: WebGLProgram, names: U): Uniforms<U> {
  const out = {} as Uniforms<U>;
  for (const u of names as readonly U[number][]) out[u] = gl.getUniformLocation(prog, u);
  return out;
}

/** devicePixelRatio, capped (a canvas's cost grows with its square). */
export const cappedDpr = (max: number) => Math.min(window.devicePixelRatio || 1, max);

/** "#RGB", "#RRGGBB" or "rgb(r g b / a)" / "rgba(r, g, b, a)" → [r, g, b, a] in 0–1. */
export function parseColor(css: string): [number, number, number, number] {
  const s = css.trim();
  if (s.startsWith("#")) {
    const hex = s.length === 4 ? [...s.slice(1)].map((c) => c + c).join("") : s.slice(1, 7);
    const n = parseInt(hex, 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255, 1];
  }
  const nums = s.match(/[\d.]+%?/g)?.map((v) => (v.endsWith("%") ? parseFloat(v) / 100 : parseFloat(v))) ?? [];
  const [r = 0, g = 0, b = 0, al = 1] = nums;
  return [r / 255, g / 255, b / 255, al];
}
