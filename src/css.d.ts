/** Custom properties in React `style` objects (`{ "--w": 12 }`), typed so
 *  they need no `as CSSProperties` cast. */
import "react";

declare module "react" {
  interface CSSProperties {
    [property: `--${string}`]: string | number | undefined;
  }
}
