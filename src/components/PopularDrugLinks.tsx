import { Link } from "react-router-dom";
import { drugNameToSlug } from "@/lib/drug-slug";

// Hand-picked top generics commonly searched by pharmacies.
export const POPULAR_DRUGS = [
  "Amoxicillin 500 MG Capsule",
  "Lisinopril 10 MG Tablet",
  "Metformin HCL 500 MG Tablet",
  "Atorvastatin 20 MG Tablet",
  "Levothyroxine Sodium 50 MCG Tablet",
  "Amlodipine Besylate 5 MG Tablet",
  "Omeprazole 20 MG Capsule Delayed Release",
  "Gabapentin 300 MG Capsule",
];

export const PopularDrugLinks = () => (
  <section className="mt-10 pt-6 border-t border-border/60">
    <h2 className="text-lg font-semibold text-foreground mb-4">Popular NADAC Drug Pages</h2>
    <ul className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
      {POPULAR_DRUGS.map((name) => (
        <li key={name}>
          <Link
            to={`/drug/${drugNameToSlug(name)}`}
            className="text-sm text-primary hover:underline"
          >
            {name} NADAC Price
          </Link>
        </li>
      ))}
    </ul>
  </section>
);
