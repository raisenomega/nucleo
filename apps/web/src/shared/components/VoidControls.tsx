import { useState } from "react";
import { Ban } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { useToast } from "@shared/providers/toast-context";
import { VoidModal } from "@shared/components/VoidModal";
import { VoidedBadge } from "@shared/components/VoidedBadge";

type R = { ok: boolean; error?: string };

// Controles VOID por fila: si está anulada → badge (+ "eliminar definitivamente" solo CEO);
// si no → botón VOID que abre el modal de motivo. Muestra toast del resultado de la RPC.
export function VoidControls({ id, deletedAt, deletedByName, deletedReason, isCeo, onVoid, onDeleteForever }: {
  id: string; deletedAt: string | null; deletedByName?: string; deletedReason?: string | null; isCeo: boolean;
  onVoid: (id: string, reason: string) => Promise<R>; onDeleteForever: (id: string) => Promise<R>;
}) {
  const { t } = useI18n();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  if (deletedAt) {
    return (
      <span className="flex items-center gap-2">
        <VoidedBadge name={deletedByName} date={deletedAt} reason={deletedReason} />
        {isCeo && <button type="button" className="text-xs font-bold text-destructive underline" onClick={async () => {
          if (!window.confirm(t("deleteForeverConfirm"))) return;
          const r = await onDeleteForever(id);
          toast[r.ok ? "success" : "error"](r.ok ? t("deleteForeverSuccess") : (r.error ?? t("voidError")));
        }}>{t("deleteForeverBtn")}</button>}
      </span>
    );
  }
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label={t("voidBtn")} title={t("voidBtn")} className="text-destructive"><Ban className="h-4 w-4" /></button>
      {open && <VoidModal onClose={() => setOpen(false)} onConfirm={async (reason) => {
        setOpen(false);
        const r = await onVoid(id, reason);
        toast[r.ok ? "success" : "error"](r.ok ? t("voidSuccess") : (r.error ?? t("voidError")));
      }} />}
    </>
  );
}
