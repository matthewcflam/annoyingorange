/**
 * Click counts for the outbound links (lib/track.ts), sent to GoatCounter
 * (free, cookieless). Vercel Web Analytics counts page views; its custom
 * events need the Pro plan, so clicks go here instead.
 */

// The site at matthewlam.goatcounter.com. Empty: nothing is sent.
export const GOATCOUNTER_CODE = "matthewlam";

/** Only these hosts count, so localhost, e2e and Vercel previews never send. */
export const TRACK_HOSTS: readonly string[] = ["matthewlam.ca", "www.matthewlam.ca"];
