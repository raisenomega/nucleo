import { useState } from "react";
import { X } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { ScreenModal } from "@shared/components/ScreenModal";

// Nota de gestión de cobro: textarea simple -> append a route_stops.notes con timestamp (en el repo).
export function NotaGestionForm({ clientName, onClose, onSubmit }: {
  clientName: string; onClose: () => void; onSubmit: (text: string) => void;
}) {
  const { t } = useI18n();
  const [text, setText] = useState("");
  return (
    <ScreenModal onClose={onClose}>
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="font-display text-lg font-bold text-primary">{t("managementNote")} — {clientName}</h2>
        <button type="button" onClick={onClose} aria-label={t("cancel")}><X className="h-6 w-6" /></button>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); if (text.trim()) onSubmit(text.trim()); }} className="flex flex-1 flex-col gap-4 p-4">
        <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={t("managementNote")} rows={5}
          className="w-full rounded-lg border border-border bg-background p-3 text-sm" />
        <button type="submit" disabled={!text.trim()} className="mt-auto h-12 w-full rounded-lg bg-primary text-base font-bold text-primary-foreground disabled:opacity-50">{t("addNote")}</button>
      </form>
    </ScreenModal>
  );
}
