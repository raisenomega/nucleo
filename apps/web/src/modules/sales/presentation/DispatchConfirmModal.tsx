import { useState } from "react";
import { PackageCheck, AlertTriangle } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { ScreenModal } from "@shared/components/ScreenModal";
import type { DeliveryNote } from "@sales/domain/delivery-note.types";

// Confirmación de despacho: avisa que se deducirá el stock (irreversible) + lista items. onConfirm llama al RPC.
export function DispatchConfirmModal({ note, onConfirm, onClose }: {
  note: DeliveryNote; onConfirm: () => Promise<void>; onClose: () => void;
}) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const run = async () => { setBusy(true); await onConfirm(); setBusy(false); };
  return (
    <ScreenModal onClose={onClose}>
      <div className="space-y-4 p-6">
        <div className="flex items-center gap-2 text-foreground"><PackageCheck className="h-6 w-6 text-primary" /><h2 className="font-display text-lg font-bold">{t("dispatchConfirmation")} {note.noteNumber}</h2></div>
        <p className="flex items-start gap-2 rounded-lg bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{t("stockWillBeDeducted")} {t("cannotUndo")}</p>
        <ul className="space-y-1 text-sm">{note.items.filter((i) => i.itemId).map((i) => (
          <li key={i.id} className="flex justify-between rounded bg-secondary px-3 py-2"><span>{i.description}</span><span className="font-bold">{i.qtyDispatched}</span></li>))}</ul>
        <div className="flex gap-2">
          <button type="button" disabled={busy} onClick={() => void run()} className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-bold disabled:opacity-50">{t("dispatch")}</button>
          <button type="button" onClick={onClose} className="rounded-lg bg-secondary px-4 py-2 text-sm">{t("cancel")}</button>
        </div>
      </div>
    </ScreenModal>
  );
}
