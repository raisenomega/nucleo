import { Boxes, ChevronRight } from "lucide-react";
import { formatCurrency } from "@shared/lib/format";

// Línea de venta genérica (factura o cotización). Las de producto (productId) son clicables → drill-down a inventario.
export interface SaleLine { description: string; quantity: number; unitPrice: number; lineTotal: number; productId?: string | null; sku?: string | null; }

export function SaleLinesList({ items, canView, onLineClick }: {
  items: readonly SaleLine[]; canView: boolean; onLineClick: (productId: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      {items.map((it, i) => {
        const clickable = !!it.productId && canView;
        const Row = clickable ? "button" : "div";
        return (
          <Row key={i} type={clickable ? "button" : undefined} onClick={clickable ? () => onLineClick(it.productId as string) : undefined}
            className={`flex w-full items-center justify-between gap-3 border-b border-border px-3 py-2 text-left text-sm last:border-0 ${clickable ? "cursor-pointer hover:bg-secondary" : ""}`}>
            <div className="min-w-0">
              <p className="truncate text-foreground">{it.description || "—"}
                {it.productId && <span className="ml-1 inline-flex items-center gap-0.5 rounded bg-green-500/10 px-1 text-[10px] font-bold text-green-600"><Boxes className="h-3 w-3" />{it.sku || "Producto"}</span>}</p>
              <p className="text-xs text-muted-foreground">{it.quantity} × {formatCurrency(it.unitPrice)}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <span className="font-semibold text-foreground">{formatCurrency(it.lineTotal)}</span>
              {clickable && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            </div>
          </Row>
        );
      })}
    </div>
  );
}
