import type { Sheet } from "./sheets";

/**
 * One sheet of home's paper: a box (placed by home.css) holding a plain image.
 * The texture (fibre, the posters' halftone, the tape's tint) is baked into
 * the file at build time (scripts/paperBake.ts), and the drop shadow is CSS
 * (--paper-shadow*), so a sheet costs one static image and nothing at rest.
 * The photos and posters are <picture>s (AVIF/WebP at the size shown); the
 * tape and the skyline's sheet are one WebP each. Pieces drawn on the sheet
 * (the skyline) go in as children.
 */
export default function PaperSheet({
  sheet,
  className = "",
  placed = false,
  eager = false,
  children,
}: {
  sheet: Sheet;
  className?: string;
  /** Place by the sheet's own box (home.css `.home-paper`: --cx/--cy/--w/--h/--r). */
  placed?: boolean;
  /** The first thing anyone sees (the front print): fetch it first. */
  eager?: boolean;
  children?: React.ReactNode;
}) {
  const style = placed
    ? ({ "--cx": sheet.cx, "--cy": sheet.cy, "--w": sheet.w, "--h": sheet.h, "--r": `${sheet.rotate}deg` } as React.CSSProperties)
    : undefined;
  const c = sheet.crop;
  const crop = c ? { left: `${c.x * 100}%`, top: `${c.y * 100}%`, width: `${c.w * 100}%`, height: `${c.h * 100}%` } : undefined;
  // Posters are hidden on compact; lazy keeps a display:none poster from loading.
  const loading = sheet.kind === "poster" ? "lazy" : "eager";

  return (
    <div className={`paper ${placed ? "home-paper" : ""} ${className}`} data-kind={sheet.kind} style={style} aria-hidden="true">
      {sheet.picture ? (
        <picture>
          {Object.entries(sheet.picture.sources).map(([format, srcset]) => (
            <source key={format} type={`image/${format}`} srcSet={srcset} sizes={sheet.sizes} />
          ))}
          <img
            className="paper__img"
            src={sheet.picture.img.src}
            alt=""
            decoding="async"
            loading={loading}
            fetchPriority={eager ? "high" : undefined}
            draggable={false}
            style={crop}
          />
        </picture>
      ) : (
        <img className="paper__img" src={sheet.src} alt="" decoding="async" draggable={false} style={crop} />
      )}
      {children}
    </div>
  );
}
