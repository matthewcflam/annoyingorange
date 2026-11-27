import { useEffect, useRef, useState, type CSSProperties } from "react";
import { play } from "../../audio/engine";
import type { Picture } from "../../lib/picture";
import type { CollageItem, Project } from "../../content/projects";
import { lightboxMedia } from "../../content/projects";
import PaperSheet from "../../components/paper/PaperSheet";
import type { Sheet } from "../../components/paper/sheet";
import { TAPE_LONG, TAPE_SHORT } from "../../components/paper/tapes";
import { CURSOR_LABEL } from "../../content/ui";
import { collageHeight, collageSizes, printAspect } from "./collageGeometry";
import Lightbox from "./Lightbox";
import "./collage.css";

/** A piece's place in the collage (collage.css reads the custom properties). */
function pieceStyle(it: CollageItem, i: number): CSSProperties {
  return { "--w": it.w, "--x": it.x, "--y": it.y, "--r": `${it.rotate}deg`, zIndex: i + 1 };
}

/** A photo print (placeholders are a plain grey sheet, collage.css). The
 *  sheet's own box is unused: the piece places it. */
function printSheet(it: CollageItem, picture: Picture, i: number, scale?: number): Sheet {
  return { id: `print-${i}`, kind: "photo", cx: 0, cy: 0, w: 0, h: 0, rotate: 0, picture, sizes: collageSizes(it, scale) };
}

/** Its strip of tape. */
function tapeSheet(it: CollageItem, i: number): Sheet {
  return { id: `tape-${i}`, kind: "tape", cx: 0, cy: 0, w: 0, h: 0, rotate: 0, src: it.tape.long ? TAPE_LONG : TAPE_SHORT };
}

const cursorFor = (it: CollageItem) =>
  // Photos show the ring alone (user request: no label).
  it.media.kind === "image" ? undefined : it.media.kind === "video" ? CURSOR_LABEL.playVideo : CURSOR_LABEL.expand;

/**
 * A project's media (columns 6–8, or 3–5 on a mirrored block): its pieces as
 * taped prints (home's and Experience's paper, components/paper/), placed by
 * hand overlapping and a little crooked, with hand-drawn marks on them (user
 * request: no board behind them). A click on a print expands it into a
 * centred player (Lightbox.tsx), where the arrows cycle through every piece
 * and the project's extra media; Close, Escape or a click shrinks it back
 * into the print. `eager`: the first project's, on screen as the page shows
 * (and decoded by its preload); the others' prints load lazily.
 */
export default function Collage({ project, eager = false }: { project: Project; eager?: boolean }) {
  const { collage } = project;
  const pieces = useRef<(HTMLElement | null)[]>([]);

  /** The print itself (a photo, or a placeholder's grey sheet) and its caption. */
  const printBody = (it: CollageItem, i: number) => (
    <>
      {it.media.kind === "image" ? (
        <PaperSheet sheet={printSheet(it, it.media.picture, i, collage.scale)} lazy={!eager} />
      ) : (
        <span className="paper collage__blank" data-kind="blank" aria-hidden="true" />
      )}
      {it.caption && (
        <span className="collage__caption" style={{ "--cx": it.caption.x, "--cy": it.caption.y }}>
          {it.caption.text.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </span>
      )}
    </>
  );
  const [open, setOpen] = useState<number | null>(null);
  const wasOpen = useRef<number | null>(null);

  // Focus returns to the piece once the lightbox is gone (the page is inert
  // until its cleanup has run).
  useEffect(() => {
    if (wasOpen.current !== null && open === null) pieces.current[wasOpen.current]?.focus({ preventScroll: true });
    wasOpen.current = open;
  }, [open]);

  return (
    <div className="collage wall-solid" style={{ "--collage-h": collageHeight(collage.items), ...(collage.scale && { "--collage-scale": collage.scale }) }}>
      {collage.items.map((it, i) => (
        <div key={i} className="collage__piece" style={pieceStyle(it, i)} data-open={open === i || undefined}>
          {/* The tilt lives inside the piece (the piece is the layout box). */}
          <div className="collage__tilt">
            {it.href ? (
              // An outside site (This Portfolio's references): opens it in a new tab.
              <a
                ref={(el) => {
                  pieces.current[i] = el;
                }}
                href={it.href}
                target="_blank"
                rel="noopener noreferrer"
                className="collage__item"
                style={{ aspectRatio: printAspect(it) }}
                aria-label={`${it.media.label} (opens in a new tab)`}
                data-kind={it.media.kind}
                data-cursor={CURSOR_LABEL.visitSite}
                onClick={() => play("project.select")}
              >
                {printBody(it, i)}
              </a>
            ) : (
              <button
                ref={(el) => {
                  pieces.current[i] = el;
                }}
                type="button"
                className="collage__item"
                style={{ aspectRatio: printAspect(it) }}
                aria-haspopup="dialog"
                aria-label={`Expand: ${it.media.label}`}
                data-kind={it.media.kind}
                data-cursor={cursorFor(it)}
                onClick={() => {
                  play("project.select");
                  setOpen(i);
                }}
              >
                {printBody(it, i)}
              </button>
            )}
            <PaperSheet
              sheet={tapeSheet(it, i)}
              className={it.tape.long ? "collage__tape collage__tape--long" : "collage__tape"}
              style={{ "--tx": it.tape.x, "--tr": `${it.tape.rotate}deg` }}
            />
            {collage.marks
              ?.filter((m) => m.item === i)
              .map((m) => (
                <img
                  key={m.src}
                  className="collage__mark"
                  src={m.src}
                  alt=""
                  aria-hidden="true"
                  draggable={false}
                  style={{ "--mx": m.x, "--my": m.y, "--mw": m.w }}
                />
              ))}
          </div>
        </div>
      ))}
      {open !== null && (
        <Lightbox
          items={lightboxMedia(project)}
          previews={collage.items.map((it) => collageSizes(it, collage.scale))}
          start={open}
          origin={() => pieces.current[open]!}
          rotation={collage.items[open]!.rotate}
          color={`var(${project.poster.color})`}
          onClosed={() => setOpen(null)}
        />
      )}
    </div>
  );
}
