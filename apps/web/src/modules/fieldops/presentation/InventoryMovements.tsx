import { useEffect, useState } from "react";
import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { useI18n } from "@shared/i18n";
import type { TranslationKey } from "@shared/i18n";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";
import { formatCurrency } from "@shared/lib/format";
import { Pagination } from "@shared/components/Pagination";
import { supabaseInventoryRepository } from "@fieldops/infrastructure/supabase-inventory.repository";
import type { InventoryMovement } from "@fieldops/domain/inventory.types";

// Tipo de movimiento → etiqueta + color + signo. entrada/devolución suben (verde +); salida/venta/merma bajan (rojo −); ajuste neutral.
const MOV: Record<string, { key: TranslationKey; cls: string; sign: string }> = {
  entrada: { key: "stockIn", cls: "text-green-600", sign: "+" },
  devolucion: { key: "movDevolucion", cls: "text-green-600", sign: "+" },
  salida: { key: "stockOut", cls: "text-red-600", sign: "−" },
  venta_publica: { key: "movVentaPublica", cls: "text-red-600", sign: "−" },
  merma: { key: "movMerma", cls: "text-red-600", sign: "−" },
  ajuste: { key: "movAjuste", cls: "text-muted-foreground", sign: "±" },
};
const FALLBACK = { key: "movAjuste" as TranslationKey, cls: "text-muted-foreground", sign: "±" };

// Historial de movimientos de un insumo: entrada/salida/venta_publica/ajuste/merma/devolución con empleado, contexto y fecha.
export function InventoryMovements({ itemId }: { itemId: string }) {
  const { t } = useI18n(); const { can } = useModuleAccess();
  const showCost = can("inventory", "cost");
  const [rows, setRows] = useState<InventoryMovement[]>([]);
  const [page, setPage] = useState(1);
  useEffect(() => { void supabaseInventoryRepository.listMovements(itemId).then(setRows); }, [itemId]);
  const paged = rows.slice((page - 1) * 12, page * 12);
  return (
    <div className="space-y-2">
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{t("movementHistory")}</p>
      {rows.length === 0 && <p className="text-xs text-muted-foreground">{t("noRecords")}</p>}
      {paged.map((m) => {
        const mv = MOV[m.type] ?? FALLBACK;
        const ctx = [m.employee, m.clientName, m.serviceType].filter(Boolean).join(" · ");
        return (
          <div key={m.id} className="flex items-start gap-2 rounded-lg border border-border p-2 text-sm">
            {mv.sign === "+" ? <ArrowDownCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
              : <ArrowUpCircle className={`mt-0.5 h-4 w-4 shrink-0 ${mv.cls}`} />}
            <div className="min-w-0 flex-1">
              <div className="flex justify-between gap-2">
                <span className="font-bold">{t(mv.key)} · <span className={mv.cls}>{mv.sign}{m.quantity}</span></span>
                <span className="text-xs text-muted-foreground">{m.date}</span>
              </div>
              <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                <span>Saldo: <span className="font-semibold text-foreground">{m.runningBalance}</span></span>
                {showCost && m.unitCost != null && m.unitCost > 0 && <span>Costo u.: {formatCurrency(m.unitCost)}</span>}
              </div>
              <p className="text-xs text-muted-foreground">{ctx}</p>
              {m.notes && <p className="text-xs text-muted-foreground">{m.notes}</p>}
            </div>
          </div>
        );
      })}
      <Pagination total={rows.length} page={page} onPageChange={setPage} />
    </div>
  );
}
