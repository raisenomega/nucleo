import { useI18n } from "@shared/i18n";
import type { InventoryCountLine } from "@fieldops/domain/inventory-count.types";

// Verde si sin varianza, ámbar si <5%, rojo si ≥5%.
const varColor = (pct: number | null) => (pct == null ? "" : Math.abs(pct) < 0.01 ? "text-green-600" : Math.abs(pct) < 5 ? "text-amber-600" : "font-bold text-destructive");

// showExpected=false (conteo ciego en progreso para el contador) oculta esperado + varianza para no filtrar el teórico.
export function CountLinesTable({ lines, editable, showExpected, selectable, counted, onCount, selected, onToggle }: {
  lines: readonly InventoryCountLine[]; editable: boolean; showExpected: boolean; selectable: boolean;
  counted: Record<string, string>; onCount: (id: string, v: string) => void; selected: Set<string>; onToggle: (id: string) => void;
}) {
  const { t } = useI18n();
  const th = "px-2 py-2 text-left font-bold";
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-secondary text-xs uppercase text-muted-foreground"><tr>
          {selectable && <th className={th}></th>}
          <th className={th}>{t("itemName")}</th>
          {showExpected && <th className={`${th} text-right`}>{t("expectedQty")}</th>}
          <th className={`${th} text-right`}>{t("countedQty")}</th>
          {showExpected && <><th className={`${th} text-right`}>{t("variance")}</th><th className={`${th} text-right`}>%</th></>}
        </tr></thead>
        <tbody>
          {lines.map((l) => (
            <tr key={l.id} className="border-t border-border">
              {selectable && <td className="px-2 py-2"><input type="checkbox" checked={selected.has(l.id)} onChange={() => onToggle(l.id)} disabled={l.lineStatus === "applied"} /></td>}
              <td className="px-2 py-2">{l.itemName}{l.itemSku && <span className="ml-1 text-xs text-muted-foreground">{l.itemSku}</span>}</td>
              {showExpected && <td className="px-2 py-2 text-right text-muted-foreground">{l.expectedQty}</td>}
              <td className="px-2 py-2 text-right">{editable ? <input type="number" value={counted[l.id] ?? (l.countedQty ?? "")} onChange={(e) => onCount(l.id, e.target.value)} className="w-20 rounded border border-border bg-background p-1 text-right" /> : (l.countedQty ?? "—")}</td>
              {showExpected && <><td className={`px-2 py-2 text-right ${varColor(l.variancePct)}`}>{l.variance == null ? "—" : (l.variance > 0 ? "+" : "") + l.variance}</td><td className={`px-2 py-2 text-right ${varColor(l.variancePct)}`}>{l.variancePct == null ? "—" : l.variancePct + "%"}</td></>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
