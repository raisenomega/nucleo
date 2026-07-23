import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { useToast } from "@shared/providers/toast-context";
import { formatCurrency } from "@shared/lib/format";
import { supabaseDepreciationRepository as repo } from "@assets/infrastructure/supabase-depreciation.repository";
import type { AssetBookValue, DepreciationEntry } from "@assets/domain/asset.types";

// 2.7a · valores (compra/acumulada/libros/mercado) + cronograma + recalcular. Solo activos con depreciación línea recta.
export function DepreciationPanel({ assetId, canEdit }: { assetId: string; canEdit: boolean }) {
  const toast = useToast();
  const [bv, setBv] = useState<AssetBookValue | null>(null);
  const [entries, setEntries] = useState<DepreciationEntry[]>([]);
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    const [map, es] = await Promise.all([repo.bookValues(), repo.entries(assetId)]);
    setBv(map[assetId] ?? null); setEntries(es);
  }, [assetId]);
  useEffect(() => { void load(); }, [load]);
  if (!bv || bv.monthly <= 0) return null;
  const recalc = async () => { setBusy(true); const r = await repo.recalc(assetId); setBusy(false); if (r.ok) { toast.success("Depreciación recalculada"); void load(); } else toast.error(r.error ?? "Error"); };
  const row = (l: string, v: string, strong?: boolean) => <div className={`flex justify-between ${strong ? "border-t border-border pt-1 font-bold text-foreground" : "text-muted-foreground"}`}><span>{l}</span><span>{v}</span></div>;
  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-4 text-sm">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-foreground">Depreciación (línea recta)</h3>
        {canEdit && <button type="button" disabled={busy} onClick={() => void recalc()} className="flex items-center gap-1 rounded-lg bg-secondary px-2 py-1 text-xs font-bold disabled:opacity-50"><RefreshCw className="h-3.5 w-3.5" />Recalcular</button>}
      </div>
      <div className="space-y-1">
        {row("Precio de compra", formatCurrency(bv.purchasePrice))}
        {row("Depreciación acumulada", "−" + formatCurrency(bv.accumulated))}
        {row("Valor en libros", formatCurrency(bv.bookValue), true)}
        {row("Valor de mercado (manual)", bv.currentValue != null ? formatCurrency(bv.currentValue) : "—")}
        {row("Mensual · meses restantes", `${formatCurrency(bv.monthly)} · ${bv.monthsRemaining}`)}
      </div>
      {entries.length > 0 && <div className="max-h-48 overflow-auto rounded-lg border border-border">
        <table className="w-full text-xs"><thead className="sticky top-0 bg-secondary text-[10px] uppercase text-muted-foreground"><tr><th className="px-2 py-1 text-left">Período</th><th className="px-2 py-1 text-right">Monto</th><th className="px-2 py-1 text-right">En libros</th></tr></thead>
        <tbody>{entries.map((e, i) => <tr key={i} className="border-t border-border"><td className="px-2 py-1">{e.periodYear}-{String(e.periodMonth).padStart(2, "0")}</td><td className="px-2 py-1 text-right">{formatCurrency(e.amount)}</td><td className="px-2 py-1 text-right text-muted-foreground">{formatCurrency(e.bookValueAfter)}</td></tr>)}</tbody></table>
      </div>}
    </div>
  );
}
