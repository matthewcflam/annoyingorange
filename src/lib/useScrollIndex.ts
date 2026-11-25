import { useLayoutEffect, useRef, useState, type RefObject } from "react";
import { onScroll, scrollToY } from "./scroll";
import { prefersReducedMotion } from "./motion";
import { play } from "../audio/engine";
import type { SoundId } from "../config/sounds";

/** Where the page must scroll to put a block mid-screen: the centre of the
 *  block without the gap below it (its padding-bottom). */
export function centreOf(el: HTMLElement): number {
  const top = el.getBoundingClientRect().top + window.scrollY;
  const gap = parseFloat(getComputedStyle(el).paddingBottom);
  return top + (el.offsetHeight - gap) / 2 - window.innerHeight / 2;
}

/**
 * A page index (the Projects list, the Experience list): which block is in
 * focus (the one under the middle of the window; before the first block, the
 * first), and `select(id)`, which glides the page until that block is
 * mid-screen. During the glide the highlight stays on its target; a wheel,
 * touch or key takes over from it (and its onComplete never comes), and the
 * highlight follows the scroll again.
 *
 * `blocks` maps ids to their elements; `root` is watched for size changes.
 * `initial` opens the page already scrolled to that block.
 */
export function useScrollIndex<Id extends string>(
  ids: readonly Id[],
  blocks: RefObject<Map<Id, HTMLElement>>,
  root: RefObject<HTMLElement | null>,
  opts: { sound: SoundId; duration: number; ease: string; initial?: () => Id | null },
): { active: Id; select: (id: Id) => void } {
  const [active, setActive] = useState<Id>(ids[0]);
  const pinned = useRef(false);
  const initial = useRef(opts.initial);

  useLayoutEffect(() => {
    // The Map is filled by ref callbacks and keeps its identity.
    const map = blocks.current;
    let tops: { id: Id; top: number }[] = [];
    const measure = () => {
      tops = ids.map((id) => ({ id, top: map.get(id)!.getBoundingClientRect().top + window.scrollY }));
    };
    const pick = (scroll: number) => {
      if (pinned.current) return;
      const mid = scroll + window.innerHeight / 2;
      let id = tops[0].id;
      for (const t of tops) if (mid >= t.top) id = t.id;
      setActive(id);
    };

    const focus = initial.current?.();
    if (focus) scrollToY(centreOf(map.get(focus)!), { duration: 0, ease: "none", immediate: true });
    measure();
    pick(window.scrollY);

    const ro = new ResizeObserver(() => {
      measure();
      pick(window.scrollY);
    });
    ro.observe(root.current!);
    const off = onScroll(({ scroll }) => pick(scroll));
    const unpin = () => {
      if (!pinned.current) return;
      pinned.current = false;
      pick(window.scrollY);
    };
    const passive = { passive: true } as const;
    window.addEventListener("wheel", unpin, passive);
    window.addEventListener("touchstart", unpin, passive);
    window.addEventListener("keydown", unpin);
    return () => {
      ro.disconnect();
      off();
      window.removeEventListener("wheel", unpin);
      window.removeEventListener("touchstart", unpin);
      window.removeEventListener("keydown", unpin);
    };
  }, [ids, blocks, root]);

  const select = (id: Id) => {
    play(opts.sound);
    pinned.current = true;
    setActive(id);
    scrollToY(centreOf(blocks.current.get(id)!), {
      duration: opts.duration,
      ease: opts.ease,
      immediate: prefersReducedMotion(),
      onComplete: () => {
        pinned.current = false;
      },
    });
  };

  return { active, select };
}
