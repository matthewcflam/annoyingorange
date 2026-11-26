import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import { gsap } from "../../lib/gsap";
import { hoverSound, play } from "../../audio/engine";
import { prefersReducedMotion } from "../../lib/motion";
import { lockScroll, unlockScroll } from "../../lib/scroll";
import { projectScale } from "../../lib/tokens";
import { collageSizes, type Picture } from "../../lib/assets";
import { MEDIA } from "../../config/timings";
import { lightboxMedia, type CollageItem, type Media, type Project } from "../../content/projects";
import ResponsivePicture from "../ResponsivePicture";
import PaperSheet from "../paper/PaperSheet";
import type { Sheet } from "../paper/sheets";
import { TAPE_LONG, TAPE_SHORT } from "../paper/tapes";

type VideoRef = (el: HTMLVideoElement | null) => void | (() => void);

/** Start a clip silently. Autoplay is only allowed muted; a refusal (iOS Low
 *  Power Mode, data saver) leaves the poster showing, which is fine. */
function playMuted(v: HTMLVideoElement) {
  v.muted = true;
  void v.play().catch(() => {});
}

/** What a piece of media shows in the lightbox: a photo, a placeholder's
 *  label, or a silent looping video (played from code, never `autoplay`). */
function MediaContent({ media, videoRef, previewSizes }: { media: Media; videoRef?: VideoRef; previewSizes?: string }) {
  if (media.kind === "video") {
    return (
      <video
        ref={videoRef}
        className="media__video"
        poster={media.poster}
        aria-label={media.label}
        muted
        loop
        playsInline
        disablePictureInPicture
        preload="metadata"
      >
        {media.sources.map((s) => (
          <source key={s.src} src={s.src} type={s.type} />
        ))}
      </video>
    );
  }
  if (media.kind === "image") {
    // Under the large copy, the size the collage already loaded: it shows at
    // once while the large one arrives.
    return (
      <>
        {previewSizes && <ResponsivePicture className="media__picture" picture={media.picture} alt="" eager sizes={previewSizes} />}
        <ResponsivePicture className="media__picture" picture={media.picture} alt={media.label} eager sizes={`${MEDIA.PLAYER_WIDTH * 100}vw`} />
      </>
    );
  }
  return <span className="media__label">{media.label}</span>;
}

/** A piece's place in the collage (project.css reads the custom properties). */
function pieceStyle(it: CollageItem, i: number): CSSProperties {
  return { "--w": it.w, "--x": it.x, "--y": it.y, "--r": `${it.rotate}deg`, zIndex: i + 1 } as CSSProperties;
}

/** Room below the lowest print for its tilt (cqw). */
const COLLAGE_PAD = 3;

/** The collage's height in cqw: down to the foot of its lowest print. */
function collageHeight(items: CollageItem[]): number {
  return Math.max(...items.map((it) => it.y + it.w / printAspect(it))) + COLLAGE_PAD;
}

/** A print's width / height on the page (cropped when `aspect` is set). */
function printAspect(it: CollageItem): number {
  return it.aspect ?? it.media.w / it.media.h;
}

/** A photo print (placeholders are a plain grey sheet, project.css). The
 *  sheet's own box is unused: the piece places it. */
function printSheet(it: CollageItem, picture: Picture, i: number, scale?: number): Sheet {
  return { id: `print-${i}`, kind: "photo", cx: 0, cy: 0, w: 0, h: 0, rotate: 0, picture, sizes: collageSizes(it, scale) };
}

/** Its strip of tape. */
function tapeSheet(it: CollageItem, i: number): Sheet {
  return { id: `tape-${i}`, kind: "tape", cx: 0, cy: 0, w: 0, h: 0, rotate: 0, src: it.tape.long ? TAPE_LONG : TAPE_SHORT };
}

/**
 * A project's media (columns 6–8, or 3–5 on a mirrored block): its pieces as
 * taped prints (home's and Experience's paper, pages/paper/), placed by hand
 * overlapping and a little crooked, with hand-drawn marks on them (user
 * request: no board behind them). A click on a print expands it into a centred player
 * (Lightbox), where the arrows cycle through every piece and the project's
 * extra media; Close, Escape or a click shrinks it back into the print.
 */
