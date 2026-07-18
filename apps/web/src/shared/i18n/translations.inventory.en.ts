import type { TranslationKey } from "./translations.keys";

// Supplementary dictionary (inventory Phase 1: restock + landing bridge). Merged in translations.ts.
export const enInventory = {
  restock: "Restock",
  registerEntry: "Register entry",
  supplier: "Supplier",
  inCatalog: "Catalog",
  inCatalogTooltip: "This item is sold in the public store",
  catalogProduct: "Catalog product",
  entryRegistered: "Entry registered",
  unlinked: "Unlinked",
  movVentaPublica: "Public sale",
  movAjuste: "Adjustment",
  movMerma: "Shrinkage",
  movDevolucion: "Return",
} satisfies Partial<Record<TranslationKey, string>>;
