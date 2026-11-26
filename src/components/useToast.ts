import { useEffect, useRef, useState } from "react";
import { gsap } from "../lib/gsap";
import { TOAST } from "../config/timings";

/**
 * A short status toast (TOAST.*): rises and fades in, holds, fades out.
 * Put `toastRef` on the toast element and render its text while `shown` is
 * true; `show()` again restarts it.
 */
export function useToast<T extends Element = HTMLParagraphElement>() {
  const toastRef = useRef<T>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);
  const [shown, setShown] = useState(false);

  // An unmount mid-toast stops it (its onComplete would set state).
  useEffect(() => () => void tl.current?.kill(), []);

  const show = () => {
    setShown(true);
    tl.current?.kill();
    tl.current = gsap
      .timeline({ onComplete: () => setShown(false) })
      .fromTo(toastRef.current, { autoAlpha: 0, y: TOAST.RISE_PX }, { autoAlpha: 1, y: 0, duration: TOAST.IN, ease: TOAST.EASE })
      .to(toastRef.current, { autoAlpha: 0, duration: TOAST.OUT }, `+=${TOAST.HOLD}`);
  };

  return { toastRef, shown, show };
}