export default function MediaCollage({ project }: { project: Project }) {
  const { collage } = project;
  const items = lightboxMedia(project);
  const pieces = useRef<(HTMLButtonElement | null)[]>([]);
  const [open, setOpen] = useState<number | null>(null);
  const wasOpen = useRef<number | null>(null);

  // Focus returns to the piece once the lightbox is gone (the page is inert
  // until its cleanup has run).
  useEffect(() => {
    if (wasOpen.current !== null && open === null) pieces.current[wasOpen.current]?.focus({ preventScroll: true });
    wasOpen.current = open;
  }, [open]);

  return (
    <div
      className="collage"
      style={{ "--collage-h": collageHeight(collage.items), ...(collage.scale && { "--collage-scale": collage.scale }) } as CSSProperties}
    >
      {collage.items.map((it, i) => (
        <div key={i} className="collage__piece" style={pieceStyle(it, i)} data-open={open === i || undefined}>
          {/* The tilt lives inside the piece (the piece is the layout box). */}
          <div className="collage__tilt">
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
              data-cursor={it.media.kind === "image" ? "View Photo" : it.media.kind === "video" ? "Play Video" : "Expand"}
              onClick={() => {
                play("project.select");
                setOpen(i);
              }}
            >
              {it.media.kind === "image" ? (
                <PaperSheet sheet={printSheet(it, it.media.picture, i, collage.scale)} />
              ) : (
                <span className="paper collage__blank" data-kind="blank" aria-hidden="true" />
              )}
              {it.caption && (
                <span className="collage__caption" style={{ "--cx": it.caption.x, "--cy": it.caption.y } as CSSProperties}>
                  {it.caption.text.map((line) => (
                    <span key={line}>{line}</span>
                  ))}
                </span>
              )}
            </button>
            <PaperSheet
              sheet={tapeSheet(it, i)}
              className={it.tape.long ? "collage__tape collage__tape--long" : "collage__tape"}
              style={{ "--tx": it.tape.x, "--tr": `${it.tape.rotate}deg` } as CSSProperties}
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
                  style={{ "--mx": m.x, "--my": m.y, "--mw": m.w } as CSSProperties}
                />
              ))}
          </div>
        </div>
      ))}
      {open !== null && (
        <Lightbox
          items={items}
          previews={collage.items.map((it) => collageSizes(it, collage.scale))}
          start={open}
          origin={() => pieces.current[open]!}
          rotation={collage.items[open].rotate}
          color={`var(${project.poster.color})`}
          onClosed={() => setOpen(null)}
        />
      )}
    </div>
  );
}

/** A piece's box without its tilt: its layout size, centred where it is. */
function originBox(el: HTMLElement) {
  const r = el.getBoundingClientRect();
  const width = el.offsetWidth;
  const height = el.offsetHeight;
  return { left: r.left + r.width / 2 - width / 2, top: r.top + r.height / 2 - height / 2, width, height };
}

/** One item shown in the lightbox. `id` is unique per showing, so going back
 *  to an item while its old copy still slides out mounts a fresh one. */
interface Slide {
  index: number;
  id: number;
}
/** A slide on its way out; `dir` is the way the carousel moved (1 next,
 *  -1 previous, 0 a plain fade). */
type Leaving = Slide & { dir: number };

/**
 * The expanded media: a copy of the clicked piece, in <body>, that grows from
 * its box (untilting, its frame thinning away) to a centred player over the
 * dimmed page (playerBox), and shrinks back into it on close (Close, Escape,
 * or a click on it or the dim). With more than one item, arrows in the lower
 * middle (or ←/→) cycle through them, wrapping at the ends; the player takes
 * each item's aspect ratio. The page behind it is inert and doesn't scroll
 * meanwhile.
 */
