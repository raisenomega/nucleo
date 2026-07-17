import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { supabase } from "@shared/lib/supabase";
import { useI18n } from "@shared/i18n";
import type { TranslationKey } from "@shared/i18n";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";
import { useRoleGate } from "@shared/hooks/useRoleGate";

type Cat = { id: string; label: string; expense_class?: string | null };
const CLASSES: { v: string; k: TranslationKey }[] = [{ v: "variable", k: "variableExpense" }, { v: "fixed", k: "fixedExpense" }, { v: "debt", k: "debtExpense" }, { v: "one_time", k: "oneTimeExpense" }];

// Crear categorías es configuración → gateado por can("settings","categories").
export function CategoryPicker({ kind, value, onChange, label, byLabel, expenseClass }: {
  kind: string; value: string; onChange: (v: string) => void; label: TranslationKey; byLabel?: boolean;
  expenseClass?: "fixed" | "variable" | "debt" | "one_time";
}) {
  const { t } = useI18n();
  const { can } = useModuleAccess();
  const { canEdit } = useRoleGate();
  const [cats, setCats] = useState<Cat[]>([]);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [cls, setCls] = useState("fixed");
  const field = "w-full rounded-lg border border-border bg-background p-2 font-body";
  // CEO ve las categorías de gasto agrupadas por expense_class; el empleado solo las operativas (variable).
  const grouped = kind === "expense" && !expenseClass && canEdit("ceo");
  const load = () => void supabase.from("categories").select("id,label,expense_class").eq("kind", kind).eq("active", true).order("sort")
    .then(({ data }) => {
      let list = (data as Cat[] | null) ?? [];
      if (expenseClass) list = list.filter((c) => c.expense_class === expenseClass);
      else if (kind === "expense" && !canEdit("ceo")) list = list.filter((c) => c.expense_class === "variable");
      setCats(list);
    });
  useEffect(() => { load(); }, [kind, expenseClass]);
  async function create() {
    if (!name.trim()) return;
    const row: Record<string, unknown> = { kind, label: name.trim(), sort: 99 };
    if (kind === "expense") row.expense_class = expenseClass ?? cls;  // picker filtrado → nace con esa clase (aparece en el dropdown)
    const { data } = await supabase.from("categories").insert(row).select("id").single();
    const id = (data as { id: string } | null)?.id;
    if (id) { load(); onChange(byLabel ? name.trim() : id); setName(""); setCreating(false); }
  }
  return (
    <label className="block space-y-1">
      <span className="text-xs font-bold text-muted-foreground">{t(label)}</span>
      {creating ? (
        <div className="space-y-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("categoryName")} className={field} />
          {kind === "expense" && !expenseClass && (
            <select value={cls} onChange={(e) => setCls(e.target.value)} className={field} aria-label={t("selectExpenseClass")}>
              {CLASSES.map((c) => <option key={c.v} value={c.v}>{t(c.k)}</option>)}
            </select>
          )}
          <div className="flex gap-2">
            <button type="button" onClick={() => void create()} className="rounded-lg bg-primary text-primary-foreground px-3 py-1.5 text-sm font-bold">{t("createCategory")}</button>
            <button type="button" onClick={() => setCreating(false)} className="text-xs text-muted-foreground">{t("cancel")}</button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <select value={value} onChange={(e) => onChange(e.target.value)} className={field}>
            <option value="">—</option>
            {grouped
              ? CLASSES.map(({ v, k }) => {
                  const g = cats.filter((c) => (c.expense_class ?? "") === v);
                  return g.length ? <optgroup key={v} label={t(k)}>{g.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</optgroup> : null;
                })
              : cats.map((c) => <option key={c.id} value={byLabel ? c.label : c.id}>{c.label}</option>)}
          </select>
          {can("settings", "categories") && <button type="button" onClick={() => setCreating(true)} className="shrink-0 rounded-lg border border-border p-2 text-foreground" aria-label={t("newCategory")}><Plus className="h-4 w-4" /></button>}
        </div>
      )}
    </label>
  );
}
