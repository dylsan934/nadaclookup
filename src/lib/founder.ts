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
export const FOUNDER: FounderInfo | null = {
  name: "Dylan Sanson",
  role: "Pharmacist & Pharmacy Manager",
  bio: "I built NADAC Lookup because I wanted an easy and efficient way to search NADAC prices and compare them to what PBMs were actually reimbursing.",
  links: [],
};
