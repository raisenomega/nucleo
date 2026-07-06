import type { TranslationKey } from "./translations.keys";

// Supplementary dictionary (service routes). Merged in translations.ts.
export const enRoutes = {
  newRoute: "New route", routeStops: "Stops", addStop: "Add stop",
  completeStop: "Complete", stopCompleted: "Collected", alreadyCompleted: "Already completed", stopsCompleted: "completed",
} satisfies Partial<Record<TranslationKey, string>>;
