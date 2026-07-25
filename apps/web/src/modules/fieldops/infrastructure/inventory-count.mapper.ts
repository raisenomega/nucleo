import type { InventoryCount, InventoryCountLine, CountStatus, CountType, LineStatus } from "@fieldops/domain/inventory-count.types";

type ProfileRef = { full_name: string | null } | null;
export interface LineRow {
  id: string; item_id: string; expected_qty: number | string; counted_qty: number | string | null;
  variance: number | string | null; variance_pct: number | string | null; unit_cost_at_count: number | string | null;
  line_status: string; counted_at: string | null; notes: string | null;
  item?: { name: string; sku: string | null } | null; counter?: ProfileRef;
}
export interface CountRow {
  id: string; count_number: string; status: string; count_type: string; category_id: string | null;
  assigned_to: string | null; notes: string | null; blind_count: boolean; created_at: string;
  started_at: string | null; completed_at: string | null; approved_at: string | null; applied_at: string | null;
  warehouse_id: string | null; warehouse?: { name: string } | null;
  assigned?: ProfileRef; creator?: ProfileRef; lines?: LineRow[];
}
const num = (v: unknown) => (v == null ? null : Number(v));

export function toCountLine(r: LineRow): InventoryCountLine {
  return {
    id: r.id, itemId: r.item_id, itemName: r.item?.name ?? "", itemSku: r.item?.sku ?? "",
    expectedQty: Number(r.expected_qty), countedQty: num(r.counted_qty), variance: num(r.variance), variancePct: num(r.variance_pct),
    unitCostAtCount: num(r.unit_cost_at_count), lineStatus: r.line_status as LineStatus,
    countedByName: r.counter?.full_name ?? null, countedAt: r.counted_at, notes: r.notes,
  };
}

export function toCount(r: CountRow, withLines: boolean): InventoryCount {
  const ls = r.lines ?? [];
  return {
    id: r.id, countNumber: r.count_number, status: r.status as CountStatus, countType: r.count_type as CountType,
    categoryId: r.category_id, assignedTo: r.assigned_to, assignedToName: r.assigned?.full_name ?? null,
    notes: r.notes, blindCount: r.blind_count, createdByName: r.creator?.full_name ?? null, createdAt: r.created_at,
    startedAt: r.started_at, completedAt: r.completed_at, approvedAt: r.approved_at, appliedAt: r.applied_at,
    totalLines: ls.length, countedLines: ls.filter((l) => l.line_status !== "pending").length,
    varianceLines: ls.filter((l) => l.variance != null && Number(l.variance) !== 0).length,
    warehouseId: r.warehouse_id, warehouseName: r.warehouse?.name ?? null,
    lines: withLines ? ls.map(toCountLine) : undefined,
  };
}
