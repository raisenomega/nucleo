import { Pencil, Trash2 } from "lucide-react";
import { useI18n, type TranslationKey } from "@shared/i18n";
import type { Geofence } from "@assets/infrastructure/geofence.repository";

const TRG: Record<string, TranslationKey> = { enter: "tEnter", exit: "tExit", both: "tBoth" };

export function GeofenceTable({ rows, onEdit, onDelete }: { rows: Geofence[]; onEdit: (g: Geofence) => void; onDelete: (id: string) => void }) {
  const { t } = useI18n();
  const th = "px-3 py-2 text-left font-bold";
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-secondary text-xs uppercase text-muted-foreground"><tr><th className={th}>{t("name")}</th><th className={th}>{t("radiusMeters")}</th><th className={th}>{t("triggerOn")}</th><th className={th}>{t("appliesAll")}</th><th className={th} /></tr></thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">—</td></tr>}
          {rows.map((g) => (
            <tr key={g.id} className="border-t border-border">
              <td className="px-3 py-2 font-medium text-foreground"><span className="mr-1.5 inline-block h-3 w-3 rounded-full align-middle" style={{ background: g.color }} />{g.name}</td>
              <td className="px-3 py-2 text-muted-foreground">{g.radiusMeters ? `${g.radiusMeters} m` : "—"}</td>
              <td className="px-3 py-2 text-muted-foreground">{t(TRG[g.triggerOn] ?? "tBoth")}</td>
              <td className="px-3 py-2 text-muted-foreground">{g.appliesToAll ? "✓" : "—"}</td>
              <td className="px-3 py-2 text-right">
                <button type="button" onClick={() => onEdit(g)} className="mr-1 rounded p-1.5 text-muted-foreground hover:bg-secondary"><Pencil className="h-4 w-4" /></button>
                <button type="button" onClick={() => onDelete(g.id)} className="rounded p-1.5 text-destructive hover:bg-secondary"><Trash2 className="h-4 w-4" /></button>
              </td>
            </tr>))}
        </tbody>
      </table>
    </div>
  );
}
