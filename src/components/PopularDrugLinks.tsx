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
  "Hydrochlorothiazide 25 MG Tablet",
  "Gabapentin 300 MG Capsule",
  "Sertraline HCL 50 MG Tablet",
  "Albuterol Sulfate HFA 90 MCG Inhaler",
  "Losartan Potassium 50 MG Tablet",
];

export const PopularDrugLinks = () => (
  <section className="mt-12 pt-8 border-t border-border/60">
    <h2 className="text-lg font-semibold text-foreground mb-1">Popular NADAC Drug Pages</h2>
    <p className="text-sm text-muted-foreground mb-4">
      Quick access to weekly NADAC pricing for the most-searched generic medications.
    </p>
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
