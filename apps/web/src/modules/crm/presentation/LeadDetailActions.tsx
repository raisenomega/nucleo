import { Archive, Copy, Pencil, Receipt, Send } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";

// Acciones del header del detalle, gateadas por module_access (leads). Convertir/Enviar son placeholder.
export function LeadDetailActions({ onEdit, onDuplicate, onArchive }: {
  onEdit: () => void; onDuplicate: () => void; onArchive: () => void;
}) {
  const { t } = useI18n();
  const { can } = useModuleAccess();
  const edit = can("leads", "edit"), create = can("leads", "create");
  const b = "flex items-center gap-1 rounded-lg bg-secondary px-2 py-1 text-xs font-body hover:bg-primary hover:text-primary-foreground";
  return (
    <div className="flex flex-wrap gap-2">
      {edit && <button type="button" onClick={onEdit} className={b}><Pencil className="h-3 w-3" /> {t("edit")}</button>}
      {create && <button type="button" onClick={onDuplicate} className={b}><Copy className="h-3 w-3" /> {t("duplicate")}</button>}
      {edit && <button type="button" onClick={onArchive} className={b}><Archive className="h-3 w-3" /> {t("archive")}</button>}
      {edit && <button type="button" onClick={() => window.alert(t("invoicePlaceholder"))} className={b}><Receipt className="h-3 w-3" /> {t("convertToInvoice")}</button>}
      {edit && <button type="button" onClick={() => window.alert(t("comingSoon"))} className={b}><Send className="h-3 w-3" /> {t("send")}</button>}
    </div>
  );
}
