import { useState } from "react";
import { Boxes, ChevronRight } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";
import { LineItemInventoryPanel } from "@fieldops/presentation/LineItemInventoryPanel";
import { money } from "@orders/presentation/order-status.const";
import type { Order } from "@orders/domain/order.types";

// Ítems de la orden. Las líneas de producto (product_id) son clicables → drill-down a inventario (si inventory:view).
export function OrderItemsList({ order }: { order: Order }) {
  const { t } = useI18n(); const { can } = useModuleAccess();
  const [drill, setDrill] = useState<string | null>(null);
  const canView = can("inventory", "view");
  return (
    <section className="rounded-lg border border-border p-4">
      <h2 className="mb-3 font-semibold text-foreground">{t("ordItemsTitle")}</h2>
      <ul className="divide-y divide-border">
        {order.items.map((it, i) => {
          const clickable = !!it.productId && canView;
          const Row = clickable ? "button" : "li";
          return (
            <Row key={i} type={clickable ? "button" : undefined} onClick={clickable ? () => setDrill(it.productId as string) : undefined}
              className={`flex w-full items-center justify-between gap-4 py-2 text-left text-sm ${clickable ? "cursor-pointer hover:bg-secondary" : ""}`}>
              <span className="text-foreground">{it.name || "—"}
                {it.productId && <span className="ml-1 inline-flex items-center gap-0.5 rounded bg-green-500/10 px-1 text-[10px] font-bold text-green-600"><Boxes className="h-3 w-3" />Producto</span>}</span>
              <span className="flex shrink-0 items-center gap-1 text-muted-foreground">{it.qty} × {money(it.price, order.currency)}{clickable && <ChevronRight className="h-4 w-4" />}</span>
            </Row>
          );
        })}
        {order.items.length === 0 && <li className="py-2 text-sm text-muted-foreground">—</li>}
      </ul>
      {drill && <LineItemInventoryPanel productId={drill} onClose={() => setDrill(null)} />}
    </section>
  );
}
