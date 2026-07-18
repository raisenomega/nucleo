import { PackagePlus, SlidersHorizontal, PackageMinus, Pencil, Trash2 } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";

// Acciones por fila de inventario (extraído para mantener InventoryTable ≤75). Reabastecer/ajustar/merma/editar/borrar.
export function InventoryRowActions({ id, onRestock, onAdjust, onShrink, onEdit, onDelete }: {
  id: string; onRestock: (id: string) => void; onAdjust: (id: string) => void; onShrink: (id: string) => void;
  onEdit: (id: string) => void; onDelete: (id: string) => void;
}) {
  const { t } = useI18n();
  const { can } = useModuleAccess();
  const edit = can("inventory", "edit");
  return (
    <div className="flex justify-end gap-2">
      {edit && <button type="button" onClick={() => onRestock(id)} aria-label={t("restock")} className="text-primary"><PackagePlus className="h-4 w-4" /></button>}
      {edit && <button type="button" onClick={() => onAdjust(id)} aria-label={t("adjustStock")} className="text-foreground"><SlidersHorizontal className="h-4 w-4" /></button>}
      {edit && <button type="button" onClick={() => onShrink(id)} aria-label={t("registerShrinkage")} className="text-amber-600"><PackageMinus className="h-4 w-4" /></button>}
      {edit && <button type="button" onClick={() => onEdit(id)} aria-label={t("edit")} className="text-foreground"><Pencil className="h-4 w-4" /></button>}
      {can("inventory", "delete") && <button type="button" onClick={() => onDelete(id)} aria-label={t("delete")} className="text-destructive"><Trash2 className="h-4 w-4" /></button>}
    </div>
  );
}
