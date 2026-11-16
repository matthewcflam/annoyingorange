import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent, type RefObject } from "react";
import { createPortal } from "react-dom";
import { gsap } from "../../lib/gsap";
import { play } from "../../audio/engine";
import { prefersReducedMotion } from "../../lib/motion";
import { lockScroll, unlockScroll } from "../../lib/scroll";
import { projectScale } from "../../lib/tokens";
import { whenPageShown } from "../../lib/pageReveal";
import { MEDIA } from "../../config/timings";
import type { Media } from "../../content/projects";

type VideoRef = (el: HTMLVideoElement | null) => void | (() => void);

/** Start a clip silently. Autoplay is only allowed muted; a refusal (iOS Low
 *  Power Mode, data saver) leaves the poster showing, which is fine. */
function playMuted(v: HTMLVideoElement) {
  v.muted = true;
  void v.play().catch(() => {});
}

/** What a piece of media shows, in its tile and expanded: a placeholder's
 *  label, or a silent looping video (played from code, never `autoplay`, so
 *  the tile can pause it offscreen). */
function MediaContent({ media, videoRef, preload = "metadata" }: { media: Media; videoRef?: VideoRef; preload?: "none" | "metadata" }) {
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
        preload={preload}
      >
        {media.sources.map((s) => (
          <source key={s.src} src={s.src} type={s.type} />
        ))}
      </video>
    );
  }
  return <span className="media__label">{media.label}</span>;
}

/**
 * A project's media in the page (columns 5–8): the tile shows the first item;
 * a video plays (muted, looping) while the tile is on screen. Clicking it
 * expands it to a centred player (Lightbox), where arrows cycle through every
 * item; clicking again, Close or Escape puts it back.
 */
export default function MediaTile({ items }: { items: Media[] }) {
  const first = items[0];
  const ref = useRef<HTMLButtonElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [open, setOpen] = useState(false);
  const wasOpen = useRef(false);

  // Focus returns to the tile once the lightbox is gone (the page is inert
  // until its cleanup has run).
  useEffect(() => {
    if (wasOpen.current && !open) ref.current?.focus({ preventScroll: true });
    wasOpen.current = open;
  }, [open]);

  // The tile's video plays only while it's on screen and not expanded (the
  // lightbox has its own copy). It loads nothing (preload="none", the poster
  // shows) until the page has shown, so it never shares bandwidth with the
  // page transition. With reduced motion it stays on its poster.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (open || prefersReducedMotion()) {
      v.pause();
      return;
    }
    let io: IntersectionObserver | null = null;
    let cancelled = false;
    void whenPageShown().then(() => {
      if (cancelled) return;
      io = new IntersectionObserver(([entry]) => (entry.isIntersecting ? playMuted(v) : v.pause()));
      io.observe(v);
    });
    return () => {
      cancelled = true;
      io?.disconnect();
    };
  }, [open]);

  return (
    <>
      <button
        ref={ref}
        type="button"
        className="media"
        style={{ aspectRatio: `${first.w} / ${first.h}` }}
        aria-haspopup="dialog"
        aria-label={`Expand ${first.label}`}
        data-open={open || undefined}
        data-reveal
        onPointerEnter={(e) => e.pointerType !== "touch" && play("link.hover")}
        onClick={() => {
          play("project.select");
          setOpen(true);
        }}
      >
        <MediaContent
          media={first}
          preload="none"
          videoRef={(el) => {
            videoRef.current = el;
          }}
        />
      </button>
      {open && <Lightbox items={items} tileRef={ref} tileVideo={videoRef} onClosed={() => setOpen(false)} />}
    </>
  );
}

const boxOf = (el: HTMLElement) => {
  const r = el.getBoundingClientRect();
  return { left: r.left, top: r.top, width: r.width, height: r.height };
};

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
 * The expanded media: a copy of the tile, in <body>, that grows from the
 * tile's box to a centred player over the dimmed page (playerBox) and shrinks
 * back into it on close (Close, Escape, or a click on it or the dim). With more
 * than one item, arrows in the lower middle (or ←/→) cycle through them,
 * wrapping at the ends. The page behind it is inert and doesn't scroll
 * meanwhile.
 */
