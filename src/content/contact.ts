/** Contact links, shared by the social glyphs and the footer. */
export const EMAIL = "matthewcflam@gmail.com";
export const GITHUB = "https://github.com/matthewcflam";
export const LINKEDIN = "https://www.linkedin.com/in/matthewcflam/";
// TODO(devpost): the profile URL hasn't been supplied; this is Devpost's home page.
export const DEVPOST = "https://devpost.com/";

export type ContactId = "email" | "linkedin" | "github" | "devpost";

export interface ContactLink {
  id: ContactId;
  label: string;
  /** components/icons.ts */
  icon: "mail" | "linkedin" | "github" | "devpost";
  /** Opens in a new tab; null: Email, which copies the address instead. */
  href: string | null;
  /** The cursor label over it (chrome/Cursor.tsx). */
  cursor: string;
}

/** Every way to reach me, in the Connections card's order (Figma). Home's
 *  glyph row (components/SocialLinks.tsx) shows the same links in its own order. */
export const CONTACT_LINKS: readonly ContactLink[] = [
  { id: "email", label: "Email", icon: "mail", href: null, cursor: "Copy Email" },
  { id: "linkedin", label: "LinkedIn", icon: "linkedin", href: LINKEDIN, cursor: "View LinkedIn" },
  { id: "github", label: "GitHub", icon: "github", href: GITHUB, cursor: "View GitHub" },
  { id: "devpost", label: "Devpost", icon: "devpost", href: DEVPOST, cursor: "View Devpost" },
];

export const contactLink = (id: ContactId): ContactLink => CONTACT_LINKS.find((l) => l.id === id)!;

/** The footer's "LAST UPDATED" line (Figma). TODO(last-updated): hand-written; could be stamped at build time. */
export const LAST_UPDATED = "November 25th 2026";

/** The footer's lines beside the card and under the cat. */
export const FOOTER_CHAT = "Let’s chat!";
export const FOOTER_CREDIT = "Designed and Built by";
