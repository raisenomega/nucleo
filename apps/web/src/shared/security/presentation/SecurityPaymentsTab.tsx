import { useEffect, useState } from "react";
import { supabase } from "@shared/lib/supabase";
import { useI18n } from "@shared/i18n";

type Row = { tenant: string; enabled: boolean; mode: string; lastSync: string | null; tx30d: number; total30d: number };

// Vista superadmin de pagos Stripe por tenant (get_platform_payments_summary). Solo lectura.
export function SecurityPaymentsTab() {
  const { t } = useI18n();
  const [rows, setRows] = useState<Row[] | null>(null);
  useEffect(() => { void supabase.rpc("get_platform_payments_summary").then(({ data }) => setRows((data as Row[]) ?? [])); }, []);

  if (!rows) return <p className="text-sm text-muted-foreground">{t("noData")}</p>;
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">{t("payNoStripe")}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="text-left text-xs text-muted-foreground">
          <th className="p-2">{t("payTenant")}</th><th className="p-2">Stripe</th><th className="p-2 text-right">{t("payTx30d")}</th><th className="p-2 text-right">{t("payTotal30d")}</th>
        </tr></thead>
        <tbody>{rows.map((r, i) => (
          <tr key={i} className="border-t border-border">
            <td className="p-2 font-bold text-foreground">{r.tenant}</td>
            <td className="p-2"><span className={`rounded px-1.5 py-0.5 text-xs font-bold ${r.enabled ? "text-green-600" : "text-muted-foreground"}`}>{r.enabled ? `${t("stripeConnected")} · ${r.mode}` : t("stripeNotValidated")}</span></td>
            <td className="p-2 text-right">{r.tx30d}</td>
            <td className="p-2 text-right font-mono">${(r.total30d ?? 0).toFixed(2)}</td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}
