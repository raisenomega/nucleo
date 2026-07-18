import { useEffect, useMemo, useState } from "react";
import { Printer } from "lucide-react";
import { Bar, BarChart, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useI18n } from "@shared/i18n";
import { usePdf } from "@shared/hooks/usePdf";
import { supabaseAssetRepository } from "@assets/infrastructure/supabase-asset.repository";
import type { CustodyLog } from "@assets/domain/asset.types";

const PIE = ["hsl(217 91% 60%)", "hsl(142 71% 45%)", "hsl(38 92% 50%)", "hsl(0 84% 60%)", "hsl(280 65% 60%)"];

// Historial de custodia: tabla + gráficos (millas/galones por mes, uso por empleado).
export function AssetCustodyHistory({ assetId }: { assetId: string }) {
  const { t } = useI18n();
  const { generatePdf, generating } = usePdf();
  const [logs, setLogs] = useState<CustodyLog[]>([]);
  useEffect(() => { void supabaseAssetRepository.listCustody(assetId).then(setLogs); }, [assetId]);
  const rows = useMemo(() => {
    const asc = [...logs].sort((a, b) => a.custodyAt.localeCompare(b.custodyAt)); let lastOut: number | null = null;
    return asc.map((l) => { const miles = l.custodyType === "checkin" && l.odometer != null && lastOut != null ? l.odometer - lastOut : null; if (l.custodyType === "checkout") lastOut = l.odometer; return { ...l, miles }; });
  }, [logs]);
  const byMonth = useMemo(() => { const m = new Map<string, { miles: number; gallons: number }>(); rows.forEach((r) => { if (r.custodyType !== "checkin") return; const k = r.custodyAt.slice(0, 7); const e = m.get(k) ?? { miles: 0, gallons: 0 }; e.miles += r.miles ?? 0; e.gallons += r.fuelGallons ?? 0; m.set(k, e); }); return [...m.entries()].map(([month, v]) => ({ month: month.slice(5), ...v })); }, [rows]);
  const byEmp = useMemo(() => { const m = new Map<string, number>(); logs.filter((l) => l.custodyType === "checkout").forEach((l) => m.set(l.employeeName || "?", (m.get(l.employeeName || "?") ?? 0) + 1)); return [...m.entries()].map(([name, value]) => ({ name, value })); }, [logs]);
  return (
    <div className="space-y-3 border-t border-border pt-2">
      <p className="text-xs font-bold uppercase text-muted-foreground">{t("custodyHistory")}</p>
      {logs.length === 0 && <p className="text-sm text-muted-foreground">{t("noRecords")}</p>}
      {logs.length > 0 && <div className="overflow-x-auto"><table className="w-full text-sm">
        <thead className="text-xs uppercase text-muted-foreground"><tr><th className="text-left">{t("date")}</th><th className="text-left">{t("employee")}</th><th className="text-left">{t("assetType")}</th><th className="text-right">{t("odometer")}</th><th className="text-right">{t("miles")}</th><th className="text-right">{t("stopsCount")}</th><th></th></tr></thead>
        <tbody>{rows.slice().reverse().map((r) => (<tr key={r.id} className="border-t border-border"><td className="py-1">{r.custodyAt.slice(0, 10)}</td><td className="py-1">{r.employeeName}</td><td className="py-1">{r.custodyType === "checkout" ? t("checkout") : t("checkin")}</td><td className="py-1 text-right">{r.odometer ?? "—"}</td><td className={`py-1 text-right ${r.miles != null && r.miles < 0 ? "text-destructive" : ""}`}>{r.miles ?? "—"}</td><td className="py-1 text-right">{r.stopsCount ?? "—"}</td><td className="py-1 text-right"><button type="button" disabled={generating} title={t("printReceipt")} onClick={() => void generatePdf("asset_custody", r.id)} className="text-muted-foreground hover:text-foreground disabled:opacity-50"><Printer className="h-4 w-4" /></button></td></tr>))}</tbody>
      </table></div>}
      {byMonth.length > 0 && <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-border p-2"><p className="text-xs text-muted-foreground">{t("chartMiles")} / {t("chartFuel")}</p><ResponsiveContainer width="100%" height={160}><BarChart data={byMonth}><XAxis dataKey="month" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip /><Legend /><Bar dataKey="miles" name={t("miles")} fill="hsl(217 91% 60%)" /><Bar dataKey="gallons" name={t("gallons")} fill="hsl(142 71% 45%)" /></BarChart></ResponsiveContainer></div>
        <div className="rounded-lg border border-border p-2"><p className="text-xs text-muted-foreground">{t("chartUseByEmployee")}</p><ResponsiveContainer width="100%" height={160}><PieChart><Pie data={byEmp} dataKey="value" nameKey="name" outerRadius={60}>{byEmp.map((_, i) => <Cell key={i} fill={PIE[i % PIE.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div>
      </div>}
    </div>
  );
}
