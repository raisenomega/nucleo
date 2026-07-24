import { useState } from "react";
import { X } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { useRoleGate } from "@shared/hooks/useRoleGate";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";
import { ScreenModal } from "@shared/components/ScreenModal";
import { CountLinesTable } from "@fieldops/presentation/CountLinesTable";
import { CountSummary } from "@fieldops/presentation/CountSummary";
import type { InventoryCount } from "@fieldops/domain/inventory-count.types";

// Detalle del conteo: resumen + líneas + acciones según estado/rol. El contador ciego no ve esperado/varianza.
export function CountDetail({ count, onRecord, onApprove, onApply, onClose }: {
  count: InventoryCount; onRecord: (edits: { id: string; qty: number }[]) => void;
  onApprove: (ids: string[], action: "approve" | "reject") => void; onApply: () => void; onClose: () => void;
}) {
  const { t } = useI18n();
  const { canEdit } = useRoleGate();
  const { can } = useModuleAccess();
  const isCeo = canEdit("ceo");
  const editable = can("inventory", "edit") && (count.status === "draft" || count.status === "in_progress");
  const showExpected = !(count.blindCount && count.status === "in_progress" && !isCeo);
  const selectable = isCeo && count.status === "completed";
  const [counted, setCounted] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const lines = count.lines ?? [];
  const toggle = (id: string) => setSelected((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const save = () => { const edits = Object.entries(counted).filter(([, v]) => v !== "").map(([id, v]) => ({ id, qty: Number(v) })); if (edits.length) onRecord(edits); setCounted({}); };
  const targetIds = () => (selected.size ? [...selected] : lines.filter((l) => l.lineStatus !== "applied").map((l) => l.id));
  const btn = "rounded-lg px-4 py-2 font-body font-bold";
  return (
    <ScreenModal onClose={onClose}>
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="font-display text-lg font-bold text-foreground">{count.countNumber}{count.assignedToName && <span className="ml-2 text-sm font-normal text-muted-foreground">· {count.assignedToName}</span>}</h2>
        <button type="button" onClick={onClose} aria-label={t("cancel")}><X className="h-6 w-6" /></button>
      </div>
      <div className="space-y-4 p-4">
        {count.status !== "draft" && count.status !== "in_progress" && <CountSummary count={count} />}
        {count.notes && <p className="text-sm text-muted-foreground">{count.notes}</p>}
        <CountLinesTable lines={lines} editable={editable} showExpected={showExpected} selectable={selectable} counted={counted} onCount={(id, v) => setCounted((c) => ({ ...c, [id]: v }))} selected={selected} onToggle={toggle} />
        <div className="flex flex-wrap gap-2">
          {editable && <button type="button" onClick={save} className={`${btn} bg-primary text-primary-foreground`}>{t("recordCount")}</button>}
          {selectable && <>
            <button type="button" onClick={() => onApprove(targetIds(), "approve")} className={`${btn} bg-primary text-primary-foreground`}>{selected.size ? t("approveSelected") : t("approveAll")}</button>
            <button type="button" onClick={() => onApprove(targetIds(), "reject")} className={`${btn} border border-destructive text-destructive`}>{selected.size ? t("rejectSelected") : t("rejectAll")}</button>
          </>}
          {isCeo && count.status === "approved" && <button type="button" onClick={() => { if (window.confirm(`${t("applyAdjustments")}?`)) onApply(); }} className={`${btn} bg-primary text-primary-foreground`}>{t("applyAdjustments")}</button>}
        </div>
      </div>
    </ScreenModal>
  );
}
