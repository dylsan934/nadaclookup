/**
 * Founder identity shown on the About page and credited in the footer.
 * Left null until the real details are supplied — nothing is shown while null.
 */
export interface FounderInfo {
  name: string;
  role: string;
  photoUrl?: string;
  bio: string;
  links: { label: string; href: string }[];
}
export const FOUNDER: FounderInfo | null = null;
