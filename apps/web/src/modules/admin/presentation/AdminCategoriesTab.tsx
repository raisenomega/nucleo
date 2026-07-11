import { useState } from "react";
import { Pencil } from "lucide-react";
import { useI18n } from "@shared/i18n";
import type { CategoryConfig, RepoResult } from "@admin/domain/admin.types";

const KINDS = ["income", "expense", "extraordinary", "payment_method", "channel", "lead_source", "service_type", "tax_obligation"];
const CLASSES = ["fixed", "variable", "debt", "one_time"];

export function AdminCategoriesTab({ categories, onSave, onToggle }: {
  categories: readonly CategoryConfig[];
  onSave: (id: string | null, kind: string, label: string, cls: string | null) => Promise<RepoResult>;
  onToggle: (id: string, active: boolean) => Promise<RepoResult>;
}) {
  const { t } = useI18n();
  const [kind, setKind] = useState("income");
  const [label, setLabel] = useState("");
  const [cls, setCls] = useState("fixed");
  const field = "rounded-lg border border-border bg-background p-2 text-sm";
  async function create() {
    if (!label.trim()) return;
    const r = await onSave(null, kind, label.trim(), kind === "expense" ? cls : null);
    window.alert(r.ok ? "Guardado exitoso" : r.error); if (r.ok) setLabel("");
  }
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2 rounded-lg border border-border bg-card p-4">
        <select value={kind} onChange={(e) => setKind(e.target.value)} className={field}>{KINDS.map((k) => <option key={k} value={k}>{k}</option>)}</select>
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder={t("categoryName")} className={field} />
        {kind === "expense" && <select value={cls} onChange={(e) => setCls(e.target.value)} className={field}>{CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}</select>}
        <button type="button" onClick={() => void create()} className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-bold">{t("newCategory")}</button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-xs uppercase text-muted-foreground"><tr>
            <th className="px-3 py-2 text-left">kind</th><th className="px-3 py-2 text-left">{t("categoryName")}</th>
            <th className="px-3 py-2 text-left">{t("selectExpenseClass")}</th><th className="px-3 py-2 text-right">{t("actions")}</th>
          </tr></thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id} className={`border-t border-border ${c.active ? "" : "opacity-50"}`}>
                <td className="px-3 py-2">{c.kind}</td><td className="px-3 py-2">{c.label}</td>
                <td className="px-3 py-2">{c.expenseClass ?? "—"}</td>
                <td className="px-3 py-2">
                  <div className="flex justify-end gap-2 text-xs font-bold">
                    <button type="button" onClick={() => { const l = window.prompt(t("categoryName"), c.label); if (l) void onSave(c.id, c.kind, l, c.expenseClass).then((r) => window.alert(r.ok ? "Guardado exitoso" : r.error)); }} className="text-foreground"><Pencil className="h-4 w-4" /></button>
                    <button type="button" onClick={() => void onToggle(c.id, !c.active).then((r) => window.alert(r.ok ? "Guardado exitoso" : r.error))}>{c.active ? t("deactivate") : t("approve")}</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
