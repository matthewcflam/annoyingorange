import type { Picture } from "../lib/assets";

/** An imagetools picture's <source>s (AVIF, WebP), best first; the <img>
 *  after them is the caller's. */
export default function PictureSources({ picture, sizes }: { picture: Picture; sizes: string | undefined }) {
  return Object.entries(picture.sources).map(([format, srcset]) => (
    <source key={format} type={`image/${format}`} srcSet={srcset} sizes={sizes} />
  ));
}
