import { useState, type ReactNode } from "react";
import { ChevronRight, ChevronDown, Pencil, Eye, EyeOff } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { TYPE_META } from "@accounting/presentation/account-ui";
import type { ChartAccount } from "@accounting/domain/chart-of-accounts.types";

// Vista jerárquica del plan de cuentas: indentación por nivel, expand/collapse, badges y acciones.
export function AccountTree({ nodes, showInactive, canEdit, onEdit, onToggle }: {
  nodes: readonly ChartAccount[]; showInactive: boolean; canEdit: boolean;
  onEdit: (a: ChartAccount) => void; onToggle: (a: ChartAccount) => void;
}) {
  const { t } = useI18n();
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const flip = (id: string) => setCollapsed((c) => { const n = new Set(c); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const badge = "ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold";
  const render = (list: readonly ChartAccount[], depth: number): ReactNode =>
    list.filter((a) => showInactive || a.active).map((a) => {
      const meta = TYPE_META[a.accountType];
      const kids = (a.children ?? []).filter((c) => showInactive || c.active);
      const open = !collapsed.has(a.id);
      return (
        <div key={a.id}>
          <div className={`flex items-center gap-2 border-b border-border px-2 py-1.5 text-sm ${a.active ? "" : "opacity-50"}`} style={{ paddingLeft: `${depth * 1.25 + 0.5}rem` }}>
            {kids.length > 0
              ? <button type="button" onClick={() => flip(a.id)} aria-label={t(open ? "collapse" : "expand")}>{open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</button>
              : <span className="inline-block w-4" />}
            <span className="font-mono text-xs text-muted-foreground">{a.accountCode}</span>
            <span className={a.isHeader ? "font-bold text-foreground" : "text-foreground"}>{a.accountName}</span>
            <span className={`${badge} ${meta.cls}`}>{t(meta.key)}</span>
            <span className="text-[10px] font-bold text-muted-foreground">{a.normalBalance === "debit" ? "D" : "C"}</span>
            {a.isHeader && <span className={`${badge} bg-secondary text-muted-foreground`}>{t("header")}</span>}
            {a.isSystem && <span className={`${badge} bg-secondary text-muted-foreground`}>{t("systemAccount")}</span>}
            {!a.active && <span className={`${badge} bg-secondary text-muted-foreground`}>{t("inactive")}</span>}
            {canEdit && <span className="ml-auto flex items-center gap-2">
              <button type="button" onClick={() => onEdit(a)} title={t("editAccount")}><Pencil className="h-3.5 w-3.5 text-muted-foreground" /></button>
              {!a.isSystem && <button type="button" onClick={() => onToggle(a)} title={a.active ? t("deactivate") : t("activate")}>{a.active ? <EyeOff className="h-3.5 w-3.5 text-muted-foreground" /> : <Eye className="h-3.5 w-3.5 text-green-600" />}</button>}
            </span>}
          </div>
          {open && kids.length > 0 && render(a.children ?? [], depth + 1)}
        </div>
      );
    });
  return <div className="overflow-x-auto rounded-lg border border-border">{render(nodes, 0)}</div>;
}
