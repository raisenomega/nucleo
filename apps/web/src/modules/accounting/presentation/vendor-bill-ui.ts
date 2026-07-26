import type { BillStatus } from "@accounting/domain/vendor-bill.types";
import type { TranslationKey } from "@shared/i18n";

// Badge por estado del bill (color + etiqueta i18n).
export const BILL_STATUS_META: Record<BillStatus, { key: TranslationKey; cls: string }> = {
  draft: { key: "bsDraft", cls: "bg-secondary text-muted-foreground" },
  pending: { key: "bsPending", cls: "bg-amber-500/10 text-amber-600" },
  approved: { key: "bsApproved", cls: "bg-blue-500/10 text-blue-600" },
  partially_paid: { key: "bsPartial", cls: "bg-orange-500/10 text-orange-600" },
  paid: { key: "bsPaid", cls: "bg-green-500/10 text-green-600" },
  voided: { key: "bsVoided", cls: "bg-destructive/10 text-destructive line-through" },
  disputed: { key: "bsDisputed", cls: "bg-red-500/10 text-red-600" },
};

export const BILL_STATUSES: BillStatus[] = ["draft", "pending", "approved", "partially_paid", "paid", "voided", "disputed"];

// Vencimiento auto según términos de pago del proveedor (cod=mismo día, net_N = +N días).
export function dueFromTerms(billDate: string, terms: string | null): string {
  const days = terms === "net_15" ? 15 : terms === "net_30" ? 30 : terms === "net_45" ? 45 : 0;
  const d = new Date(billDate + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
