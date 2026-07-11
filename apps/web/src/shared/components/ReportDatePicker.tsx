import { useState } from "react";
import { useI18n } from "@shared/i18n";
import { ScreenModal } from "@shared/components/ScreenModal";

// Selector de rango de fechas para reportes PDF. La página implementa onGenerate
// (arma el body desde sus filas y llama generatePdf). Devuelve true si salió OK.
export function ReportDatePicker({ title, onGenerate, onClose }: {
  title: string; onGenerate: (from: string, to: string) => Promise<boolean>; onClose: () => void;
}) {
  const { t } = useI18n();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [busy, setBusy] = useState(false);
  async function go() { setBusy(true); const ok = await onGenerate(from, to); setBusy(false); if (ok) onClose(); }
  const fld = "w-full rounded-lg border border-border bg-background p-2 text-sm";
  const lbl = "text-xs font-bold text-muted-foreground";
  return (
    <ScreenModal onClose={onClose}>
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="font-display text-lg font-bold text-foreground">{title}</h2>
      </div>
      <div className="space-y-3 p-4">
        <label className="block space-y-1"><span className={lbl}>{t("from")}</span>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={fld} /></label>
        <label className="block space-y-1"><span className={lbl}>{t("to")}</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={fld} /></label>
        <button type="button" disabled={busy} onClick={() => void go()}
          className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-bold disabled:opacity-50">{busy ? t("generatingPdf") : t("exportPdf")}</button>
      </div>
    </ScreenModal>
  );
}
