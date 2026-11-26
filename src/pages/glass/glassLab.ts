import whoUrl from "../../../design/figma-glass/who-4x.png";
import figmaUrl from "../../../design/figma-glass/glass-4x.png";
import { GlassRenderer, homeGlassOptions, type GlassParams } from "./glassRenderer";
import { readToken } from "../../lib/tokens";

/**
 * Dev only (/?glass-lab): the calibration bench for the glass card. Renders
 * Figma's own 4x "who?" (design/figma-glass/who-4x.png) through GlassRenderer
 * at Figma's offset, at 4x (the card is 1824×784 CSS px, unit 4), at the top
 * left of the window, so a 1824×784 screenshot of (0, 0) lines up pixel for
 * pixel with Figma's 4x render of the card (glass-4x.png). Compare them with
 * `node scripts/glassDiff.mjs <ours.png>`.
 *
 *   window.__glassLab.set({ SHIFT_GAIN: 0.7 })   re-render with new values
 *   window.__glassLab.show("figma" | "ours")      flip to Figma's render
 */
const W = 1824;
const H = 784;
/** "who?"'s render box from the card's top-left, frame px × 4 (Plugin API). */
const WHO_X = 87.07 * 4;
const WHO_Y = -26.498 * 4;
/** Transparent margin round it, as the live spray canvas has, so the blur
 *  and refraction can reach past the paint. */
const PAD = 80;

export function mountGlassLab(): () => void {
  const root = document.createElement("div");
  root.style.cssText = `position:fixed;inset:0;z-index:100;background:${readToken("--color-home-bg")};overflow:hidden`;
  const src = document.createElement("canvas");
  src.style.cssText = `position:absolute;left:${WHO_X - PAD}px;top:${WHO_Y - PAD}px;width:${884 + 2 * PAD}px;height:${396 + 2 * PAD}px;visibility:hidden`;
  src.width = 884 + 2 * PAD;
  src.height = 396 + 2 * PAD;
  const card = document.createElement("canvas");
  card.style.cssText = `position:absolute;left:0;top:0;width:${W}px;height:${H}px`;
  const figma = document.createElement("img");
  figma.src = figmaUrl;
  figma.style.cssText = `position:absolute;left:0;top:0;width:${W}px;height:${H}px;display:none`;
  root.append(src, card, figma);
  document.body.append(root);

  const glass = new GlassRenderer(card, src, homeGlassOptions());

  const img = new Image();
  img.onload = () => {
    src.getContext("2d")!.drawImage(img, PAD, PAD);
    glass.invalidate();
  };
  img.src = whoUrl;

  const api = {
    set: (p: Partial<GlassParams>) => {
      glass.set(p);
      glass.renderNow();
      return { ...glass.params };
    },
    show: (which: "figma" | "ours") => {
      figma.style.display = which === "figma" ? "block" : "none";
    },
    params: () => ({ ...glass.params }),
  };
  Object.assign(window, { __glassLab: api });

  return () => {
    glass.destroy();
    root.remove();
  };
}
