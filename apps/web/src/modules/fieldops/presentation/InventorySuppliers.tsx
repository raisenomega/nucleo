import { useMemo, useState } from "react";
import { useI18n } from "@shared/i18n";
import { useToast } from "@shared/providers/toast-context";
import { SuppliersTable } from "@fieldops/presentation/SuppliersTable";
import { SupplierForm } from "@fieldops/presentation/SupplierForm";
import type { Supplier, SupplierFormData } from "@fieldops/domain/supplier.types";

// Sección de proveedores: tabla + modal crear/editar. El route inyecta los datos y handlers (DI, sin infra aquí).
export function InventorySuppliers({ items, onSave, onToggle }: {
  items: readonly Supplier[]; onSave: (id: string | null, d: SupplierFormData) => Promise<boolean>; onToggle: (s: Supplier) => void;
}) {
  const { t } = useI18n();
  const toast = useToast();
  const [editing, setEditing] = useState<string | null>(null);
  const initial = useMemo<SupplierFormData | undefined>(() => items.find((x) => x.id === editing), [editing, items]);
  async function submit(d: SupplierFormData) { const ok = await onSave(editing === "new" ? null : editing, d); if (ok) { setEditing(null); toast.success(t("saved")); } else toast.error(t("uploadError")); }
  return (
    <>
      <SuppliersTable rows={items} onAdd={() => setEditing("new")} onEdit={setEditing} onToggle={onToggle} />
      {editing !== null && <SupplierForm initial={initial} onSubmit={submit} onCancel={() => setEditing(null)} />}
    </>
  );
}