function Lightbox({
  items,
  tileRef,
  tileVideo,
  onClosed,
}: {
  items: Media[];
  tileRef: RefObject<HTMLButtonElement | null>;
  tileVideo: RefObject<HTMLVideoElement | null>;
  onClosed: () => void;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const closing = useRef(false);

  const [current, setCurrent] = useState<Slide>({ index: 0, id: 0 });
  const [leaving, setLeaving] = useState<Leaving[]>([]);
  const nextId = useRef(1);
  const slideEls = useRef(new Map<number, HTMLDivElement>());
  /** The lightbox's copy of the first item's video, to hand its time back to
   *  the tile on close so the clip carries on where it was. */
  const firstVideo = useRef<HTMLVideoElement | null>(null);
  const n = items.length;

  /** The player's box: centred, at the tile's aspect ratio, MEDIA.PLAYER_WIDTH
   *  of the window wide but never narrower than the tile, and shrunk if it
   *  would come within PLAYER_GAP_PX of Close or the arrows. */
  const playerBox = () => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const aspect = items[0].w / items[0].h;
    const gap = MEDIA.PLAYER_GAP_PX * projectScale();
    const closeBottom = closeRef.current?.getBoundingClientRect().bottom ?? 0;
    const navTop = navRef.current?.getBoundingClientRect().top ?? vh;
    // Centred, so it clears the larger of the two bands, top and bottom.
    const clear = Math.max(closeBottom, vh - navTop) + gap;
    const maxH = Math.max(0, vh - 2 * clear);
    const tileW = tileRef.current?.getBoundingClientRect().width ?? 0;
    const width = Math.min(Math.max(vw * MEDIA.PLAYER_WIDTH, tileW), maxH * aspect, vw);
    const height = width / aspect;
    return { left: (vw - width) / 2, top: (vh - height) / 2, width, height };
  };

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
    gsap.fromTo(frame, boxOf(tileRef.current!), {
      ...playerBox(),
      duration: reduced ? 0 : MEDIA.OPEN,
      ease: MEDIA.OPEN_EASE,
    });
    // It stays centred and sized as the window changes.
    const onResize = () => {
      if (closing.current) return;
      gsap.killTweensOf(frame);
      gsap.set(frame, playerBox());
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
    // Mount only: playerBox reads refs and the window when called.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tileRef]);

  /** Show item `index`; the current one slides out the other way. */
  const go = (index: number, dir: number) => {
    setLeaving((l) => [...l, { ...current, dir }]);
    setCurrent({ index, id: nextId.current++ });
  };

  // A new slide comes in from the side it's moving from while the old one
  // goes the other way. Earlier leavers keep their own tweens.
  useLayoutEffect(() => {
    if (current.id === 0) return;
    const out = leaving[leaving.length - 1];
    const inEl = slideEls.current.get(current.id);
    const outEl = out && slideEls.current.get(out.id);
    const dir = out?.dir ?? 0;
    const duration = prefersReducedMotion() ? 0 : MEDIA.SLIDE;
    const off = MEDIA.SLIDE_OFFSET_PX * projectScale();
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
    // It lands back on the tile, so it shows the tile's item as it shrinks.
    if (current.index !== 0) go(0, 0);
    const reduced = prefersReducedMotion();
    gsap.to([closeRef.current, navRef.current].filter((el) => el !== null), { opacity: 0, duration: reduced ? 0 : MEDIA.BACKDROP, overwrite: true });
    gsap.to(backdropRef.current, { opacity: 0, duration: reduced ? 0 : MEDIA.CLOSE, overwrite: true });
    gsap.to(frameRef.current, {
      ...boxOf(tileRef.current!),
      duration: reduced ? 0 : MEDIA.CLOSE,
      ease: MEDIA.CLOSE_EASE,
      overwrite: true,
      onComplete: () => {
        const from = firstVideo.current;
        const to = tileVideo.current;
        if (from && to) to.currentTime = from.currentTime;
        onClosed();
      },
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

  const hoverSound = (e: { pointerType: string }) => e.pointerType !== "touch" && play("link.hover");

  const renderSlide = (s: Slide) => (
    <LightboxSlide
      key={s.id}
      media={items[s.index]}
      slideRef={(el) => {
        if (!el) return;
        slideEls.current.set(s.id, el);
        return () => void slideEls.current.delete(s.id);
      }}
      videoRef={
        s.index === 0
          ? (el) => {
              if (el) firstVideo.current = el;
              return () => {
                if (firstVideo.current === el) firstVideo.current = null;
              };
            }
          : undefined
      }
      startAt={s.index === 0 ? (tileVideo.current?.currentTime ?? 0) : 0}
    />
  );

  return createPortal(
    <div className="lightbox" role="dialog" aria-modal="true" aria-label={items[current.index].label}>
      <div ref={backdropRef} className="lightbox__backdrop" data-clickable onClick={close} />
      <div ref={frameRef} className="lightbox__frame" onClick={close}>
        {leaving.map(renderSlide)}
        {renderSlide(current)}
      </div>
      <button ref={closeRef} type="button" className="lightbox__close" onClick={close}>
        <span>Close</span>
      </button>
      {n > 1 && (
        <div ref={navRef} className="lightbox__nav">
          <button type="button" className="lightbox__arrow lightbox__arrow--prev" aria-label="Previous" onPointerEnter={hoverSound} onClick={() => step(-1)}>
            <Arrow />
          </button>
          <span className="lightbox__count" aria-live="polite">
            <span>
              {current.index + 1} / {n}
            </span>
          </span>
          <button type="button" className="lightbox__arrow lightbox__arrow--next" aria-label="Next" onPointerEnter={hoverSound} onClick={() => step(1)}>
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
 * starts where the tile's copy was (`startAt`), so it reads as the same clip.
 * With reduced motion it doesn't autoplay; a click on it plays or pauses it.
 */
function LightboxSlide({
  media,
  slideRef,
  videoRef,
  startAt,
}: {
  media: Media;
  slideRef: (el: HTMLDivElement | null) => void | (() => void);
  videoRef?: VideoRef;
  startAt: number;
}) {
  const video = useRef<HTMLVideoElement | null>(null);
  const reduced = prefersReducedMotion();

  useEffect(() => {
    const v = video.current;
    if (!v) return;
    if (startAt) v.currentTime = startAt;
    if (!reduced) playMuted(v);
    // Mount only: the start time is read once.
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
        videoRef={(el) => {
          video.current = el;
          return videoRef?.(el);
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