function Lightbox({
  items,
  previews,
  start,
  origin,
  rotation,
  color,
  onClosed,
}: {
  items: Media[];
  /** The collage pieces' `sizes`, by index (none for the extras). */
  previews: string[];
  start: number;
  origin: () => HTMLElement;
  rotation: number;
  color: string;
  onClosed: () => void;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const closing = useRef(false);

  const [current, setCurrent] = useState<Slide>({ index: start, id: 0 });
  const [leaving, setLeaving] = useState<Leaving[]>([]);
  const nextId = useRef(1);
  const slideEls = useRef(new Map<number, HTMLDivElement>());
  const n = items.length;

  /** The piece's frame (its border width) and box, untilted. */
  const originFrame = () => {
    const el = origin();
    return { ...originBox(el), rotation, borderWidth: getComputedStyle(el).borderTopWidth };
  };

  /** The player's box for item `index`: centred, at its aspect ratio,
   *  MEDIA.PLAYER_WIDTH of the window wide but never narrower than the piece,
   *  and shrunk if it would come within PLAYER_GAP_PX of Close or the arrows. */
  const playerBox = (index: number) => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const aspect = items[index].w / items[index].h;
    const gap = MEDIA.PLAYER_GAP_PX * projectScale();
    const closeBottom = closeRef.current?.getBoundingClientRect().bottom ?? 0;
    const navTop = navRef.current?.getBoundingClientRect().top ?? vh;
    // Centred, so it clears the larger of the two bands, top and bottom.
    const clear = Math.max(closeBottom, vh - navTop) + gap;
    const maxH = Math.max(0, vh - 2 * clear);
    const pieceW = origin().offsetWidth;
    const width = Math.min(Math.max(vw * MEDIA.PLAYER_WIDTH, pieceW), maxH * aspect, vw);
    const height = width / aspect;
    return { left: (vw - width) / 2, top: (vh - height) / 2, width, height, rotation: 0, borderWidth: 0 };
  };
  const shown = useRef(start);
  shown.current = current.index;

  useLayoutEffect(() => {
    const reduced = prefersReducedMotion();
    const root = document.getElementById("root");
    root?.setAttribute("inert", "");
    document.documentElement.classList.add("is-scroll-locked");
    lockScroll();
    closeRef.current!.focus({ preventScroll: true });

    const frame = frameRef.current!;
    const backdrop = backdropRef.current!;
    const slides = slideEls.current;
    const chrome = [closeRef.current!, navRef.current].filter((el) => el !== null);
    gsap.fromTo(backdrop, { opacity: 0 }, { opacity: 1, duration: reduced ? 0 : MEDIA.BACKDROP });
    gsap.fromTo(frame, originFrame(), {
      ...playerBox(start),
      duration: reduced ? 0 : MEDIA.OPEN,
      ease: MEDIA.OPEN_EASE,
    });
    // It stays centred and sized as the window changes.
    const onResize = () => {
      if (closing.current) return;
      gsap.killTweensOf(frame);
      gsap.set(frame, playerBox(shown.current));
    };
    window.addEventListener("resize", onResize);
    // set + to, not a delayed fromTo: killed in StrictMode's effect re-run,
    // a delayed fromTo kept re-initialising each frame, stamping opacity 0.
    gsap.set(chrome, { opacity: 0 });
    gsap.to(chrome, { opacity: 1, duration: reduced ? 0 : MEDIA.BACKDROP, delay: reduced ? 0 : MEDIA.OPEN / 2 });

    return () => {
      window.removeEventListener("resize", onResize);
      gsap.killTweensOf([frame, backdrop, ...chrome, ...slides.values()]);
      root?.removeAttribute("inert");
      document.documentElement.classList.remove("is-scroll-locked");
      unlockScroll();
    };
    // Mount only: originFrame and playerBox read refs and the window when called.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Show item `index`; the current one slides out the other way. */
  const go = (index: number, dir: number) => {
    setLeaving((l) => [...l, { ...current, dir }]);
    setCurrent({ index, id: nextId.current++ });
  };

  // A new slide comes in from the side it's moving from while the old one
  // goes the other way, and the player takes the new item's shape. Earlier
  // leavers keep their own tweens.
  useLayoutEffect(() => {
    if (current.id === 0) return;
    const out = leaving[leaving.length - 1];
    const inEl = slideEls.current.get(current.id);
    const outEl = out && slideEls.current.get(out.id);
    const dir = out?.dir ?? 0;
    const duration = prefersReducedMotion() ? 0 : MEDIA.SLIDE;
    const off = MEDIA.SLIDE_OFFSET_PX * projectScale();
    if (!closing.current) gsap.to(frameRef.current, { ...playerBox(current.index), duration, ease: MEDIA.SLIDE_EASE, overwrite: true });
    if (outEl) {
      gsap.to(outEl, {
        x: -dir * off,
        opacity: 0,
        duration,
        ease: MEDIA.SLIDE_EASE,
        overwrite: true,
        onComplete: () => setLeaving((l) => l.filter((s) => s.id !== out.id)),
      });
    }
    if (inEl) gsap.fromTo(inEl, { x: dir * off, opacity: 0 }, { x: 0, opacity: 1, duration, ease: MEDIA.SLIDE_EASE, overwrite: true });
    // Only a new current slide starts a move; `leaving` changes on its own.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current.id]);

  const step = (d: number) => {
    if (closing.current || n < 2) return;
    play("project.select");
    go((current.index + d + n) % n, d);
  };

  const close = () => {
    if (closing.current) return;
    closing.current = true;
    play("station.hover");
    // It lands back on the piece it came from, so it shows that as it shrinks.
    if (current.index !== start) go(start, 0);
    const reduced = prefersReducedMotion();
    gsap.to([closeRef.current, navRef.current].filter((el) => el !== null), { opacity: 0, duration: reduced ? 0 : MEDIA.BACKDROP, overwrite: true });
    gsap.to(backdropRef.current, { opacity: 0, duration: reduced ? 0 : MEDIA.CLOSE, overwrite: true });
    gsap.to(frameRef.current, {
      ...originFrame(),
      duration: reduced ? 0 : MEDIA.CLOSE,
      ease: MEDIA.CLOSE_EASE,
      overwrite: true,
      onComplete: onClosed,
    });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") step(-1);
      else if (e.key === "ArrowRight") step(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });


  const renderSlide = (s: Slide) => (
    <LightboxSlide
      key={s.id}
      media={items[s.index]}
      previewSizes={previews[s.index]}
      slideRef={(el) => {
        if (!el) return;
        slideEls.current.set(s.id, el);
        return () => void slideEls.current.delete(s.id);
      }}
    />
  );

  return createPortal(
    <div className="lightbox" role="dialog" aria-modal="true" aria-label={items[current.index].label} style={{ "--project-color": color } as CSSProperties}>
      <div ref={backdropRef} className="lightbox__backdrop" data-clickable data-cursor="Close" onClick={close} />
      <div ref={frameRef} className="lightbox__frame" data-cursor="Close" onClick={close}>
        {leaving.map(renderSlide)}
        {renderSlide(current)}
      </div>
      <button ref={closeRef} type="button" className="lightbox__close" data-cursor="Close" onClick={close}>
        <span>Close</span>
      </button>
      {n > 1 && (
        <div ref={navRef} className="lightbox__nav">
          <button type="button" className="lightbox__arrow lightbox__arrow--prev" aria-label="Previous" data-cursor="Previous" onPointerEnter={hoverSound} onClick={() => step(-1)}>
            <Arrow />
          </button>
          <span className="lightbox__count" aria-live="polite">
            <span>
              {current.index + 1} / {n}
            </span>
          </span>
          <button type="button" className="lightbox__arrow lightbox__arrow--next" aria-label="Next" data-cursor="Next" onPointerEnter={hoverSound} onClick={() => step(1)}>
            <Arrow />
          </button>
        </div>
      )}
    </div>,
    document.body,
  );
}

/**
 * One item in the lightbox, stacked over the others while they slide. A video
 * plays (muted, looping) from the start; with reduced motion it doesn't
 * autoplay, and a click on it plays or pauses it.
 */
function LightboxSlide({
  media,
  previewSizes,
  slideRef,
}: {
  media: Media;
  previewSizes?: string;
  slideRef: (el: HTMLDivElement | null) => void | (() => void);
}) {
  const video = useRef<HTMLVideoElement | null>(null);
  const reduced = prefersReducedMotion();

  useEffect(() => {
    const v = video.current;
    if (v && !reduced) playMuted(v);
    // Mount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = (e: MouseEvent) => {
    const v = video.current;
    if (!v) return;
    e.stopPropagation();
    if (v.paused) playMuted(v);
    else v.pause();
  };

  return (
    <div ref={slideRef} className="lightbox__slide" onClick={reduced && media.kind === "video" ? toggle : undefined}>
      <MediaContent
        media={media}
        previewSizes={previewSizes}
        videoRef={(el) => {
          video.current = el;
        }}
      />
    </div>
  );
}

/** A left-pointing arrow; the next button mirrors it (project.css). */
function Arrow() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 12H4M10.5 5.5 4 12l6.5 6.5" />
    </svg>
  );
}
