import type { ArBuckets } from "@shared/customers/ar.repository";

// Metadatos de los buckets de aging (orden, etiqueta, color). Reutilizado por el estado de cuenta y el panel de cartera.
export const AR_BUCKETS: ReadonlyArray<readonly [keyof ArBuckets, string, string]> = [
  ["current", "Corriente", "text-green-600 bg-green-500/10"],
  ["b1_30", "1–30 días", "text-yellow-600 bg-yellow-500/10"],
  ["b31_60", "31–60 días", "text-orange-600 bg-orange-500/10"],
  ["b61_90", "61–90 días", "text-red-600 bg-red-500/10"],
  ["b90_plus", "90+ días", "text-red-700 bg-red-700/10"],
];
export const AR_BUCKET_LABEL: Record<string, string> = { paid: "Pagada", current: "Corriente", b1_30: "1–30", b31_60: "31–60", b61_90: "61–90", b90_plus: "90+" };
export const AR_BUCKET_COLOR: Record<string, string> = {
  paid: "text-muted-foreground bg-secondary", current: "text-green-600 bg-green-500/10", b1_30: "text-yellow-600 bg-yellow-500/10",
  b31_60: "text-orange-600 bg-orange-500/10", b61_90: "text-red-600 bg-red-500/10", b90_plus: "text-red-700 bg-red-700/10",
};
