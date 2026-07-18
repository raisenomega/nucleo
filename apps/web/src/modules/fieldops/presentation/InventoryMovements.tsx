import { useEffect, useState } from "react";
import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { useI18n } from "@shared/i18n";
import type { TranslationKey } from "@shared/i18n";
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
  const { t } = useI18n();
  const [rows, setRows] = useState<InventoryMovement[]>([]);
  useEffect(() => { void supabaseInventoryRepository.listMovements(itemId).then(setRows); }, [itemId]);
  return (
    <div className="space-y-2">
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{t("movementHistory")}</p>
      {rows.length === 0 && <p className="text-xs text-muted-foreground">{t("noRecords")}</p>}
      {rows.map((m) => {
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
              <p className="text-xs text-muted-foreground">{ctx}</p>
              {m.notes && <p className="text-xs text-muted-foreground">{m.notes}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
