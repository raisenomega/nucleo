import { useEffect, useState } from "react";
import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { supabaseInventoryRepository } from "@fieldops/infrastructure/supabase-inventory.repository";
import type { InventoryMovement } from "@fieldops/domain/inventory.types";

// Historial de movimientos de un insumo: entrada/salida con empleado, servicio/cliente y fecha.
export function InventoryMovements({ itemId }: { itemId: string }) {
  const { t } = useI18n();
  const [rows, setRows] = useState<InventoryMovement[]>([]);
  useEffect(() => { void supabaseInventoryRepository.listMovements(itemId).then(setRows); }, [itemId]);
  return (
    <div className="space-y-2">
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{t("movementHistory")}</p>
      {rows.length === 0 && <p className="text-xs text-muted-foreground">{t("noRecords")}</p>}
      {rows.map((m) => {
        const out = m.type === "salida";
        const ctx = [m.employee, m.clientName, m.serviceType].filter(Boolean).join(" · ");
        return (
          <div key={m.id} className="flex items-start gap-2 rounded-lg border border-border p-2 text-sm">
            {out ? <ArrowUpCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
              : <ArrowDownCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />}
            <div className="min-w-0 flex-1">
              <div className="flex justify-between gap-2">
                <span className="font-bold">{out ? t("stockOut") : t("stockIn")} · {m.quantity}</span>
                <span className="text-xs text-muted-foreground">{m.date}</span>
              </div>
              <p className="text-xs text-muted-foreground">{ctx}</p>
              {m.notes && <p className="text-xs text-muted-foreground">{m.notes}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
