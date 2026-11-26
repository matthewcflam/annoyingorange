import type { Picture } from "../lib/assets";
import PictureSources from "./PictureSources";

/** An imagetools picture (an `as: 'picture'` preset, vite.config.ts): AVIF/WebP
 *  sources with an <img> fallback. */
export default function ResponsivePicture({
  picture,
  alt,
  eager,
  sizes,
  className,
}: {
  picture: Picture;
  alt: string;
  eager: boolean;
  sizes: string;
  className?: string;
}) {
  return (
    <picture className={className}>
      <PictureSources picture={picture} sizes={sizes} />
      <img
        src={picture.img.src}
        width={picture.img.w}
        height={picture.img.h}
        alt={alt}
        decoding="async"
        fetchPriority={eager ? "high" : undefined}
        loading={eager ? "eager" : "lazy"}
      />
    </picture>
  );
}
