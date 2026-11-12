import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { gsap } from "../../lib/gsap";
import { play } from "../../audio/engine";
import { prefersReducedMotion } from "../../lib/motion";
import { lockScroll, unlockScroll } from "../../lib/scroll";
import { MEDIA } from "../../config/timings";
import type { Media } from "../../content/projects";

/** What a piece of media shows, in its tile and expanded. Only placeholders
 *  for now (the labelled boxes in the Figma file); real video, images and
 *  embeds go here. */
function MediaContent({ media }: { media: Media }) {
  return <span className="media__label">{media.label}</span>;
}

/**
 * A piece of project media in the page (columns 5–8). Clicking it expands it
 * to cover the page (Lightbox); clicking again, Close or Escape puts it back.
 */
export default function MediaTile({ media }: { media: Media }) {
  const ref = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const wasOpen = useRef(false);

  // Focus returns to the tile once the lightbox is gone (the page is inert
  // until its cleanup has run).
  useEffect(() => {
    if (wasOpen.current && !open) ref.current?.focus({ preventScroll: true });
    wasOpen.current = open;
  }, [open]);

  return (
    <>
      <button
        ref={ref}
        type="button"
        className="media"
        style={{ aspectRatio: `${media.w} / ${media.h}` }}
        aria-haspopup="dialog"
        aria-label={`Expand ${media.label}`}
        data-open={open || undefined}
        data-reveal
        onPointerEnter={(e) => e.pointerType !== "touch" && play("link.hover")}
        onClick={() => {
          play("project.select");
          setOpen(true);
        }}
      >
        <MediaContent media={media} />
      </button>
      {open && (
        <Lightbox
          media={media}
          tileRef={ref}
          onClosed={() => setOpen(false)}
        />
      )}
    </>
  );
}

const boxOf = (el: HTMLElement) => {
  const r = el.getBoundingClientRect();
  return { left: r.left, top: r.top, width: r.width, height: r.height };
};

/**
 * The expanded media: a copy of the tile, in <body>, that grows from the
 * tile's box to the whole window and shrinks back into it on close. The page
 * behind it is inert and doesn't scroll meanwhile.
 */
function Lightbox({ media, tileRef, onClosed }: { media: Media; tileRef: RefObject<HTMLButtonElement | null>; onClosed: () => void }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const closing = useRef(false);

  useLayoutEffect(() => {
    const reduced = prefersReducedMotion();
    const root = document.getElementById("root");
    root?.setAttribute("inert", "");
    document.documentElement.classList.add("is-scroll-locked");
    lockScroll();
    closeRef.current!.focus({ preventScroll: true });

    const frame = frameRef.current!;
    const backdrop = backdropRef.current!;
    const closeButton = closeRef.current!;
    gsap.fromTo(backdrop, { opacity: 0 }, { opacity: 1, duration: reduced ? 0 : MEDIA.BACKDROP });
    gsap.fromTo(frame, boxOf(tileRef.current!), {
      left: 0,
      top: 0,
      width: window.innerWidth,
      height: window.innerHeight,
      duration: reduced ? 0 : MEDIA.OPEN,
      ease: MEDIA.OPEN_EASE,
      // Then it follows the window.
      onComplete: () => void gsap.set(frame, { width: "100%", height: "100%" }),
    });
    gsap.fromTo(closeButton, { opacity: 0 }, { opacity: 1, duration: reduced ? 0 : MEDIA.BACKDROP, delay: reduced ? 0 : MEDIA.OPEN / 2 });

    return () => {
      gsap.killTweensOf([frame, backdrop, closeButton]);
      root?.removeAttribute("inert");
      document.documentElement.classList.remove("is-scroll-locked");
      unlockScroll();
    };
  }, [tileRef]);

  const close = () => {
    if (closing.current) return;
    closing.current = true;
    play("station.hover");
    const reduced = prefersReducedMotion();
    gsap.to(closeRef.current, { opacity: 0, duration: reduced ? 0 : MEDIA.BACKDROP, overwrite: true });
    gsap.to(backdropRef.current, { opacity: 0, duration: reduced ? 0 : MEDIA.CLOSE, overwrite: true });
    gsap.to(frameRef.current, {
      ...boxOf(tileRef.current!),
      duration: reduced ? 0 : MEDIA.CLOSE,
      ease: MEDIA.CLOSE_EASE,
      overwrite: true,
      onComplete: onClosed,
    });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return createPortal(
    <div className="lightbox" role="dialog" aria-modal="true" aria-label={media.label}>
      <div ref={backdropRef} className="lightbox__backdrop" />
      <div ref={frameRef} className="lightbox__frame" onClick={close}>
        <MediaContent media={media} />
      </div>
      <button ref={closeRef} type="button" className="lightbox__close" onClick={close}>
        <span>Close</span>
      </button>
    </div>,
    document.body,
  );
}
